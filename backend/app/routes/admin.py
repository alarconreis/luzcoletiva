"""
Endpoints administrativos — exigem role moderator ou admin.

Todas as ações destrutivas/sensíveis são logadas em admin_audit_log.
"""
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request, status, Form, File, UploadFile
from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import safe_path_under
from app.core.limiter import limiter
from app.core.rbac import require_admin, require_moderator
from app.models.audit import AdminAuditLog
from app.models.assisted import AssistedProfile
from app.models.help import HelpRequest, HelpRequestStatus
from app.schemas.assisted import (
    AssistedProfileAdminOut,
    AssistedProfileOut,
    InstitutionalRequestCreate,
    normalize_cep,
)
from app.models.user import User, UserRole, TrustLevel, ProfileType
from app.models.audit import LoginLog
from app.schemas.user import (
    AdminStatsOut,
    AdminUserOut,
    AdminUserUpdate,
    AuditLogOut,
    LoginLogOut,
    RoleUpdate,
    TrustLevelUpdate,
)

router = APIRouter(prefix="/api/admin", tags=["admin"])


def _client_ip(request: Request) -> str:
    cf_ip = request.headers.get("cf-connecting-ip")
    if cf_ip:
        return cf_ip.strip()
    xff = request.headers.get("x-forwarded-for")
    if xff:
        return xff.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def _log_action(
    db: Session,
    actor: User,
    action: str,
    target: Optional[User],
    details: Optional[str],
    ip: str,
) -> None:
    entry = AdminAuditLog(
        actor_id=actor.id,
        actor_email=actor.email,
        target_id=target.id if target else None,
        target_email=target.email if target else None,
        action=action,
        details=details,
        ip=ip,
    )
    db.add(entry)
    db.commit()


@router.get("/stats", response_model=AdminStatsOut)
@limiter.limit("60/minute")
def stats(
    request: Request,
    db: Session = Depends(get_db),
    _: User = Depends(require_moderator),
):
    week_ago = datetime.now(timezone.utc) - timedelta(days=7)
    return AdminStatsOut(
        total_users=db.query(User).count(),
        active_users=db.query(User).filter(User.is_active.is_(True)).count(),
        suspended_users=db.query(User).filter(User.is_active.is_(False)).count(),
        pending_approval=db.query(User).filter(User.is_approved.is_(False), User.is_active.is_(True)).count(),
        new_last_7_days=db.query(User).filter(User.created_at >= week_ago).count(),
        helpers=db.query(User).filter(User.profile_type == "helper").count(),
        requesters=db.query(User).filter(User.profile_type == "requester").count(),
        moderators=db.query(User).filter(User.role == UserRole.moderator).count(),
        admins=db.query(User).filter(User.role == UserRole.admin).count(),
    )


@router.get("/pending-users", response_model=list[AdminUserOut])
@limiter.limit("60/minute")
def list_pending_users(
    request: Request,
    db: Session = Depends(get_db),
    _: User = Depends(require_moderator),
):
    return (
        db.query(User)
        .filter(User.is_approved.is_(False), User.is_active.is_(True))
        .order_by(User.created_at.asc())
        .all()
    )


@router.post("/users/{user_id}/approve", response_model=AdminUserOut)
@limiter.limit("30/minute")
def approve_user(
    user_id: int,
    request: Request,
    db: Session = Depends(get_db),
    actor: User = Depends(require_moderator),
):
    target = db.query(User).filter(User.id == user_id).first()
    if not target:
        raise HTTPException(404, "Usuário não encontrado")
    target.is_approved = True
    db.commit()
    db.refresh(target)
    _log_action(db, actor, "approve", target, None, _client_ip(request))
    return target


@router.post("/users/{user_id}/reject", response_model=AdminUserOut)
@limiter.limit("30/minute")
def reject_user(
    user_id: int,
    request: Request,
    db: Session = Depends(get_db),
    actor: User = Depends(require_moderator),
):
    target = db.query(User).filter(User.id == user_id).first()
    if not target:
        raise HTTPException(404, "Usuário não encontrado")
    target.is_approved = False
    target.is_active = False
    db.commit()
    db.refresh(target)
    _log_action(db, actor, "reject", target, None, _client_ip(request))
    return target


@router.get("/users", response_model=list[AdminUserOut])
@limiter.limit("60/minute")
def list_users(
    request: Request,
    q: Optional[str] = None,
    status_filter: Optional[str] = None,  # active | suspended
    role_filter: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    _: User = Depends(require_moderator),
):
    query = db.query(User)
    if q:
        like = f"%{q}%"
        query = query.filter(or_(User.name.ilike(like), User.email.ilike(like)))
    if status_filter == "active":
        query = query.filter(User.is_active.is_(True))
    elif status_filter == "suspended":
        query = query.filter(User.is_active.is_(False))
    if role_filter in ("user", "moderator", "admin"):
        query = query.filter(User.role == role_filter)
    return query.order_by(User.created_at.desc()).offset(skip).limit(min(limit, 200)).all()


@router.get("/users/{user_id}", response_model=AdminUserOut)
@limiter.limit("60/minute")
def get_user(
    user_id: int,
    request: Request,
    db: Session = Depends(get_db),
    _: User = Depends(require_moderator),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(404, "Usuário não encontrado")
    return user


@router.post("/users/{user_id}/suspend", response_model=AdminUserOut)
@limiter.limit("30/minute")
def suspend_user(
    user_id: int,
    request: Request,
    db: Session = Depends(get_db),
    actor: User = Depends(require_moderator),
):
    target = db.query(User).filter(User.id == user_id).first()
    if not target:
        raise HTTPException(404, "Usuário não encontrado")
    if target.id == actor.id:
        raise HTTPException(400, "Você não pode suspender a si mesmo")
    if target.role == UserRole.admin and actor.role != UserRole.admin:
        raise HTTPException(403, "Apenas admin pode suspender outro admin")

    target.is_active = False
    db.commit()
    db.refresh(target)
    _log_action(db, actor, "suspend", target, None, _client_ip(request))
    return target


@router.post("/users/{user_id}/activate", response_model=AdminUserOut)
@limiter.limit("30/minute")
def activate_user(
    user_id: int,
    request: Request,
    db: Session = Depends(get_db),
    actor: User = Depends(require_moderator),
):
    target = db.query(User).filter(User.id == user_id).first()
    if not target:
        raise HTTPException(404, "Usuário não encontrado")

    target.is_active = True
    db.commit()
    db.refresh(target)
    _log_action(db, actor, "activate", target, None, _client_ip(request))
    return target


@router.post("/users/{user_id}/role", response_model=AdminUserOut)
@limiter.limit("20/minute")
def update_role(
    user_id: int,
    payload: RoleUpdate,
    request: Request,
    db: Session = Depends(get_db),
    actor: User = Depends(require_admin),
):
    target = db.query(User).filter(User.id == user_id).first()
    if not target:
        raise HTTPException(404, "Usuário não encontrado")
    if target.id == actor.id:
        raise HTTPException(400, "Você não pode alterar seu próprio role")

    new_role = UserRole(payload.role)

    # Trava: não permitir rebaixar o último admin
    if target.role == UserRole.admin and new_role != UserRole.admin:
        admin_count = db.query(User).filter(User.role == UserRole.admin).count()
        if admin_count <= 1:
            raise HTTPException(400, "Não é possível rebaixar o último admin")

    old_role = target.role.value
    target.role = new_role
    db.commit()
    db.refresh(target)
    _log_action(
        db, actor, "role_change", target,
        f"{old_role} → {new_role.value}", _client_ip(request),
    )
    return target


@router.patch("/users/{user_id}", response_model=AdminUserOut)
@limiter.limit("30/minute")
def update_user(
    user_id: int,
    payload: AdminUserUpdate,
    request: Request,
    db: Session = Depends(get_db),
    actor: User = Depends(require_moderator),
):
    target = db.query(User).filter(User.id == user_id).first()
    if not target:
        raise HTTPException(404, "Usuário não encontrado")
    changes = []
    if payload.name is not None:
        changes.append(f"name: {target.name!r} → {payload.name!r}")
        target.name = payload.name.strip()
    if payload.email is not None:
        existing = db.query(User).filter(User.email == str(payload.email).lower(), User.id != user_id).first()
        if existing:
            raise HTTPException(409, "E-mail já em uso")
        changes.append(f"email: {target.email!r} → {payload.email!r}")
        target.email = str(payload.email).lower()
    if payload.phone is not None:
        changes.append(f"phone: {target.phone!r} → {payload.phone!r}")
        target.phone = payload.phone.strip() or None
    if payload.cpf is not None:
        target.cpf = payload.cpf.strip() or None
        changes.append("cpf atualizado")
    if payload.rg is not None:
        target.rg = payload.rg.strip() or None
        changes.append("rg atualizado")
    if payload.cnpj is not None:
        target.cnpj = payload.cnpj.strip() or None
        changes.append("cnpj atualizado")
    if payload.is_verified is not None:
        changes.append(f"is_verified: {target.is_verified} → {payload.is_verified}")
        target.is_verified = payload.is_verified
    db.commit()
    db.refresh(target)
    if changes:
        _log_action(db, actor, "edit_user", target, "; ".join(changes), _client_ip(request))
    return target


@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
@limiter.limit("10/minute")
def delete_user(
    user_id: int,
    request: Request,
    reason: Optional[str] = None,
    db: Session = Depends(get_db),
    actor: User = Depends(require_admin),
):
    target = db.query(User).filter(User.id == user_id).first()
    if not target:
        raise HTTPException(404, "Usuário não encontrado")
    if target.id == actor.id:
        raise HTTPException(400, "Você não pode excluir a si mesmo")
    if target.role == UserRole.admin:
        admin_count = db.query(User).filter(User.role == UserRole.admin).count()
        if admin_count <= 1:
            raise HTTPException(400, "Não é possível excluir o último admin")
    _log_action(db, actor, "delete_user", target, reason, _client_ip(request))
    db.delete(target)
    db.commit()


@router.patch("/users/{user_id}/trust-level", response_model=AdminUserOut)
@limiter.limit("30/minute")
def update_trust_level(
    user_id: int,
    payload: TrustLevelUpdate,
    request: Request,
    db: Session = Depends(get_db),
    actor: User = Depends(require_moderator),
):
    target = db.query(User).filter(User.id == user_id).first()
    if not target:
        raise HTTPException(404, "Usuário não encontrado")
    old = target.trust_level.value
    target.trust_level = TrustLevel(payload.trust_level)
    db.commit()
    db.refresh(target)
    _log_action(
        db, actor, "trust_level_change", target,
        f"{old} → {target.trust_level.value}", _client_ip(request),
    )
    return target


@router.get("/users/{user_id}/selfie")
@limiter.limit("30/minute")
def view_selfie(
    user_id: int,
    request: Request,
    db: Session = Depends(get_db),
    actor: User = Depends(require_moderator),
):
    import pathlib
    from fastapi.responses import FileResponse
    target = db.query(User).filter(User.id == user_id).first()
    if not target or not target.selfie_path:
        raise HTTPException(404, "Selfie não encontrada")
    path = safe_path_under(pathlib.Path("/app/uploads"), target.selfie_path)
    if path is None or not path.exists():
        raise HTTPException(404, "Arquivo não encontrado")
    _log_action(db, actor, "view_selfie", target, None, _client_ip(request))
    return FileResponse(str(path))


@router.get("/users/{user_id}/doc-photo")
@limiter.limit("30/minute")
def view_doc_photo(
    user_id: int,
    request: Request,
    db: Session = Depends(get_db),
    actor: User = Depends(require_moderator),
):
    import pathlib
    from fastapi.responses import FileResponse
    target = db.query(User).filter(User.id == user_id).first()
    if not target or not target.doc_photo_path:
        raise HTTPException(404, "Foto do documento não encontrada")
    path = safe_path_under(pathlib.Path("/app/uploads"), target.doc_photo_path)
    if path is None or not path.exists():
        raise HTTPException(404, "Arquivo não encontrado")
    _log_action(db, actor, "view_doc_photo", target, None, _client_ip(request))
    return FileResponse(str(path))


@router.get("/audit", response_model=list[AuditLogOut])
@limiter.limit("60/minute")
def list_audit(
    request: Request,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    return (
        db.query(AdminAuditLog)
        .order_by(AdminAuditLog.created_at.desc())
        .offset(skip)
        .limit(min(limit, 200))
        .all()
    )


@router.get("/login-log", response_model=list[LoginLogOut])
@limiter.limit("60/minute")
def list_login_log(
    request: Request,
    skip: int = 0,
    limit: int = 100,
    only_failures: bool = False,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    q = db.query(LoginLog)
    if only_failures:
        q = q.filter(LoginLog.success.is_(False))
    return q.order_by(LoginLog.created_at.desc()).offset(skip).limit(min(limit, 200)).all()



# -------------------- Moderação de pedidos --------------------

from app.models.help import ChatMessage, ChatReport, HelpRequest, HelpRequestStatus


@router.get("/help-requests/pending")
@limiter.limit("60/minute")
def list_pending_requests(
    request: Request,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    _: User = Depends(require_moderator),
):
    items = (
        db.query(HelpRequest)
        .filter(HelpRequest.status == HelpRequestStatus.pending_review)
        .order_by(HelpRequest.created_at.asc())
        .offset(skip).limit(min(limit, 200))
        .all()
    )
    return [
        {
            "id": r.id,
            "title": r.title,
            "category": r.category.value if hasattr(r.category, "value") else r.category,
            "city": r.city,
            "state": r.state,
            "requester_id": r.requester_id,
            "requester_name": r.requester.name if r.requester else None,
            "has_document": bool(r.document_path),
            "created_at": r.created_at.isoformat() if r.created_at else None,
        }
        for r in items
    ]


@router.post("/help-requests/{req_id}/approve")
@limiter.limit("30/minute")
def approve_help_request(
    req_id: int,
    request: Request,
    db: Session = Depends(get_db),
    actor: User = Depends(require_moderator),
):
    req = db.query(HelpRequest).filter(HelpRequest.id == req_id).first()
    if not req:
        raise HTTPException(404, "Pedido não encontrado")
    if req.status != HelpRequestStatus.pending_review:
        raise HTTPException(400, "Pedido não está aguardando aprovação")
    req.status = HelpRequestStatus.open
    db.commit()
    _log_action(db, actor, "approve_request", None, f"request_id={req_id}", _client_ip(request))
    return {"status": "approved", "request_id": req_id}


@router.post("/help-requests/{req_id}/reject")
@limiter.limit("30/minute")
def reject_help_request(
    req_id: int,
    request: Request,
    db: Session = Depends(get_db),
    actor: User = Depends(require_moderator),
):
    req = db.query(HelpRequest).filter(HelpRequest.id == req_id).first()
    if not req:
        raise HTTPException(404, "Pedido não encontrado")
    if req.status != HelpRequestStatus.pending_review:
        raise HTTPException(400, "Pedido não está aguardando aprovação")
    req.status = HelpRequestStatus.cancelled
    db.commit()
    _log_action(db, actor, "reject_request", None, f"request_id={req_id}", _client_ip(request))
    return {"status": "rejected", "request_id": req_id}


# -------------------- Moderação de chat --------------------


@router.get("/reports")
@limiter.limit("60/minute")
def list_reports(
    request: Request,
    only_open: bool = True,
    db: Session = Depends(get_db),
    _: User = Depends(require_moderator),
):
    q = db.query(ChatReport)
    if only_open:
        q = q.filter(ChatReport.resolved.is_(False))
    reports = q.order_by(ChatReport.created_at.desc()).limit(100).all()
    return [
        {
            "id": r.id,
            "request_id": r.request_id,
            "reporter_id": r.reporter_id,
            "reason": r.reason,
            "resolved": r.resolved,
            "created_at": r.created_at.isoformat() if r.created_at else None,
        }
        for r in reports
    ]


@router.get("/help-requests/{req_id}/messages")
@limiter.limit("60/minute")
def admin_view_messages(
    req_id: int,
    request: Request,
    db: Session = Depends(get_db),
    _: User = Depends(require_moderator),
):
    req = db.query(HelpRequest).filter(HelpRequest.id == req_id).first()
    if not req:
        raise HTTPException(404, "Pedido não encontrado")
    msgs = (
        db.query(ChatMessage)
        .filter(ChatMessage.request_id == req_id)
        .order_by(ChatMessage.created_at.asc())
        .all()
    )
    return [
        {
            "id": m.id,
            "sender_id": m.sender_id,
            "content": m.content,
            "is_redacted": m.is_redacted,
            "created_at": m.created_at.isoformat() if m.created_at else None,
        }
        for m in msgs
    ]


@router.post("/messages/{msg_id}/redact")
@limiter.limit("30/minute")
def redact_message(
    msg_id: int,
    request: Request,
    db: Session = Depends(get_db),
    actor: User = Depends(require_moderator),
):
    msg = db.query(ChatMessage).filter(ChatMessage.id == msg_id).first()
    if not msg:
        raise HTTPException(404, "Mensagem não encontrada")
    msg.content = "[mensagem removida pela moderação]"
    msg.is_redacted = True
    db.commit()
    _log_action(db, actor, "redact_message", None, f"msg_id={msg_id}", _client_ip(request))
    return {"status": "redacted"}


@router.post("/reports/{report_id}/resolve")
@limiter.limit("30/minute")
def resolve_report(
    report_id: int,
    request: Request,
    db: Session = Depends(get_db),
    actor: User = Depends(require_moderator),
):
    from datetime import datetime, timezone
    rep = db.query(ChatReport).filter(ChatReport.id == report_id).first()
    if not rep:
        raise HTTPException(404, "Report não encontrado")
    rep.resolved = True
    rep.resolved_by = actor.id
    rep.resolved_at = datetime.now(timezone.utc)
    db.commit()
    _log_action(db, actor, "resolve_report", None, f"report_id={report_id}", _client_ip(request))
    return {"status": "resolved"}



# -------------------- Verificação manual --------------------

from app.models.verification import VerificationAttempt, VerificationStatus


@router.get("/verifications")
@limiter.limit("60/minute")
def list_verifications(
    request: Request,
    only_manual: bool = True,
    db: Session = Depends(get_db),
    _: User = Depends(require_moderator),
):
    q = db.query(VerificationAttempt)
    if only_manual:
        q = q.filter(VerificationAttempt.status == VerificationStatus.manual)
    items = q.order_by(VerificationAttempt.created_at.desc()).limit(100).all()
    return [
        {
            "id": v.id,
            "user_id": v.user_id,
            "status": v.status.value,
            "score_document": v.score_document,
            "score_liveness": v.score_liveness,
            "score_face_match": v.score_face_match,
            "extracted_name": v.extracted_name,
            "name_match_score": v.name_match_score,
            "rejection_reason": v.rejection_reason,
            "images_purged": v.images_purged,
            "created_at": v.created_at.isoformat() if v.created_at else None,
        }
        for v in items
    ]


@router.post("/verifications/{vid}/approve")
@limiter.limit("30/minute")
def admin_approve(
    vid: int,
    request: Request,
    db: Session = Depends(get_db),
    actor: User = Depends(require_moderator),
):
    v = db.query(VerificationAttempt).filter(VerificationAttempt.id == vid).first()
    if not v:
        raise HTTPException(404, "Tentativa não encontrada")
    if v.images_purged:
        raise HTTPException(400, "Imagens já descartadas")
    v.status = VerificationStatus.approved
    v.final_decision = "manual_approved"
    target_user = db.query(User).filter(User.id == v.user_id).first()
    if target_user:
        target_user.is_verified = True
    db.commit()
    _log_action(db, actor, "verify_approve", target_user, f"attempt={vid}", _client_ip(request))
    return {"status": "approved"}


@router.post("/verifications/{vid}/reject")
@limiter.limit("30/minute")
def admin_reject(
    vid: int,
    request: Request,
    db: Session = Depends(get_db),
    actor: User = Depends(require_moderator),
):
    v = db.query(VerificationAttempt).filter(VerificationAttempt.id == vid).first()
    if not v:
        raise HTTPException(404, "Tentativa não encontrada")
    v.status = VerificationStatus.rejected
    v.final_decision = "manual_rejected"
    v.rejection_reason = "Rejeitado em revisão manual"
    target_user = db.query(User).filter(User.id == v.user_id).first()
    db.commit()
    _log_action(db, actor, "verify_reject", target_user, f"attempt={vid}", _client_ip(request))
    return {"status": "rejected"}



# -------------------- Auditoria de e-mails --------------------

from app.models.email_log import EmailLog


@router.get("/emails")
@limiter.limit("60/minute")
def list_emails(
    request: Request,
    only_failed: bool = False,
    db: Session = Depends(get_db),
    _: User = Depends(require_moderator),
):
    q = db.query(EmailLog)
    if only_failed:
        q = q.filter(EmailLog.success.is_(False))
    items = q.order_by(EmailLog.created_at.desc()).limit(100).all()
    return [
        {
            "id": e.id,
            "to": e.to_email,
            "subject": e.subject,
            "template": e.template,
            "success": e.success,
            "error": e.error,
            "provider_id": e.provider_id,
            "created_at": e.created_at.isoformat() if e.created_at else None,
        }
        for e in items
    ]


# ============================================
# Atendimento Assistido (Admin)
# ============================================

ASSISTED_LIMIT_PER_ADMIN_PER_MONTH = 5


@router.post("/assisted-profiles", status_code=201)
@limiter.limit("20/hour")
async def create_assisted_profile(
    request: Request,
    full_name: str = Form(..., min_length=2, max_length=120),
    city: str = Form(..., min_length=2, max_length=80),
    state: str = Form(..., min_length=2, max_length=2),
    story: str = Form(..., min_length=20, max_length=2000),
    contact_phone: Optional[str] = Form(None),
    cep: Optional[str] = Form(None),
    address: Optional[str] = Form(None, max_length=500),
    photo: UploadFile = File(...),
    db: Session = Depends(get_db),
    actor: User = Depends(require_admin),
):
    """
    Cria perfil de pessoa real assistida. Limite: 5 perfis por admin por mês.
    """
    from datetime import datetime, timedelta, timezone
    from app.core.uploads import save_upload

    # Cap mensal
    one_month_ago = datetime.now(timezone.utc) - timedelta(days=30)
    count = (
        db.query(AssistedProfile)
        .filter(
            AssistedProfile.created_by_admin_id == actor.id,
            AssistedProfile.created_at >= one_month_ago,
        )
        .count()
    )
    if count >= ASSISTED_LIMIT_PER_ADMIN_PER_MONTH:
        raise HTTPException(
            429,
            f"Limite de {ASSISTED_LIMIT_PER_ADMIN_PER_MONTH} perfis assistidos por mês atingido. "
            "Aguarde o próximo ciclo ou peça pra outro admin."
        )

    # Normaliza phone
    phone_clean = None
    if contact_phone:
        digits = "".join(c for c in contact_phone if c.isdigit())
        if 10 <= len(digits) <= 15:
            phone_clean = digits

    try:
        cep_clean = normalize_cep(cep)
    except ValueError as exc:
        raise HTTPException(422, str(exc))
    address_clean = address.strip() if address and address.strip() else None

    photo_path = await save_upload(photo)

    profile = AssistedProfile(
        full_name=full_name.strip(),
        city=city.strip(),
        state=state.strip().upper(),
        contact_phone=phone_clean,
        cep=cep_clean,
        address=address_clean,
        photo_path=photo_path,
        story=story.strip(),
        created_by_admin_id=actor.id,
    )
    db.add(profile)
    db.commit()
    db.refresh(profile)
    _log_action(db, actor, "create_assisted_profile", None, f"profile_id={profile.id} name={profile.full_name}", _client_ip(request))
    return AssistedProfileAdminOut.model_validate(profile)


@router.get("/assisted-profiles")
@limiter.limit("60/minute")
def list_assisted_profiles(
    request: Request,
    only_active: bool = True,
    db: Session = Depends(get_db),
    actor: User = Depends(require_moderator),
):
    """
    Lista perfis assistidos. Admin recebe CEP/endereço; moderador não.
    """
    q = db.query(AssistedProfile)
    if only_active:
        q = q.filter(AssistedProfile.archived == False)
    rows = q.order_by(AssistedProfile.created_at.desc()).limit(100).all()
    schema = AssistedProfileAdminOut if actor.role == UserRole.admin else AssistedProfileOut
    return [schema.model_validate(p) for p in rows]


@router.post("/help-requests/institutional", status_code=201)
@limiter.limit("20/hour")
def create_institutional_request(
    request: Request,
    payload: InstitutionalRequestCreate,
    db: Session = Depends(get_db),
    actor: User = Depends(require_admin),
):
    """
    Cria pedido em nome de um perfil assistido. Auto-aprovado (status=open).
    O admin é o "requester" técnico (dono da conta), mas a UI mostra o assisted_profile.
    """
    profile = db.query(AssistedProfile).filter(
        AssistedProfile.id == payload.assisted_profile_id,
        AssistedProfile.archived == False,
    ).first()
    if not profile:
        raise HTTPException(404, "Perfil assistido não encontrado ou arquivado")

    from app.models.help import HelpCategory

    try:
        category_enum = HelpCategory(payload.category)
    except ValueError:
        raise HTTPException(422, f"Categoria inválida: {payload.category}")

    req = HelpRequest(
        requester_id=actor.id,  # admin é "owner" técnico
        title=payload.title.strip(),
        description=payload.description.strip(),
        category=category_enum,
        city=profile.city,
        state=profile.state,
        value=payload.value,
        status=HelpRequestStatus.open,  # auto-aprovado
        is_institutional=True,
        assisted_profile_id=profile.id,
        created_by_admin_id=actor.id,
    )
    db.add(req)
    db.commit()
    db.refresh(req)
    _log_action(db, actor, "create_institutional_request", None, f"req_id={req.id} profile_id={profile.id}", _client_ip(request))
    return {"id": req.id, "status": req.status.value, "is_institutional": True}


@router.get("/assisted-profiles/{profile_id}/photo")
@limiter.limit("60/minute")
def view_assisted_photo(
    profile_id: int,
    request: Request,
    db: Session = Depends(get_db),
    actor: User = Depends(require_moderator),
):
    """Serve a foto do perfil assistido. Apenas moderador/admin autenticado."""
    import pathlib
    from fastapi.responses import FileResponse
    from app.core.uploads import UPLOAD_DIR

    profile = db.query(AssistedProfile).filter(AssistedProfile.id == profile_id).first()
    if not profile or not profile.photo_path:
        raise HTTPException(404, "Foto não encontrada")
    path = safe_path_under(pathlib.Path(UPLOAD_DIR), profile.photo_path)
    if path is None or not path.exists():
        raise HTTPException(404, "Arquivo não encontrado")
    _log_action(db, actor, "view_assisted_photo", None, f"profile_id={profile_id}", _client_ip(request))
    return FileResponse(str(path))


@router.patch("/assisted-profiles/{profile_id}", status_code=200)
@limiter.limit("30/hour")
async def update_assisted_profile(
    profile_id: int,
    request: Request,
    full_name: Optional[str] = Form(None, min_length=2, max_length=120),
    city: Optional[str] = Form(None, min_length=2, max_length=80),
    state: Optional[str] = Form(None, min_length=2, max_length=2),
    contact_phone: Optional[str] = Form(None),
    cep: Optional[str] = Form(None),
    address: Optional[str] = Form(None, max_length=500),
    story: Optional[str] = Form(None, min_length=20, max_length=2000),
    photo: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    actor: User = Depends(require_admin),
):
    """Edita perfil assistido. Todos os campos são opcionais — só atualiza o que vier."""
    from app.core.uploads import save_upload

    profile = db.query(AssistedProfile).filter(AssistedProfile.id == profile_id).first()
    if not profile:
        raise HTTPException(404, "Perfil não encontrado")

    if full_name is not None:
        profile.full_name = full_name.strip()
    if city is not None:
        profile.city = city.strip()
    if state is not None:
        profile.state = state.strip().upper()
    if story is not None:
        profile.story = story.strip()
    if contact_phone is not None:
        if contact_phone == "":
            profile.contact_phone = None
        else:
            digits = "".join(c for c in contact_phone if c.isdigit())
            if 10 <= len(digits) <= 15:
                profile.contact_phone = digits
            else:
                raise HTTPException(422, "Telefone deve ter 10-15 dígitos com DDD")
    if cep is not None:
        try:
            profile.cep = normalize_cep(cep)
        except ValueError as exc:
            raise HTTPException(422, str(exc))
    if address is not None:
        profile.address = address.strip() or None
    if photo is not None and photo.filename:
        new_path = await save_upload(photo)
        profile.photo_path = new_path

    db.commit()
    db.refresh(profile)
    _log_action(db, actor, "update_assisted_profile", None, f"profile_id={profile_id}", _client_ip(request))
    return AssistedProfileAdminOut.model_validate(profile)


@router.post("/assisted-profiles/{profile_id}/archive", status_code=200)
@limiter.limit("30/hour")
def archive_assisted_profile(
    profile_id: int,
    request: Request,
    db: Session = Depends(get_db),
    actor: User = Depends(require_admin),
):
    """Arquiva perfil assistido. Bloqueia se tiver pedidos abertos."""
    profile = db.query(AssistedProfile).filter(AssistedProfile.id == profile_id).first()
    if not profile:
        raise HTTPException(404, "Perfil não encontrado")
    if profile.archived:
        raise HTTPException(400, "Perfil já está arquivado")

    # Verifica se tem pedidos em estados ativos
    open_states = [
        HelpRequestStatus.pending_review,
        HelpRequestStatus.open,
        HelpRequestStatus.proposed,
        HelpRequestStatus.matched,
        HelpRequestStatus.in_transit,
        HelpRequestStatus.delivered,
    ]
    open_count = (
        db.query(HelpRequest)
        .filter(
            HelpRequest.assisted_profile_id == profile_id,
            HelpRequest.status.in_(open_states),
        )
        .count()
    )
    if open_count > 0:
        raise HTTPException(
            400,
            f"Não pode arquivar: existem {open_count} pedido(s) aberto(s) ou em andamento. "
            "Aguarde fecharem antes de arquivar.",
        )

    profile.archived = True
    db.commit()
    _log_action(db, actor, "archive_assisted_profile", None, f"profile_id={profile_id}", _client_ip(request))
    return {"id": profile.id, "archived": True}


@router.get("/assisted-profiles/{profile_id}/requests")
@limiter.limit("60/minute")
def list_assisted_requests(
    profile_id: int,
    request: Request,
    db: Session = Depends(get_db),
    _: User = Depends(require_moderator),
):
    """Lista pedidos institucionais de um perfil assistido (todos os status)."""
    profile = db.query(AssistedProfile).filter(AssistedProfile.id == profile_id).first()
    if not profile:
        raise HTTPException(404, "Perfil não encontrado")

    reqs = (
        db.query(HelpRequest)
        .filter(
            HelpRequest.assisted_profile_id == profile_id,
            HelpRequest.is_institutional == True,
        )
        .order_by(HelpRequest.created_at.desc())
        .limit(50)
        .all()
    )
    return [
        {
            "id": r.id,
            "title": r.title,
            "category": r.category.value if hasattr(r.category, 'value') else r.category,
            "status": r.status.value if hasattr(r.status, 'value') else r.status,
            "value": float(r.value) if r.value else None,
            "shipping_method": r.shipping_method.value if r.shipping_method and hasattr(r.shipping_method, 'value') else None,
            "created_at": r.created_at.isoformat() if r.created_at else None,
        }
        for r in reqs
    ]


@router.get("/help-requests/all")
@limiter.limit("60/minute")
def list_all_help_requests(
    request: Request,
    status_filter: Optional[str] = None,
    type_filter: Optional[str] = None,  # 'institutional' | 'regular' | None=todos
    db: Session = Depends(get_db),
    _: User = Depends(require_moderator),
):
    """Lista todos os pedidos com filtros opcionais por status e tipo."""
    from app.models.help import HelpRequest
    from app.models.user import User as UserModel

    q = db.query(HelpRequest)

    if status_filter:
        try:
            status_enum = HelpRequestStatus(status_filter)
            q = q.filter(HelpRequest.status == status_enum)
        except ValueError:
            raise HTTPException(422, f"Status inválido: {status_filter}")

    if type_filter == "institutional":
        q = q.filter(HelpRequest.is_institutional == True)
    elif type_filter == "regular":
        q = q.filter(HelpRequest.is_institutional == False)

    reqs = q.order_by(HelpRequest.created_at.desc()).limit(200).all()

    result = []
    for r in reqs:
        # Resolve nome do "requester" mostrado
        requester_name = None
        if r.is_institutional and r.assisted_profile_id:
            profile = db.query(AssistedProfile).filter(AssistedProfile.id == r.assisted_profile_id).first()
            requester_name = f"Institucional — {profile.full_name}" if profile else "Institucional"
        else:
            requester = db.query(UserModel).filter(UserModel.id == r.requester_id).first()
            requester_name = requester.name if requester else "Desconhecido"

        result.append({
            "id": r.id,
            "title": r.title,
            "category": r.category.value if hasattr(r.category, 'value') else r.category,
            "status": r.status.value if hasattr(r.status, 'value') else r.status,
            "value": float(r.value) if r.value else None,
            "city": r.city,
            "state": r.state,
            "is_institutional": bool(r.is_institutional),
            "requester_name": requester_name,
            "created_at": r.created_at.isoformat() if r.created_at else None,
        })
    return result


# ==================== BLOG ====================

from app.models.blog import BlogPost as _BlogPost
from app.schemas.blog import BlogPostCreate as _BlogPostCreate
from app.schemas.blog import BlogPostUpdate as _BlogPostUpdate
from app.schemas.blog import BlogPostOut as _BlogPostOut
from app.schemas.blog import _slugify
from datetime import datetime, timezone


def _generate_unique_slug(db: Session, title: str, exclude_id: Optional[int] = None) -> str:
    """Gera slug único a partir do título. Adiciona sufixo se já existir."""
    base = _slugify(title)
    if not base:
        base = "post"
    slug = base
    counter = 2
    while True:
        q = db.query(_BlogPost).filter(_BlogPost.slug == slug)
        if exclude_id is not None:
            q = q.filter(_BlogPost.id != exclude_id)
        if not q.first():
            return slug
        slug = f"{base}-{counter}"
        counter += 1
        if counter > 200:
            raise HTTPException(500, "Falha ao gerar slug único")


@router.get("/blog/posts", response_model=list[_BlogPostOut])
@limiter.limit("60/minute")
def list_blog_posts_admin(
    request: Request,
    db: Session = Depends(get_db),
    _: User = Depends(require_moderator),
):
    """Lista TODOS os posts (incluindo rascunhos) pra gestão."""
    posts = (
        db.query(_BlogPost)
        .order_by(_BlogPost.created_at.desc())
        .limit(200)
        .all()
    )
    return posts


@router.post("/blog/posts", response_model=_BlogPostOut, status_code=201)
@limiter.limit("30/hour")
async def create_blog_post(
    request: Request,
    kind: str = Form(...),
    title: str = Form(...),
    summary: str = Form(...),
    body_md: Optional[str] = Form(None),
    source_url: Optional[str] = Form(None),
    source_name: Optional[str] = Form(None),
    image_external_url: Optional[str] = Form(None),
    image_file: Optional[UploadFile] = File(None),
    published: bool = Form(False),
    db: Session = Depends(get_db),
    actor: User = Depends(require_moderator),
):
    """Cria post de blog. Imagem pode vir como upload OU URL externa."""
    from app.core.uploads import save_upload

    # Valida pelos schemas
    payload = _BlogPostCreate(
        kind=kind,
        title=title,
        summary=summary,
        body_md=body_md,
        source_url=source_url,
        source_name=source_name,
        published=published,
    )

    # Validação por kind
    if payload.kind == "external" and not source_url:
        raise HTTPException(422, "Posts externos precisam de source_url")
    if payload.kind == "internal" and not body_md:
        raise HTTPException(422, "Posts internos precisam de body_md")

    # Resolve imagem
    image_url = None
    image_is_external = False
    if image_external_url:
        image_url = image_external_url
        image_is_external = True
    elif image_file and image_file.filename:
        filename = await save_upload(image_file)
        image_url = filename  # path relativo no /uploads
        image_is_external = False

    slug = _generate_unique_slug(db, payload.title)

    post = _BlogPost(
        slug=slug,
        kind=payload.kind,
        title=payload.title,
        summary=payload.summary,
        image_url=image_url,
        image_is_external=image_is_external,
        body_md=payload.body_md,
        source_url=payload.source_url,
        source_name=payload.source_name,
        author_id=actor.id,
        published=payload.published,
        published_at=datetime.now(timezone.utc) if payload.published else None,
    )
    db.add(post)
    db.commit()
    db.refresh(post)
    _log_action(db, actor, "create_blog_post", None, f"slug={slug}", _client_ip(request))
    return post


@router.patch("/blog/posts/{post_id}", response_model=_BlogPostOut)
@limiter.limit("30/hour")
async def update_blog_post(
    post_id: int,
    request: Request,
    kind: Optional[str] = Form(None),
    title: Optional[str] = Form(None),
    summary: Optional[str] = Form(None),
    body_md: Optional[str] = Form(None),
    source_url: Optional[str] = Form(None),
    source_name: Optional[str] = Form(None),
    image_external_url: Optional[str] = Form(None),
    image_file: Optional[UploadFile] = File(None),
    published: Optional[bool] = Form(None),
    db: Session = Depends(get_db),
    actor: User = Depends(require_moderator),
):
    """Edita post existente. Campos None mantêm valor atual."""
    from app.core.uploads import save_upload

    post = db.query(_BlogPost).filter(_BlogPost.id == post_id).first()
    if not post:
        raise HTTPException(404, "Post não encontrado")

    if kind is not None:
        if kind not in ("external", "internal"):
            raise HTTPException(422, "kind inválido")
        post.kind = kind
    if title is not None:
        if len(title.strip()) < 5:
            raise HTTPException(422, "Título muito curto")
        post.title = title.strip()
        # Re-gera slug se title mudou
        post.slug = _generate_unique_slug(db, title, exclude_id=post.id)
    if summary is not None:
        if len(summary.strip()) < 10:
            raise HTTPException(422, "Resumo muito curto")
        post.summary = summary.strip()
    if body_md is not None:
        post.body_md = body_md
    if source_url is not None:
        post.source_url = source_url if source_url else None
    if source_name is not None:
        post.source_name = source_name if source_name else None
    if image_external_url:
        post.image_url = image_external_url
        post.image_is_external = True
    elif image_file and image_file.filename:
        filename = await save_upload(image_file)
        post.image_url = filename
        post.image_is_external = False
    if published is not None:
        was_published = post.published
        post.published = published
        if published and not was_published:
            post.published_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(post)
    _log_action(db, actor, "update_blog_post", None, f"id={post_id}", _client_ip(request))
    return post


@router.delete("/blog/posts/{post_id}", status_code=204)
@limiter.limit("30/hour")
def delete_blog_post(
    post_id: int,
    request: Request,
    db: Session = Depends(get_db),
    actor: User = Depends(require_admin),
):
    """Deleta post (somente admin, não moderator)."""
    post = db.query(_BlogPost).filter(_BlogPost.id == post_id).first()
    if not post:
        raise HTTPException(404, "Post não encontrado")
    db.delete(post)
    db.commit()
    _log_action(db, actor, "delete_blog_post", None, f"id={post_id}", _client_ip(request))
