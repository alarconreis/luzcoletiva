"""TOTP 2FA: setup, verify, backup codes. RFC 6238 compliant."""
import base64
import io
import secrets
from datetime import datetime, timezone
from typing import Optional

import pyotp
import qrcode
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.user import User

# Mesma cifragem usada pra selfies/RG (chave VERIFY_ENCRYPTION_KEY)
from app.core.storage import _aesgcm  # AESGCM instance, not function


_bcrypt_ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")

TOTP_ISSUER = "Luz Coletiva"
TOTP_VALID_WINDOW = 1  # ±30s tolerância
BACKUP_CODE_COUNT = 10
BACKUP_CODE_LENGTH = 8


def _encrypt(plain: bytes) -> bytes:
    """Cifra com AES-GCM usando VERIFY_ENCRYPTION_KEY."""
    nonce = secrets.token_bytes(12)
    ciphertext = _aesgcm.encrypt(nonce, plain, None)
    return nonce + ciphertext


def _decrypt(blob: bytes) -> bytes:
    """Decifra blob (nonce[12] + ciphertext)."""
    nonce = blob[:12]
    ct = blob[12:]
    return _aesgcm.decrypt(nonce, ct, None)


def generate_secret() -> str:
    """Gera secret TOTP base32 (160 bits)."""
    return pyotp.random_base32()


def generate_provisioning_uri(secret: str, account_email: str) -> str:
    """URI otpauth:// pra QR code."""
    totp = pyotp.TOTP(secret)
    return totp.provisioning_uri(name=account_email, issuer_name=TOTP_ISSUER)


def generate_qr_code_base64(uri: str) -> str:
    """Gera QR code PNG em base64 pra renderizar no front."""
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_M,
        box_size=8,
        border=2,
    )
    qr.add_data(uri)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return base64.b64encode(buf.getvalue()).decode("ascii")


def verify_code(secret: str, code: str) -> bool:
    """Valida código TOTP com janela ±1 step."""
    if not code or not code.isdigit() or len(code) != 6:
        return False
    totp = pyotp.TOTP(secret)
    return totp.verify(code, valid_window=TOTP_VALID_WINDOW)


def generate_backup_codes() -> list[str]:
    """Gera 10 códigos de backup formatados XXXX-XXXX."""
    codes = []
    for _ in range(BACKUP_CODE_COUNT):
        raw = secrets.token_hex(BACKUP_CODE_LENGTH // 2).upper()
        formatted = f"{raw[:4]}-{raw[4:]}"
        codes.append(formatted)
    return codes


def hash_backup_codes(codes: list[str]) -> list[str]:
    """bcrypt hash de cada código."""
    return [_bcrypt_ctx.hash(c) for c in codes]


def verify_backup_code(code: str, hashed_codes: list[str]) -> Optional[int]:
    """Retorna índice do código se valid, None caso contrário."""
    code_upper = code.strip().upper().replace(" ", "")
    if not code_upper:
        return None
    for idx, hashed in enumerate(hashed_codes):
        if _bcrypt_ctx.verify(code_upper, hashed):
            return idx
    return None


# ==================== High-level user ops ====================

def setup_totp_for_user(db: Session, user: User) -> tuple[str, str]:
    """
    Gera secret + QR pra setup. NÃO ATIVA ainda — só confirma.
    Retorna (secret, qr_base64).
    """
    secret = generate_secret()
    uri = generate_provisioning_uri(secret, user.email)
    qr_b64 = generate_qr_code_base64(uri)
    # Salva temporariamente cifrado, mas sem enabled_at
    user.totp_secret_encrypted = _encrypt(secret.encode())
    user.totp_enabled_at = None  # ainda não ativo
    db.commit()
    return secret, qr_b64


def confirm_totp_for_user(db: Session, user: User, code: str) -> list[str]:
    """
    Valida primeiro código + ativa TOTP definitivo.
    Retorna lista de 10 backup codes em CLARO (única vez que aparecem).
    """
    if not user.totp_secret_encrypted:
        raise ValueError("Setup não iniciado")
    secret = _decrypt(user.totp_secret_encrypted).decode()
    if not verify_code(secret, code):
        raise ValueError("Código TOTP inválido")

    # Gera backup codes em claro pro user
    codes_plain = generate_backup_codes()
    # Hash bcrypt de cada um (não armazena plain)
    hashed = hash_backup_codes(codes_plain)
    # Cifra a lista hashada (defense-in-depth se DB vazar)
    import json
    blob = _encrypt(json.dumps(hashed).encode())
    user.totp_backup_codes_encrypted = base64.b64encode(blob).decode()
    user.totp_enabled_at = datetime.now(timezone.utc)
    db.commit()
    return codes_plain


def is_totp_enabled(user: User) -> bool:
    """True se TOTP ativo e funcional pro user."""
    return user.totp_enabled_at is not None and user.totp_secret_encrypted is not None


def verify_user_totp(user: User, code: str) -> bool:
    """Valida código TOTP normal (não backup)."""
    if not is_totp_enabled(user):
        return False
    secret = _decrypt(user.totp_secret_encrypted).decode()
    return verify_code(secret, code)


def verify_user_backup_code(db: Session, user: User, code: str) -> bool:
    """
    Valida backup code. Se OK, REMOVE o código (one-time).
    Retorna True/False.
    """
    if not is_totp_enabled(user) or not user.totp_backup_codes_encrypted:
        return False
    import json
    blob = base64.b64decode(user.totp_backup_codes_encrypted)
    hashed = json.loads(_decrypt(blob).decode())
    idx = verify_backup_code(code, hashed)
    if idx is None:
        return False
    # Remove código usado
    hashed.pop(idx)
    new_blob = _encrypt(json.dumps(hashed).encode())
    user.totp_backup_codes_encrypted = base64.b64encode(new_blob).decode()
    db.commit()
    return True


def disable_totp_for_user(db: Session, user: User) -> None:
    """Remove TOTP do user. Volta a usar SMS."""
    user.totp_secret_encrypted = None
    user.totp_backup_codes_encrypted = None
    user.totp_enabled_at = None
    db.commit()


def remaining_backup_codes_count(user: User) -> int:
    """Conta quantos backup codes ainda restam pra usar."""
    if not user.totp_backup_codes_encrypted:
        return 0
    try:
        import json
        blob = base64.b64decode(user.totp_backup_codes_encrypted)
        hashed = json.loads(_decrypt(blob).decode())
        return len(hashed)
    except Exception:
        return 0
