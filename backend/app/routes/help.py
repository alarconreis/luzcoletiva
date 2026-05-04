"""
Endpoints de pedidos de ajuda, ofertas e chat.

Regras de visibilidade:
- Helper vê /help-requests (lista pública anonimizada)
- Solicitante vê /my-requests (seus próprios pedidos)
- Detalhe + chat só para envolvidos (dono + helper aceito)
"""
import pathlib
from typing import Optional, Union

from fastapi import APIRouter, Depends, File, Form, HTTPException, Request, UploadFile
from fastapi.responses import FileResponse
from sqlalchemy import case
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.core.limiter import limiter
from app.core.moderation import check_message
from app.core.uploads import UPLOAD_DIR, save_upload
from app.models.help import (
    ChatMessage, ChatReport, HelpOffer, HelpOfferStatus,
    HelpRequest, HelpRequestStatus, HelpCategory,
)
from app.models.user import User, ProfileType, UserRole, TrustLevel, TRUST_OFFER_LIMITS
from app.tasks.email_tasks import (
    send_offer_received, send_offer_accepted, send_offer_declined,
    send_admin_report,
)
from app.core.config import settings as app_settings
from app.schemas.help import (
    ChatMessageCreate, ChatMessageOut, ChatReportCreate,
    HelpOfferCreate, HelpOfferOut,
    HelpRequestDetail, HelpRequestPublic,
)

import redis as _redis
from app.tasks.email_tasks import send_chat_pending


def _notify_chat_recipient(db, req: HelpRequest, sender_id: int):
    """Notifica o outro lado do chat com debounce de 30min via Redis."""
    try:
        # Identifica o destinatário
        recipient_id = None
        if req.requester_id == sender_id and req.accepted_offer_id:
            offer = db.query(HelpOffer).filter(HelpOffer.id == req.accepted_offer_id).first()
            if offer:
                recipient_id = offer.helper_id
        elif req.accepted_offer_id:
            recipient_id = req.requester_id
        if not recipient_id:
            return

        recipient = db.query(User).filter(User.id == recipient_id).first()
        if not recipient or not recipient.email:
            return

        # Debounce via Redis: chave por (req, recipient) com TTL de 30min
        r = _redis.from_url(app_settings.REDIS_URL)
        key = f"chat-notify:{req.id}:{recipient_id}"
        # incrementa contador; se for o primeiro hit no janela, agenda task
        new_count = r.incr(key)
        if new_count == 1:
            r.expire(key, app_settings.EMAIL_CHAT_DEBOUNCE_MIN * 60)
            # agenda task pra rodar daqui 30min com o contador atualizado naquele momento
            send_chat_pending.apply_async(
                args=[recipient.email, recipient.name, req.title, req.id, 1],
                countdown=app_settings.EMAIL_CHAT_DEBOUNCE_MIN * 60,
            )
    except Exception:
        pass

router = APIRouter(prefix="/api", tags=["help"])


def _ensure_requester(user: User):
    if user.profile_type != ProfileType.requester:
        raise HTTPException(403, "Apenas solicitantes podem realizar esta ação")


def _ensure_helper(user: User):
    if user.profile_type != ProfileType.helper:
        raise HTTPException(403, "Apenas ajudantes podem realizar esta ação")


def _ensure_verified(user: User):
    if not user.is_verified:
        raise HTTPException(
            403,
            "Verificação obrigatória: você precisa verificar sua identidade antes desta ação. Acesse /verify-identity."
        )



def _is_involved(req: HelpRequest, user: User, db: Session) -> bool:
    """User é o dono OU o helper da oferta aceita."""
    if req.requester_id == user.id:
        return True
    if req.accepted_offer_id:
        offer = db.query(HelpOffer).filter(HelpOffer.id == req.accepted_offer_id).first()
        if offer and offer.helper_id == user.id:
            return True
    return False


# -------------------- Pedidos --------------------

_ACTIVE_STATUSES = [
    HelpRequestStatus.pending_review,
    HelpRequestStatus.open,
    HelpRequestStatus.proposed,
    HelpRequestStatus.matched,
]

_ENDED_STATUSES = [HelpRequestStatus.closed, HelpRequestStatus.cancelled]

COOLDOWN_DAYS = 15


def _check_active_limit(user: User, db: Session) -> None:
    """Máximo de 1 pedido ativo por usuário."""
    active = (
        db.query(HelpRequest)
        .filter(HelpRequest.requester_id == user.id, HelpRequest.status.in_(_ACTIVE_STATUSES))
        .count()
    )
    if active >= 1:
        raise HTTPException(
            400,
            "Você já tem 1 pedido ativo. Conclua ou cancele o pedido atual antes de criar um novo.",
        )


def _check_cooldown(user: User, db: Session) -> None:
    """Intervalo mínimo de 15 dias entre pedidos após o encerramento do anterior."""
    from datetime import datetime, timedelta, timezone
    cutoff = datetime.now(timezone.utc) - timedelta(days=COOLDOWN_DAYS)
    last_ended = (
        db.query(HelpRequest)
        .filter(
            HelpRequest.requester_id == user.id,
            HelpRequest.status.in_(_ENDED_STATUSES),
            HelpRequest.updated_at >= cutoff,
        )
        .order_by(HelpRequest.updated_at.desc())
        .first()
    )
    if last_ended:
        from math import ceil
        elapsed = (datetime.now(timezone.utc) - last_ended.updated_at.replace(tzinfo=timezone.utc)).total_seconds()
        days_left = ceil((COOLDOWN_DAYS * 86400 - elapsed) / 86400)
        raise HTTPException(
            400,
            f"Aguarde mais {days_left} dia(s) para criar um novo pedido. "
            f"O intervalo mínimo entre pedidos é de {COOLDOWN_DAYS} dias.",
        )


@router.post("/help-requests", response_model=HelpRequestDetail, status_code=201)
@limiter.limit("10/hour")
async def create_request(
    request: Request,
    title: str = Form(..., min_length=5, max_length=120),
    description: str = Form(..., min_length=10, max_length=2000),
    category: HelpCategory = Form(...),
    city: str = Form(..., min_length=2, max_length=80),
    state: str = Form(..., min_length=2, max_length=2),
    value: float = Form(..., ge=50.0, le=300.0, description="Valor solicitado em reais (R$ 50–300)"),
    document: UploadFile = File(..., description="Comprovante, orçamento ou outro documento que prove a necessidade"),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    _ensure_requester(user)
    _check_active_limit(user, db)
    _check_cooldown(user, db)
    filename = await save_upload(document)
    req = HelpRequest(
        requester_id=user.id,
        title=title.strip(),
        description=description.strip(),
        category=category,
        city=city.strip(),
        state=state.strip().upper(),
        value=value,
        status=HelpRequestStatus.pending_review,
        document_path=filename,
    )
    db.add(req)
    db.commit()
    db.refresh(req)
    return req


@router.get("/help-requests/{req_id}/document")
@limiter.limit("30/minute")
def get_document(
    req_id: int,
    request: Request,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    req = db.query(HelpRequest).filter(HelpRequest.id == req_id).first()
    if not req:
        raise HTTPException(404, "Pedido não encontrado")
    if user.role not in (UserRole.moderator, UserRole.admin) and req.requester_id != user.id:
        raise HTTPException(403, "Acesso negado")
    if not req.document_path:
        raise HTTPException(404, "Nenhum documento anexado")
    path = UPLOAD_DIR / req.document_path
    if not path.exists():
        raise HTTPException(404, "Arquivo não encontrado no servidor")
    return FileResponse(str(path))


@router.get("/help-requests", response_model=list[HelpRequestPublic])
@limiter.limit("60/minute")
def list_open_requests(
    request: Request,
    category: Optional[str] = None,
    state: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    _ensure_helper(user)
    _ensure_verified(user)
    # Pedidos de parceiros validados e confiáveis aparecem primeiro
    trust_order = case(
        (User.trust_level == TrustLevel.parceiro_validado, 1),
        (User.trust_level == TrustLevel.confiavel, 2),
        (User.trust_level == TrustLevel.verificado, 3),
        else_=4,
    )
    query = (
        db.query(HelpRequest)
        .join(User, User.id == HelpRequest.requester_id)
        .filter(HelpRequest.status.in_([HelpRequestStatus.open, HelpRequestStatus.proposed]))
    )
    if category:
        query = query.filter(HelpRequest.category == category)
    if state:
        query = query.filter(HelpRequest.state == state.upper())
    return (
        query
        .order_by(trust_order, HelpRequest.created_at.desc())
        .offset(skip).limit(min(limit, 200)).all()
    )


@router.get("/my-requests", response_model=list[HelpRequestDetail])
@limiter.limit("60/minute")
def my_requests(
    request: Request,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    _ensure_requester(user)
    return (
        db.query(HelpRequest)
        .filter(HelpRequest.requester_id == user.id)
        .order_by(HelpRequest.created_at.desc())
        .all()
    )


@router.get("/help-requests/{req_id}", response_model=Union[HelpRequestDetail, HelpRequestPublic])
@limiter.limit("60/minute")
def get_request(
    req_id: int,
    request: Request,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    req = db.query(HelpRequest).filter(HelpRequest.id == req_id).first()
    if not req:
        raise HTTPException(404, "Pedido não encontrado")
    # Helpers veem pedidos abertos com dados anonimizados — igual à listagem pública
    if (
        user.profile_type == ProfileType.helper
        and req.status in (HelpRequestStatus.open, HelpRequestStatus.proposed)
    ):
        return HelpRequestPublic.model_validate(req)
    # Detalhe completo: apenas dono, helper aceito, ou quem já se ofereceu
    is_owner = req.requester_id == user.id
    has_offer = db.query(HelpOffer).filter(
        HelpOffer.request_id == req_id, HelpOffer.helper_id == user.id
    ).first() is not None
    if not (is_owner or has_offer or _is_involved(req, user, db)):
        raise HTTPException(403, "Acesso negado")
    return HelpRequestDetail.model_validate(req)


@router.post("/help-requests/{req_id}/close", response_model=HelpRequestDetail)
@limiter.limit("20/hour")
def close_request(
    req_id: int,
    request: Request,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    req = db.query(HelpRequest).filter(HelpRequest.id == req_id).first()
    if not req:
        raise HTTPException(404, "Pedido não encontrado")
    if req.status == HelpRequestStatus.pending_review:
        raise HTTPException(400, "Pedido ainda aguarda aprovação da moderação")
    if not _is_involved(req, user, db):
        raise HTTPException(403, "Acesso negado")
    req.status = HelpRequestStatus.closed
    db.commit()
    db.refresh(req)
    return req


# -------------------- Ofertas --------------------

def _check_offer_limit(user: User, db: Session) -> None:
    """Bloqueia nova oferta quando o helper atingiu o limite pendente do seu nível."""
    max_pending = TRUST_OFFER_LIMITS.get(user.trust_level, 3)
    if max_pending is None:
        return
    pending_count = (
        db.query(HelpOffer)
        .filter(
            HelpOffer.helper_id == user.id,
            HelpOffer.status == HelpOfferStatus.pending,
        )
        .count()
    )
    if pending_count >= max_pending:
        raise HTTPException(
            400,
            f"Limite de {max_pending} oferta(s) pendente(s) para o nível "
            f"'{user.trust_level.value}'. Aguarde respostas antes de oferecer novamente.",
        )


@router.post("/help-requests/{req_id}/offers", response_model=HelpOfferOut, status_code=201)
@limiter.limit("20/hour")
def create_offer(
    req_id: int,
    payload: HelpOfferCreate,
    request: Request,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    _ensure_helper(user)
    _ensure_verified(user)
    _check_offer_limit(user, db)
    req = db.query(HelpRequest).filter(HelpRequest.id == req_id).first()
    if not req:
        raise HTTPException(404, "Pedido não encontrado")
    if req.status not in (HelpRequestStatus.open, HelpRequestStatus.proposed):
        raise HTTPException(400, "Pedido não está mais aberto para ofertas")

    # Não permitir múltiplas ofertas pendentes do mesmo helper
    existing = db.query(HelpOffer).filter(
        HelpOffer.request_id == req_id,
        HelpOffer.helper_id == user.id,
        HelpOffer.status == HelpOfferStatus.pending,
    ).first()
    if existing:
        raise HTTPException(409, "Você já ofereceu ajuda para este pedido")

    # Modera a mensagem de apresentação se houver
    if payload.message:
        reason = check_message(payload.message)
        if reason:
            raise HTTPException(400, f"Mensagem rejeitada: {reason}")

    offer = HelpOffer(
        request_id=req_id,
        helper_id=user.id,
        message=payload.message.strip() if payload.message else None,
    )
    db.add(offer)
    if req.status == HelpRequestStatus.open:
        req.status = HelpRequestStatus.proposed
    db.commit()
    db.refresh(offer)
    try:
        owner = db.query(User).filter(User.id == req.requester_id).first()
        if owner and owner.email:
            send_offer_received.delay(owner.email, owner.name, user.name, req.title, req.id)
    except Exception:
        pass
    return offer


@router.get("/help-requests/{req_id}/offers", response_model=list[HelpOfferOut])
@limiter.limit("60/minute")
def list_offers(
    req_id: int,
    request: Request,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    req = db.query(HelpRequest).filter(HelpRequest.id == req_id).first()
    if not req:
        raise HTTPException(404, "Pedido não encontrado")
    if req.requester_id != user.id:
        raise HTTPException(403, "Apenas o solicitante vê as ofertas")
    # Helpers com nível maior aparecem primeiro para facilitar a escolha segura
    trust_order = case(
        (User.trust_level == TrustLevel.parceiro_validado, 1),
        (User.trust_level == TrustLevel.confiavel, 2),
        (User.trust_level == TrustLevel.verificado, 3),
        else_=4,
    )
    return (
        db.query(HelpOffer)
        .join(User, User.id == HelpOffer.helper_id)
        .filter(HelpOffer.request_id == req_id)
        .order_by(trust_order, HelpOffer.created_at.desc())
        .all()
    )


@router.post("/offers/{offer_id}/accept", response_model=HelpOfferOut)
@limiter.limit("20/hour")
def accept_offer(
    offer_id: int,
    request: Request,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    offer = db.query(HelpOffer).filter(HelpOffer.id == offer_id).first()
    if not offer:
        raise HTTPException(404, "Oferta não encontrada")
    req = db.query(HelpRequest).filter(HelpRequest.id == offer.request_id).first()
    if req.requester_id != user.id:
        raise HTTPException(403, "Apenas o solicitante pode aceitar")
    if req.status not in (HelpRequestStatus.open, HelpRequestStatus.proposed):
        raise HTTPException(400, "Pedido não está mais disponível")

    offer.status = HelpOfferStatus.accepted
    req.status = HelpRequestStatus.matched
    req.accepted_offer_id = offer.id

    # Recusa as outras ofertas pendentes
    db.query(HelpOffer).filter(
        HelpOffer.request_id == req.id,
        HelpOffer.id != offer.id,
        HelpOffer.status == HelpOfferStatus.pending,
    ).update({"status": HelpOfferStatus.declined})

    db.commit()
    db.refresh(offer)
    try:
        helper = db.query(User).filter(User.id == offer.helper_id).first()
        if helper and helper.email:
            send_offer_accepted.delay(helper.email, helper.name, req.title, req.id)
    except Exception:
        pass
    return offer


@router.post("/offers/{offer_id}/decline", response_model=HelpOfferOut)
@limiter.limit("20/hour")
def decline_offer(
    offer_id: int,
    request: Request,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    offer = db.query(HelpOffer).filter(HelpOffer.id == offer_id).first()
    if not offer:
        raise HTTPException(404, "Oferta não encontrada")
    req = db.query(HelpRequest).filter(HelpRequest.id == offer.request_id).first()
    if req.requester_id != user.id:
        raise HTTPException(403, "Apenas o solicitante pode recusar")
    if offer.status != HelpOfferStatus.pending:
        raise HTTPException(400, "Oferta não está pendente")
    offer.status = HelpOfferStatus.declined
    db.commit()
    db.refresh(offer)
    try:
        helper = db.query(User).filter(User.id == offer.helper_id).first()
        if helper and helper.email:
            send_offer_declined.delay(helper.email, helper.name, req.title)
    except Exception:
        pass
    return offer


# -------------------- Chat --------------------

@router.get("/help-requests/{req_id}/messages", response_model=list[ChatMessageOut])
@limiter.limit("120/minute")
def list_messages(
    req_id: int,
    request: Request,
    after_id: Optional[int] = None,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    req = db.query(HelpRequest).filter(HelpRequest.id == req_id).first()
    if not req:
        raise HTTPException(404, "Pedido não encontrado")
    if req.status != HelpRequestStatus.matched and req.status != HelpRequestStatus.closed:
        raise HTTPException(400, "Chat só fica disponível após aceite")
    if not _is_involved(req, user, db):
        raise HTTPException(403, "Acesso negado")

    query = db.query(ChatMessage).filter(ChatMessage.request_id == req_id)
    if after_id:
        query = query.filter(ChatMessage.id > after_id)
    return query.order_by(ChatMessage.created_at.asc()).limit(200).all()


@router.post("/help-requests/{req_id}/messages", response_model=ChatMessageOut, status_code=201)
@limiter.limit("30/minute")
def send_message(
    req_id: int,
    payload: ChatMessageCreate,
    request: Request,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    req = db.query(HelpRequest).filter(HelpRequest.id == req_id).first()
    if not req:
        raise HTTPException(404, "Pedido não encontrado")
    if req.status != HelpRequestStatus.matched:
        raise HTTPException(400, "Chat só fica disponível após aceite e antes de fechar")
    if not _is_involved(req, user, db):
        raise HTTPException(403, "Acesso negado")
    if user.profile_type == ProfileType.helper:
        _ensure_verified(user)

    reason = check_message(payload.content)
    if reason:
        raise HTTPException(400, f"Mensagem rejeitada: {reason}")

    msg = ChatMessage(
        request_id=req_id,
        sender_id=user.id,
        content=payload.content.strip(),
    )
    db.add(msg)
    db.commit()
    db.refresh(msg)
    _notify_chat_recipient(db, req, user.id)
    return msg


@router.post("/help-requests/{req_id}/report", status_code=201)
@limiter.limit("10/hour")
def report_chat(
    req_id: int,
    payload: ChatReportCreate,
    request: Request,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    req = db.query(HelpRequest).filter(HelpRequest.id == req_id).first()
    if not req:
        raise HTTPException(404, "Pedido não encontrado")
    if not _is_involved(req, user, db):
        raise HTTPException(403, "Acesso negado")

    report = ChatReport(
        request_id=req_id,
        reporter_id=user.id,
        reason=payload.reason.strip() if payload.reason else None,
    )
    db.add(report)
    db.commit()
    try:
        if app_settings.ADMIN_NOTIFY_EMAIL:
            send_admin_report.delay(
                app_settings.ADMIN_NOTIFY_EMAIL,
                user.email,
                req_id,
                payload.reason or "",
            )
    except Exception:
        pass
    return {"status": "received", "report_id": report.id}
