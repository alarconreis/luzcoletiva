"""
Rota de perfil: retorna e edita dados do usuário autenticado.
"""
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.core.limiter import limiter
from app.core.security import hash_password, verify_password
from app.models.audit import AdminAuditLog
from app.models.help import HelpOffer, HelpRequest, HelpRequestStatus
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
