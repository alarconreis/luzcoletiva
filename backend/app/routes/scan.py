"""
Endpoint dedicado pra autenticação de scans (ZAP, Burp).
Só funciona se SCAN_TOKEN está setado E IP está em SCAN_ALLOWED_IPS.
Sessão de 2h, log completo de uso.
"""
import logging
import secrets
from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.limiter import limiter
from app.core.security import create_access_token
from app.models.user import User
from app.schemas.user import UserOut

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/scan", tags=["scan"])


def _client_ip(request: Request) -> str:
    cf = request.headers.get("cf-connecting-ip")
    if cf:
        return cf.strip()
    xff = request.headers.get("x-forwarded-for")
    if xff:
        return xff.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def _scan_enabled() -> bool:
    return bool(settings.SCAN_TOKEN and settings.SCAN_ALLOWED_IPS and settings.SCAN_USER_ID)


def _ip_allowed(ip: str) -> bool:
    allowlist = [x.strip() for x in settings.SCAN_ALLOWED_IPS.split(",") if x.strip()]
    return ip in allowlist


@router.post("/auth")
@limiter.limit("5/hour")
def scan_auth(
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
):
    """
    Autentica scan via SCAN_TOKEN no header X-Scan-Token.
    Retorna cookie de sessão de 2h pro user de scan (id em SCAN_USER_ID).
    """
    if not _scan_enabled():
        # Endpoint fica invisível se não configurado
        raise HTTPException(status_code=404, detail="Not Found")

    ip = _client_ip(request)
    user_agent = request.headers.get("user-agent", "")[:300]

    if not _ip_allowed(ip):
        logger.warning(f"scan_auth: IP not allowed: {ip} (UA: {user_agent[:80]})")
        raise HTTPException(status_code=403, detail="Forbidden")

    token = request.headers.get("x-scan-token", "")
    if not token or not secrets.compare_digest(token, settings.SCAN_TOKEN):
        logger.warning(f"scan_auth: invalid token from {ip} (UA: {user_agent[:80]})")
        raise HTTPException(status_code=401, detail="Unauthorized")

    user = db.query(User).filter(User.id == settings.SCAN_USER_ID).first()
    if not user:
        logger.error(f"scan_auth: SCAN_USER_ID={settings.SCAN_USER_ID} not found")
        raise HTTPException(status_code=500, detail="Scan user not configured")

    # Sessão de 2h (em vez de 60min default)
    jwt_token = create_access_token(
        user.id,
        extra={"type": user.profile_type.value, "scan_session": True},
        expires_delta=timedelta(hours=2),
    )

    response.set_cookie(
        key="luz_session",
        value=jwt_token,
        httponly=True,
        secure=True,
        samesite="lax",
        max_age=7200,  # 2h
    )

    logger.warning(f"scan_auth: SUCCESS — ip={ip} user_id={user.id} ua={user_agent[:80]}")

    # Log em admin_audit_log
    try:
        from app.models.audit import AdminAuditLog
        log = AdminAuditLog(
            actor_id=user.id,
            actor_email=user.email,
            target_id=None,
            target_email=None,
            action="scan_auth_success",
            details=f"ip={ip} ua={user_agent[:200]}",
            ip=ip,
        )
        db.add(log)
        db.commit()
    except Exception as e:
        logger.error(f"scan_auth: failed to write admin_audit_log: {e}")
        db.rollback()

    return {"status": "ok", "user_id": user.id, "expires_in_seconds": 7200}
