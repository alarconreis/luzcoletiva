"""
Rotas de autenticação: registro, login e logout.
"""
import hashlib
import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, Request, Response, UploadFile, status
from pydantic import ValidationError as PydanticValidationError
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.limiter import limiter
from app.core.redis_client import add_to_blocklist
from app.core.security import create_access_token, decode_token, hash_password, verify_password
from app.core.uploads import save_upload
from app.models.audit import LoginLog
from app.models.user import DocType, ProfileType, User
from app.schemas.user import (
    LoginResponse, OTPLoginResponse, OTPVerify, PasswordResetConfirm,
    PasswordResetRequest, UserLogin, UserOut, UserRegister,
)
from app.tasks.email_tasks import send_confirmation_email, send_password_reset


def _set_session_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        key="luz_session",
        value=token,
        httponly=True,
        secure=not settings.DEBUG,
        samesite="strict",
        max_age=settings.JWT_EXPIRES_MIN * 60,
        path="/",
    )


def _clear_session_cookie(response: Response) -> None:
    response.delete_cookie(
        key="luz_session",
        httponly=True,
        secure=not settings.DEBUG,
        samesite="strict",
        path="/",
    )


def _client_ip(request: Request) -> str:
    cf_ip = request.headers.get("cf-connecting-ip")
    if cf_ip:
        return cf_ip.strip()
    xff = request.headers.get("x-forwarded-for")
    if xff:
        return xff.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def _log_login(db: Session, email: str, success: bool, user_id, ip: str) -> None:
    try:
        db.add(LoginLog(user_id=user_id, email=email, success=success, ip=ip))
        db.commit()
    except Exception:  # noqa: BLE001
        db.rollback()


router = APIRouter(prefix="/api", tags=["auth"])


def _mask_email(email: str) -> str:
    """Mascara email pra hint: vinicius@gmail.com -> vi****@gmail.com"""
    try:
        local, domain = email.split("@", 1)
        if len(local) <= 2:
            masked = local[0] + "*"
        else:
            masked = local[:2] + "*" * max(2, len(local) - 2)
        return f"{masked}@{domain}"
    except Exception:  # noqa: BLE001
        return "***"



@router.post("/register", status_code=status.HTTP_201_CREATED)
@limiter.limit("3/hour")
async def register(
    request: Request,
    name: str = Form(...),
    email: str = Form(...),
    password: str = Form(...),
    profile_type: str = Form("helper"),
    doc_type: str = Form("pf"),
    phone: str = Form(...),
    cpf: Optional[str] = Form(None),
    rg: Optional[str] = Form(None),
    cnpj: Optional[str] = Form(None),
    selfie: UploadFile = File(...),
    doc_photo: UploadFile = File(...),
    selfie_was_uploaded: str = Form("false"),
    accept_terms: bool = Form(False),
    accept_privacy: bool = Form(False),
    db: Session = Depends(get_db),
):
    try:
        payload = UserRegister(
            name=name, email=email, password=password,
            profile_type=profile_type, doc_type=doc_type,
            phone=phone, cpf=cpf, rg=rg, cnpj=cnpj,
            accept_terms=accept_terms, accept_privacy=accept_privacy,
        )
    except PydanticValidationError as exc:
        errors = exc.errors()
        msg = errors[0].get("msg", "Dados inválidos") if errors else "Dados inválidos"
        msg = msg.replace("Value error, ", "")
        raise HTTPException(422, detail=msg)

    if db.query(User).filter(User.email == payload.email.lower()).first():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="E-mail já cadastrado")

    if payload.doc_type == "pf":
        if db.query(User).filter(User.cpf == payload.cpf).first():
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="CPF já cadastrado")
    else:
        if db.query(User).filter(User.cnpj == payload.cnpj).first():
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="CNPJ já cadastrado")

    # Check phone duplicado (já normalizado pelo validator)
    if db.query(User).filter(User.phone == payload.phone).first():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Telefone já cadastrado")

    selfie_path = await save_upload(selfie)
    doc_photo_path = await save_upload(doc_photo)

    now = datetime.now(timezone.utc)
    if selfie_was_uploaded == "true":
        import logging
        logging.getLogger(__name__).warning(
            "Register with uploaded selfie (no liveness): email=%s ip=%s",
            payload.email, request.client.host if request.client else "unknown",
        )

    user = User(
        name=payload.name.strip(),
        email=payload.email.lower(),
        hashed_password=hash_password(payload.password),
        profile_type=ProfileType(payload.profile_type),
        doc_type=DocType(payload.doc_type),
        phone=payload.phone,
        cpf=payload.cpf,
        rg=payload.rg.strip() if payload.rg else None,
        cnpj=payload.cnpj,
        selfie_path=selfie_path,
        doc_photo_path=doc_photo_path,
        is_approved=False,
        terms_accepted_at=now,
        privacy_accepted_at=now,
        terms_version=settings.TERMS_VERSION,
        consent_ip=_client_ip(request),
    )
    db.add(user)
    db.commit()

    try:
        send_confirmation_email.delay(user.email, user.name)
    except Exception:  # noqa: BLE001
        pass

    return {"message": "Cadastro recebido. Nossa equipe vai analisar e você receberá o acesso em breve."}


@router.post("/login")
@limiter.limit("5/5minutes")
def login(request: Request, response: Response, payload: UserLogin, db: Session = Depends(get_db)):
    ip = _client_ip(request)
    email = payload.email.lower()
    user = db.query(User).filter(User.email == email).first()

    if not user or not verify_password(payload.password, user.hashed_password):
        _log_login(db, email, False, user.id if user else None, ip)
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Credenciais inválidas")
    if not user.is_active:
        _log_login(db, email, False, user.id, ip)
        raise HTTPException(status_code=403, detail="Conta desativada")
    if not user.is_approved:
        _log_login(db, email, False, user.id, ip)
        raise HTTPException(status_code=403, detail="Cadastro aguardando aprovação")

    _log_login(db, email, True, user.id, ip)

    # TOTP tem prioridade sobre SMS (mais seguro)
    from app.core.totp import is_totp_enabled as _is_totp_enabled
    if _is_totp_enabled(user):
        import uuid as _uuid
        import redis as _redis_lib
        _r = _redis_lib.from_url(settings.REDIS_URL, decode_responses=True)
        challenge_token = str(_uuid.uuid4())
        _r.setex(f"totp_challenge:{challenge_token}", 600, str(user.id))
        return {
            "require_totp": True,
            "challenge_token": challenge_token,
        }

    if user.phone:
        from app.core.otp import generate_otp, send_otp_email, check_otp_cap, OtpCapExceeded
        try:
            check_otp_cap(user.id, ip=ip)
        except OtpCapExceeded as e:
            # Retorna 429 com Retry-After em segundos
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Muitas tentativas de login. Tente novamente em {max(60, e.retry_after // 60)} minutos.",
                headers={"Retry-After": str(e.retry_after)},
            )
        otp_token, code = generate_otp(user.id)
        try:
            send_otp_email(user.email, code)
        except Exception:  # noqa: BLE001
            pass
        return OTPLoginResponse(otp_token=otp_token, phone_hint=_mask_email(user.email))

    token = create_access_token(user.id, extra={"type": user.profile_type.value})
    _set_session_cookie(response, token)
    return LoginResponse(user=UserOut.model_validate(user))


@router.post("/verify-otp", response_model=LoginResponse)
@limiter.limit("3/5minutes")
def verify_otp_endpoint(
    request: Request,
    response: Response,
    payload: OTPVerify,
    db: Session = Depends(get_db),
):
    from app.core.otp import verify_otp
    user_id = verify_otp(payload.otp_token, payload.code)
    if user_id is None:
        raise HTTPException(401, "Código inválido ou expirado")
    user = db.query(User).filter(User.id == user_id).first()
    if not user or not user.is_active or not user.is_approved:
        raise HTTPException(403, "Acesso negado")
    token = create_access_token(user.id, extra={"type": user.profile_type.value})
    _set_session_cookie(response, token)
    return LoginResponse(user=UserOut.model_validate(user))


_RESET_TOKEN_TTL_MIN = 30


@router.post("/password-reset/request", status_code=status.HTTP_200_OK)
@limiter.limit("3/hour")
def request_password_reset(request: Request, payload: PasswordResetRequest, db: Session = Depends(get_db)):
    # Always return 200 regardless of whether email exists (anti-enumeration)
    user = db.query(User).filter(User.email == payload.email.lower()).first()
    if user and user.is_active:
        raw_token = secrets.token_urlsafe(32)
        token_hash = hashlib.sha256(raw_token.encode()).hexdigest()
        user.reset_token_hash = token_hash
        user.reset_token_expires_at = datetime.now(timezone.utc) + timedelta(minutes=_RESET_TOKEN_TTL_MIN)
        db.commit()
        reset_url = f"{settings.APP_BASE_URL}/reset-password?token={raw_token}"
        try:
            send_password_reset.delay(user.email, user.name, reset_url)
        except Exception:  # noqa: BLE001
            pass
    return {"message": "Se este e-mail estiver cadastrado, você receberá as instruções em breve."}


@router.post("/password-reset/confirm", status_code=status.HTTP_200_OK)
@limiter.limit("5/hour")
def confirm_password_reset(request: Request, payload: PasswordResetConfirm, db: Session = Depends(get_db)):
    token_hash = hashlib.sha256(payload.token.encode()).hexdigest()
    user = db.query(User).filter(User.reset_token_hash == token_hash).first()
    now = datetime.now(timezone.utc)
    if (
        not user
        or not user.reset_token_expires_at
        or user.reset_token_expires_at.replace(tzinfo=timezone.utc) < now
    ):
        raise HTTPException(status_code=400, detail="Link inválido ou expirado")
    user.hashed_password = hash_password(payload.new_password)
    user.reset_token_hash = None
    user.reset_token_expires_at = None
    db.commit()
    return {"message": "Senha redefinida com sucesso. Você já pode fazer login."}


@router.post("/logout")
def logout(request: Request, response: Response):
    token = request.cookies.get("luz_session")
    if token:
        payload = decode_token(token)
        if payload:
            jti = payload.get("jti")
            if jti:
                exp = payload.get("exp")
                ttl = max(1, int(exp - datetime.now(timezone.utc).timestamp())) if exp else 1
                add_to_blocklist(jti, ttl)
    _clear_session_cookie(response)
    return {"message": "Sessão encerrada"}


# ==================== TOTP 2FA (admin only) ====================
from app.core.totp import (
    setup_totp_for_user,
    confirm_totp_for_user,
    disable_totp_for_user,
    verify_user_totp,
    verify_user_backup_code,
    is_totp_enabled,
    remaining_backup_codes_count,
)
from app.schemas.totp import (
    TotpSetupOut,
    TotpConfirmIn,
    TotpConfirmOut,
    TotpDisableIn,
    TotpVerifyIn,
    TotpVerifyOut,
)
from app.core.rbac import require_admin
from app.models.audit import AdminAuditLog
import uuid
import json
import redis as redis_lib

_redis_totp = redis_lib.from_url(settings.REDIS_URL, decode_responses=True)
TOTP_CHALLENGE_TTL = 600  # 10 min


def _log_totp(db: Session, user: User, action: str, ip: str, details: str = "") -> None:
    entry = AdminAuditLog(
        actor_id=user.id,
        actor_email=user.email,
        target_id=user.id,
        target_email=user.email,
        action=action,
        details=details or None,
        ip=ip,
    )
    db.add(entry)
    db.commit()


@router.post("/admin/me/totp/setup", response_model=TotpSetupOut)
@limiter.limit("5/hour")
def totp_setup(
    request: Request,
    db: Session = Depends(get_db),
    actor: User = Depends(require_admin),
):
    """Gera secret e QR. Não ativa ainda (precisa confirmar)."""
    if is_totp_enabled(actor):
        raise HTTPException(400, "TOTP já está ativo. Desative primeiro pra resetar.")
    secret, qr_b64 = setup_totp_for_user(db, actor)
    _log_totp(db, actor, "totp_setup_initiated", _client_ip(request))
    return TotpSetupOut(qr_code_base64=qr_b64, secret=secret)


@router.post("/admin/me/totp/confirm", response_model=TotpConfirmOut)
@limiter.limit("10/hour")
def totp_confirm(
    payload: TotpConfirmIn,
    request: Request,
    db: Session = Depends(get_db),
    actor: User = Depends(require_admin),
):
    """Valida primeiro código TOTP e ativa definitivamente."""
    try:
        backup_codes = confirm_totp_for_user(db, actor, payload.code)
    except ValueError as e:
        _log_totp(db, actor, "totp_confirm_failed", _client_ip(request), str(e))
        raise HTTPException(400, str(e))
    _log_totp(db, actor, "totp_activated", _client_ip(request))
    return TotpConfirmOut(
        enabled=True,
        backup_codes=backup_codes,
        message="TOTP ativado. Salve os backup codes — não serão exibidos novamente.",
    )


@router.post("/admin/me/totp/disable", status_code=204)
@limiter.limit("5/hour")
def totp_disable(
    payload: TotpDisableIn,
    request: Request,
    db: Session = Depends(get_db),
    actor: User = Depends(require_admin),
):
    """Desativa TOTP. Requer senha + código atual."""
    if not is_totp_enabled(actor):
        raise HTTPException(400, "TOTP não está ativo")
    if not pwd_context.verify(payload.password, actor.hashed_password):
        _log_totp(db, actor, "totp_disable_wrong_password", _client_ip(request))
        raise HTTPException(401, "Senha incorreta")
    if not verify_user_totp(actor, payload.code):
        _log_totp(db, actor, "totp_disable_wrong_code", _client_ip(request))
        raise HTTPException(401, "Código TOTP incorreto")
    disable_totp_for_user(db, actor)
    _log_totp(db, actor, "totp_disabled", _client_ip(request))


@router.get("/admin/me/totp/status")
@limiter.limit("30/minute")
def totp_status(
    request: Request,
    actor: User = Depends(require_admin),
):
    """Status: enabled, restantes backup codes."""
    return {
        "enabled": is_totp_enabled(actor),
        "enabled_at": actor.totp_enabled_at,
        "backup_codes_remaining": remaining_backup_codes_count(actor),
    }


@router.post("/verify-totp", response_model=LoginResponse)
@limiter.limit("5/minute")
def verify_totp_endpoint(
    payload: TotpVerifyIn,
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
):
    """Valida TOTP ou backup code pós-login. Retorna user + seta cookie."""
    challenge_key = f"totp_challenge:{payload.challenge_token}"
    user_id_str = _redis_totp.get(challenge_key)
    if not user_id_str:
        raise HTTPException(401, "Challenge inválido ou expirado")
    user = db.query(User).filter(User.id == int(user_id_str)).first()
    if not user or not is_totp_enabled(user):
        raise HTTPException(401, "User sem TOTP")
    if not user.is_active or not user.is_approved:
        raise HTTPException(403, "Acesso negado")

    if payload.is_backup:
        ok = verify_user_backup_code(db, user, payload.code)
        action = "totp_login_backup"
    else:
        ok = verify_user_totp(user, payload.code)
        action = "totp_login_code"

    if not ok:
        _log_totp(db, user, f"{action}_failed", _client_ip(request))
        raise HTTPException(401, "Código TOTP inválido")

    _redis_totp.delete(challenge_key)
    _log_totp(db, user, action, _client_ip(request))

    token = create_access_token(user.id, extra={"type": user.profile_type.value})
    _set_session_cookie(response, token)
    return LoginResponse(user=UserOut.model_validate(user))