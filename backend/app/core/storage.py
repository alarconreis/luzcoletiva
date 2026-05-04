"""
Storage cifrado para imagens de verificação de identidade.

- AES-256-GCM com chave derivada de VERIFY_ENCRYPTION_KEY (HKDF-SHA256)
- Cada arquivo tem nonce único de 12 bytes prepended
- Layout: <nonce(12)><ciphertext><tag(16)>
- Path estruturado: <root>/<user_id>/<attempt_id>/{rg,selfie}.bin
"""
import base64
import os
import secrets
from pathlib import Path

from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives.kdf.hkdf import HKDF

from app.core.config import settings


def _derive_key() -> bytes:
    """Deriva chave AES-256 (32 bytes) da VERIFY_ENCRYPTION_KEY."""
    if not settings.VERIFY_ENCRYPTION_KEY:
        raise RuntimeError("VERIFY_ENCRYPTION_KEY não configurada")
    base = settings.VERIFY_ENCRYPTION_KEY.encode("utf-8")
    hkdf = HKDF(
        algorithm=hashes.SHA256(),
        length=32,
        salt=b"luzcoletiva-verify-v1",
        info=b"image-encryption",
    )
    return hkdf.derive(base)


_aesgcm = AESGCM(_derive_key())


def _path(user_id: int, attempt_id: int, kind: str) -> Path:
    if kind not in ("rg", "selfie"):
        raise ValueError("kind deve ser 'rg' ou 'selfie'")
    root = Path(settings.VERIFY_STORAGE_PATH)
    folder = root / str(user_id) / str(attempt_id)
    folder.mkdir(parents=True, exist_ok=True)
    try:
        os.chmod(folder, 0o700)
        os.chmod(folder.parent, 0o700)
    except (OSError, PermissionError):
        pass  # já está OK ou sem permissão pra mudar
    return folder / f"{kind}.bin"


def write_image(user_id: int, attempt_id: int, kind: str, plaintext: bytes) -> str:
    """Cifra e grava uma imagem. Retorna o path relativo."""
    nonce = secrets.token_bytes(12)
    ciphertext = _aesgcm.encrypt(nonce, plaintext, None)
    target = _path(user_id, attempt_id, kind)
    with open(target, "wb") as f:
        f.write(nonce + ciphertext)
    try:
        os.chmod(target, 0o600)
    except (OSError, PermissionError):
        pass
    return str(target)


def read_image(user_id: int, attempt_id: int, kind: str) -> bytes:
    """Lê e decifra uma imagem."""
    target = _path(user_id, attempt_id, kind)
    if not target.exists():
        raise FileNotFoundError(f"Imagem {kind} não encontrada")
    with open(target, "rb") as f:
        blob = f.read()
    nonce, ciphertext = blob[:12], blob[12:]
    return _aesgcm.decrypt(nonce, ciphertext, None)


def delete_attempt(user_id: int, attempt_id: int) -> None:
    """Remove todas as imagens de uma tentativa."""
    folder = Path(settings.VERIFY_STORAGE_PATH) / str(user_id) / str(attempt_id)
    if folder.exists():
        for f in folder.iterdir():
            try:
                f.unlink()
            except OSError:
                pass
        try:
            folder.rmdir()
        except OSError:
            pass


def to_base64(data: bytes) -> str:
    """Helper pra mandar bytes pra Claude Vision."""
    return base64.standard_b64encode(data).decode("ascii")
