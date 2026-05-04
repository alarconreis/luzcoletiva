"""
Role-Based Access Control — dependências para proteger endpoints.
"""
from fastapi import Depends, HTTPException, status

from app.core.deps import get_current_user
from app.models.user import User, UserRole


def require_role(*allowed: UserRole):
    """Factory de dependência: só passa se user.role estiver em `allowed`."""
    def _checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in allowed:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Permissão insuficiente",
            )
        return current_user
    return _checker


require_moderator = require_role(UserRole.moderator, UserRole.admin)
require_admin = require_role(UserRole.admin)
