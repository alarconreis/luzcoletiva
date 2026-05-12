"""
Rota de perfil: retorna e edita dados do usuário autenticado.
"""
import os
import secrets
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.deps import get_current_user
from app.core.limiter import limiter
from app.core.security import hash_password, verify_password
from app.models.audit import AdminAuditLog
from app.models.help import (
    ChatMessage, ChatReport, HelpOffer, HelpRequest, HelpRequestStatus,
)
from app.models.user import User, ProfileType
from app.schemas.user import ProfileUpdate, UserOut

router = APIRouter(prefix="/api", tags=["profile"])

_STATUS_LABEL = {
    HelpRequestStatus.open: "em aberto",
    HelpRequestStatus.proposed: "proposto",
    HelpRequestStatus.matched: "em andamento",
    HelpRequestStatus.closed: "concluído",
    HelpRequestStatus.cancelled: "cancelado",
}


@router.get("/profile", response_model=UserOut)
@limiter.limit("60/minute")
def profile(request: Request, current_user: User = Depends(get_current_user)):
    return UserOut.model_validate(current_user)


@router.patch("/profile", response_model=UserOut)
@limiter.limit("10/minute")
def update_profile(
    payload: ProfileUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if payload.new_password:
        if not verify_password(payload.current_password, current_user.hashed_password):
            raise HTTPException(400, "Senha atual incorreta")
        current_user.hashed_password = hash_password(payload.new_password)
        xff = request.headers.get("x-forwarded-for", "")
        ip = xff.split(",")[0].strip() if xff else (request.client.host if request.client else "unknown")
        db.add(AdminAuditLog(
            actor_id=current_user.id,
            actor_email=current_user.email,
            target_id=current_user.id,
            target_email=current_user.email,
            action="password_change",
            details="Usuário alterou a própria senha",
            ip=ip,
        ))
    if payload.name is not None:
        current_user.name = payload.name.strip()
    if payload.phone is not None:
        current_user.phone = payload.phone.strip() or None
    db.commit()
    db.refresh(current_user)
    return UserOut.model_validate(current_user)


@router.get("/profile/history")
@limiter.limit("60/minute")
def profile_history(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.profile_type == ProfileType.helper:
        rows = (
            db.query(HelpOffer, HelpRequest)
            .join(HelpRequest, HelpRequest.id == HelpOffer.request_id)
            .filter(HelpOffer.helper_id == current_user.id)
            .order_by(HelpOffer.created_at.desc())
            .all()
        )
        items = [
            {
                "id": req.id,
                "title": req.title,
                "status": _STATUS_LABEL.get(req.status, req.status.value),
                "date": offer.created_at.isoformat(),
                "type": "offer",
            }
            for offer, req in rows
        ]
    else:
        rows = (
            db.query(HelpRequest)
            .filter(HelpRequest.requester_id == current_user.id)
            .order_by(HelpRequest.created_at.desc())
            .all()
        )
        items = [
            {
                "id": req.id,
                "title": req.title,
                "status": _STATUS_LABEL.get(req.status, req.status.value),
                "date": req.created_at.isoformat(),
                "type": "request",
            }
            for req in rows
        ]

    return {"user_id": current_user.id, "items": items}


# ============================================
# LGPD — Direitos do titular (Art. 18)
# ============================================

@router.get("/profile/export")
@limiter.limit("3/hour")
def export_my_data(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Exporta tudo que a plataforma armazena sobre o usuário autenticado (LGPD Art. 18, II e V)."""
    requests_made = (
        db.query(HelpRequest)
        .filter(HelpRequest.requester_id == current_user.id)
        .all()
    )
    offers_made = (
        db.query(HelpOffer)
        .filter(HelpOffer.helper_id == current_user.id)
        .all()
    )
    messages_sent = (
        db.query(ChatMessage)
        .filter(ChatMessage.sender_id == current_user.id)
        .all()
    )
    reports_filed = (
        db.query(ChatReport)
        .filter(ChatReport.reporter_id == current_user.id)
        .all()
    )

    return {
        "exported_at": datetime.now(timezone.utc).isoformat(),
        "user": {
            "id": current_user.id,
            "name": current_user.name,
            "email": current_user.email,
            "phone": current_user.phone,
            "profile_type": current_user.profile_type.value,
            "role": current_user.role.value,
            "doc_type": current_user.doc_type.value,
            "cpf": current_user.cpf,
            "rg": current_user.rg,
            "cnpj": current_user.cnpj,
            "is_active": current_user.is_active,
            "is_approved": current_user.is_approved,
            "is_verified": current_user.is_verified,
            "trust_level": current_user.trust_level.value,
            "avg_rating": current_user.avg_rating,
            "rating_count": current_user.rating_count,
            "selfie_path": current_user.selfie_path,
            "doc_photo_path": current_user.doc_photo_path,
            "terms_accepted_at": current_user.terms_accepted_at.isoformat() if current_user.terms_accepted_at else None,
            "privacy_accepted_at": current_user.privacy_accepted_at.isoformat() if current_user.privacy_accepted_at else None,
            "terms_version": current_user.terms_version,
            "consent_ip": current_user.consent_ip,
            "biometric_consent_at": current_user.biometric_consent_at.isoformat() if current_user.biometric_consent_at else None,
            "created_at": current_user.created_at.isoformat() if current_user.created_at else None,
            "updated_at": current_user.updated_at.isoformat() if current_user.updated_at else None,
        },
        "help_requests": [
            {
                "id": r.id, "title": r.title, "description": r.description,
                "category": r.category.value if hasattr(r.category, "value") else r.category,
                "city": r.city, "state": r.state,
                "status": r.status.value if hasattr(r.status, "value") else r.status,
                "value": r.value,
                "created_at": r.created_at.isoformat() if r.created_at else None,
            }
            for r in requests_made
        ],
        "help_offers": [
            {
                "id": o.id, "request_id": o.request_id, "message": o.message,
                "status": o.status.value if hasattr(o.status, "value") else o.status,
                "created_at": o.created_at.isoformat() if o.created_at else None,
            }
            for o in offers_made
        ],
        "chat_messages": [
            {
                "id": m.id, "request_id": m.request_id, "content": m.content,
                "is_redacted": m.is_redacted,
                "created_at": m.created_at.isoformat() if m.created_at else None,
            }
            for m in messages_sent
        ],
        "reports_filed": [
            {
                "id": r.id, "request_id": r.request_id, "reason": r.reason,
                "resolved": r.resolved,
                "created_at": r.created_at.isoformat() if r.created_at else None,
            }
            for r in reports_filed
        ],
    }


def _safe_unlink(path: str | None) -> None:
    """Remove um arquivo de upload se existir; ignora erros."""
    if not path:
        return
    try:
        # path geralmente é relativo a UPLOAD_DIR (ver app.core.uploads)
        from app.core.uploads import UPLOAD_DIR
        full = os.path.join(UPLOAD_DIR, os.path.basename(path))
        if os.path.isfile(full):
            os.unlink(full)
    except Exception:  # noqa: BLE001
        pass


@router.delete("/profile")
@limiter.limit("3/hour")
def delete_my_account(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Anonimização irreversível do usuário (LGPD Art. 18, VI).

    Não fazemos hard-delete: outros usuários se relacionaram com este (chats,
    ofertas, ratings) e precisam ver "Usuário removido" em vez de a referência
    sumir. Removemos PII, apagamos arquivos de selfie/doc e bloqueamos login.
    """
    if current_user.deleted_at is not None:
        raise HTTPException(400, "Conta já foi removida")

    xff = request.headers.get("x-forwarded-for", "")
    ip = (
        request.headers.get("cf-connecting-ip", "").strip()
        or (xff.split(",")[0].strip() if xff else "")
        or (request.client.host if request.client else "unknown")
    )

    # Apaga arquivos de mídia
    _safe_unlink(current_user.selfie_path)
    _safe_unlink(current_user.doc_photo_path)

    # Anonimiza PII e bloqueia login
    now = datetime.now(timezone.utc)
    suffix = secrets.token_hex(4)
    current_user.name = "Usuário removido"
    current_user.email = f"deleted-{current_user.id}-{suffix}@anon.local"
    current_user.phone = None
    current_user.cpf = None
    current_user.rg = None
    current_user.cnpj = None
    current_user.selfie_path = None
    current_user.doc_photo_path = None
    current_user.hashed_password = secrets.token_urlsafe(48)
    current_user.is_active = False
    current_user.is_approved = False
    current_user.reset_token_hash = None
    current_user.reset_token_expires_at = None
    current_user.deleted_at = now

    # Registra para auditoria (mantemos esse log por obrigação legal)
    db.add(AdminAuditLog(
        actor_id=current_user.id,
        actor_email=f"deleted-{current_user.id}@anon.local",
        target_id=current_user.id,
        target_email=f"deleted-{current_user.id}@anon.local",
        action="self_delete",
        details="Usuário solicitou exclusão da própria conta (LGPD Art. 18, VI)",
        ip=ip,
    ))
    db.commit()
    return {"status": "deleted", "message": "Sua conta foi removida e anonimizada."}
