"""
Log de auditoria — ações administrativas e acessos deixam rastro.
Append-only. Nunca editar nem deletar registros aqui.
"""
from sqlalchemy import Boolean, Column, DateTime, Integer, String, Text
from sqlalchemy.sql import func

from app.core.database import Base


class AdminAuditLog(Base):
    __tablename__ = "admin_audit_log"

    id = Column(Integer, primary_key=True, index=True)
    actor_id = Column(Integer, nullable=False, index=True)        # quem fez
    actor_email = Column(String(255), nullable=False)             # snapshot
    target_id = Column(Integer, nullable=True, index=True)        # quem foi alvo
    target_email = Column(String(255), nullable=True)             # snapshot
    action = Column(String(64), nullable=False, index=True)       # suspend|activate|promote|...
    details = Column(Text, nullable=True)                         # contexto livre
    ip = Column(String(64), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)


class LoginLog(Base):
    __tablename__ = "login_log"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=True, index=True)   # null quando e-mail não encontrado
    email = Column(String(255), nullable=False, index=True)
    success = Column(Boolean, nullable=False)
    ip = Column(String(64), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
