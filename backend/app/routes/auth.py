"""
Rotas de autenticação: registro, login e logout.
"""
from datetime import datetime, timezone
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
from app.schemas.user import LoginResponse, OTPLoginResponse, OTPVerify, UserLogin, UserOut, UserRegister
from app.tasks.email_tasks import send_confirmation_email


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
    db: Session = Depends(get_db),
):
    try:
        payload = UserRegister(
            name=name, email=email, password=password,
            profile_type=profile_type, doc_type=doc_type,
            phone=phone, cpf=cpf, rg=rg, cnpj=cnpj,
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

    selfie_path = await save_upload(selfie)
    doc_photo_path = await save_upload(doc_photo)

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

    if user.phone:
        from app.core.otp import generate_otp, send_otp_sms
        otp_token, code = generate_otp(user.id)
        try:
            send_otp_sms(user.phone, code)
        except Exception:  # noqa: BLE001
            pass
        return OTPLoginResponse(otp_token=otp_token, phone_hint=user.phone[-4:])

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
