"""
Endpoints administrativos — exigem role moderator ou admin.

Todas as ações destrutivas/sensíveis são logadas em admin_audit_log.
"""
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.limiter import limiter
from app.core.rbac import require_admin, require_moderator
from app.models.audit import AdminAuditLog
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
    path = pathlib.Path("/app/uploads") / target.selfie_path
    if not path.exists():
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
    path = pathlib.Path("/app/uploads") / target.doc_photo_path
    if not path.exists():
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
