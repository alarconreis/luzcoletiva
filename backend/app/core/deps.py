from fastapi import Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.redis_client import is_blocklisted
from app.core.security import decode_token
from app.models.user import User


def get_current_user(
    request: Request,
    db: Session = Depends(get_db),
) -> User:
    credentials_error = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Credenciais inválidas",
    )
    token = request.cookies.get("luz_session")
    if not token:
        raise credentials_error

    payload = decode_token(token)
    if not payload or not payload.get("sub"):
        raise credentials_error

    jti = payload.get("jti")
    if jti and is_blocklisted(jti):
        raise credentials_error

    user = db.query(User).filter(User.id == int(payload["sub"])).first()
    if not user:
        raise credentials_error
    return user


# ==================== Path traversal defense ====================
from pathlib import Path as _Path

def safe_path_under(base: _Path, filename: str | None) -> _Path | None:
    """
    Resolve `base/filename` e confirma que o resultado está dentro de `base`.
    Retorna None se filename for inválido, vazio, ou tentar escapar do diretório.
    Use sempre que servir arquivos cujo path vem do banco/usuário.
    """
    if not filename:
        return None
    try:
        candidate = (base / filename).resolve()
        base_resolved = base.resolve()
        candidate.relative_to(base_resolved)
        return candidate
    except (ValueError, OSError):
        return None
