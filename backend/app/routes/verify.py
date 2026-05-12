"""
Endpoints de verificação de identidade.

Fluxo:
  POST /api/verify/submit  (multipart: rg, selfie, keep_avatar)
    → cria attempt, processa síncrono via Vision, retorna resultado
  GET  /api/verify/status  → status atual do usuário
"""
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import (
    APIRouter, Depends, File, Form, HTTPException, Request, UploadFile, status
)
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.deps import get_current_user
from app.core.limiter import limiter
from app.core.storage import write_image
from app.core.vision import (
    analyze_document, analyze_face_match, analyze_liveness, name_similarity,
)
from app.models.user import User
from app.models.verification import VerificationAttempt, VerificationStatus
from app.schemas.verification import VerificationAttemptOut, VerificationStatusOut
from app.tasks.email_tasks import (
    send_verify_approved, send_verify_rejected, send_verify_manual,
)

router = APIRouter(prefix="/api/verify", tags=["verify"])

# Thresholds (ajustáveis sem mexer em código)
THRESHOLD_DOC = 0.75
THRESHOLD_LIVENESS = 0.70
THRESHOLD_FACE = 0.75
THRESHOLD_NAME = 0.40         # frouxo de propósito (apelido, sobrenome só)
MANUAL_BAND = 0.10            # zona cinzenta vai pra manual

MAX_FILE_BYTES = 8 * 1024 * 1024  # 8 MB cada


def _client_ip(request: Request) -> str:
    cf_ip = request.headers.get("cf-connecting-ip")
    if cf_ip:
        return cf_ip.strip()
    xff = request.headers.get("x-forwarded-for")
    if xff:
        return xff.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def _attempts_last_24h(db: Session, user_id: int) -> int:
    since = datetime.now(timezone.utc) - timedelta(hours=24)
    return (
        db.query(VerificationAttempt)
        .filter(
            VerificationAttempt.user_id == user_id,
            VerificationAttempt.created_at >= since,
        )
        .count()
    )


@router.get("/status", response_model=VerificationStatusOut)
@limiter.limit("60/minute")
def status_endpoint(
    request: Request,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    last = (
        db.query(VerificationAttempt)
        .filter(VerificationAttempt.user_id == user.id)
        .order_by(VerificationAttempt.created_at.desc())
        .first()
    )
    attempts = _attempts_last_24h(db, user.id)
    return VerificationStatusOut(
        is_verified=user.is_verified,
        status=last.status.value if last else None,
        rejection_reason=last.rejection_reason if last else None,
        can_retry=(not user.is_verified) and attempts < settings.VERIFY_MAX_ATTEMPTS_24H,
        attempts_last_24h=attempts,
        selfie_keep_as_avatar=last.selfie_keep_as_avatar if last else False,
    )


@router.post("/submit", response_model=VerificationAttemptOut)
@limiter.limit("3/hour")
def submit(
    request: Request,
    rg: UploadFile = File(...),
    selfie: UploadFile = File(...),
    keep_avatar: bool = Form(False),
    biometric_consent: bool = Form(False),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if user.is_verified:
        raise HTTPException(400, "Você já está verificado")
    if not biometric_consent:
        raise HTTPException(
            400,
            "É necessário consentir com o tratamento de dado biométrico (selfie + face match) para prosseguir.",
        )
    user.biometric_consent_at = datetime.now(timezone.utc)
    db.commit()

    if _attempts_last_24h(db, user.id) >= settings.VERIFY_MAX_ATTEMPTS_24H:
        raise HTTPException(
            429,
            f"Limite de {settings.VERIFY_MAX_ATTEMPTS_24H} tentativas em 24h atingido. "
            "Sua próxima tentativa entrará em fila de revisão manual.",
        )

    # Validação básica de upload
    rg_bytes = rg.file.read()
    selfie_bytes = selfie.file.read()
    if len(rg_bytes) == 0 or len(selfie_bytes) == 0:
        raise HTTPException(400, "Arquivo vazio")
    if len(rg_bytes) > MAX_FILE_BYTES or len(selfie_bytes) > MAX_FILE_BYTES:
        raise HTTPException(400, "Arquivo maior que 8MB")
    for ct in (rg.content_type or "", selfie.content_type or ""):
        if not ct.startswith("image/"):
            raise HTTPException(400, "Apenas imagens são aceitas")

    # Cria attempt em status pending
    attempt = VerificationAttempt(
        user_id=user.id,
        status=VerificationStatus.processing,
        selfie_keep_as_avatar=keep_avatar,
        ip=_client_ip(request),
        user_agent=request.headers.get("user-agent", "")[:500],
    )
    db.add(attempt)
    db.commit()
    db.refresh(attempt)

    # Persiste cifrado
    try:
        write_image(user.id, attempt.id, "rg", rg_bytes)
        write_image(user.id, attempt.id, "selfie", selfie_bytes)
    except Exception as e:
        attempt.status = VerificationStatus.rejected
        attempt.rejection_reason = "Falha ao armazenar imagem"
        attempt.processed_at = datetime.now(timezone.utc)
        db.commit()
        raise HTTPException(500, "Erro ao salvar imagens") from e

    # Roda os 3 checks (síncrono — leva 5-15s)
    try:
        doc = analyze_document(rg_bytes)
        live = analyze_liveness(selfie_bytes)
        match = analyze_face_match(rg_bytes, selfie_bytes)
    except Exception as e:
        attempt.status = VerificationStatus.manual
        attempt.rejection_reason = "Erro ao processar — em revisão manual"
        attempt.processed_at = datetime.now(timezone.utc)
        db.commit()
        raise HTTPException(500, "Erro ao analisar imagens. Tente novamente mais tarde.") from e

    # Extrai scores
    doc_score = float(doc.get("confidence", 0)) if doc.get("is_document") else 0.0
    live_score = float(live.get("confidence", 0)) if live.get("is_live_person") and not live.get("is_screen_photo") and not live.get("is_photo_of_photo") else 0.0
    face_score = float(match.get("match_score", 0)) if match.get("same_person") else 0.0

    # Cruzamento de nome
    extracted_name = doc.get("extracted_name")
    name_score = name_similarity(extracted_name, user.name)

    attempt.score_document = doc_score
    attempt.score_liveness = live_score
    attempt.score_face_match = face_score
    attempt.extracted_name = extracted_name[:160] if extracted_name else None
    attempt.extracted_birthdate = (doc.get("extracted_birthdate") or "")[:20] or None
    attempt.name_match_score = name_score
    attempt.processed_at = datetime.now(timezone.utc)

    # Decisão
    rejected_reasons = []
    if doc_score < (THRESHOLD_DOC - MANUAL_BAND):
        rejected_reasons.append("documento não reconhecido como RG/CNH")
    if live_score < (THRESHOLD_LIVENESS - MANUAL_BAND):
        rejected_reasons.append("selfie não passou no liveness")
    if face_score < (THRESHOLD_FACE - MANUAL_BAND):
        rejected_reasons.append("rosto da selfie não corresponde ao do documento")
    if name_score < (THRESHOLD_NAME - MANUAL_BAND):
        rejected_reasons.append("nome do documento não bate com o cadastro")

    in_manual_band = (
        (THRESHOLD_DOC - MANUAL_BAND <= doc_score < THRESHOLD_DOC) or
        (THRESHOLD_LIVENESS - MANUAL_BAND <= live_score < THRESHOLD_LIVENESS) or
        (THRESHOLD_FACE - MANUAL_BAND <= face_score < THRESHOLD_FACE) or
        (THRESHOLD_NAME - MANUAL_BAND <= name_score < THRESHOLD_NAME)
    )

    all_pass = (
        doc_score >= THRESHOLD_DOC and
        live_score >= THRESHOLD_LIVENESS and
        face_score >= THRESHOLD_FACE and
        name_score >= THRESHOLD_NAME
    )

    if all_pass:
        attempt.status = VerificationStatus.approved
        attempt.final_decision = "auto_approved"
        user.is_verified = True
    elif rejected_reasons and not in_manual_band:
        attempt.status = VerificationStatus.rejected
        attempt.final_decision = "auto_rejected"
        attempt.rejection_reason = "; ".join(rejected_reasons)
    else:
        attempt.status = VerificationStatus.manual
        attempt.final_decision = "needs_manual"
        attempt.rejection_reason = "Em análise manual pela equipe"

    db.commit()
    db.refresh(attempt)

    # Dispara e-mail conforme resultado (best-effort)
    try:
        if attempt.status == VerificationStatus.approved:
            send_verify_approved.delay(user.email, user.name)
        elif attempt.status == VerificationStatus.rejected:
            send_verify_rejected.delay(user.email, user.name, attempt.rejection_reason or "")
        elif attempt.status == VerificationStatus.manual:
            send_verify_manual.delay(user.email, user.name)
    except Exception:
        pass

    return attempt
