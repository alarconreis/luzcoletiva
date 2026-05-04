"""
Log de e-mails enviados — auditoria e debug.
"""
from sqlalchemy import Column, DateTime, Integer, String, Text, Boolean
from sqlalchemy.sql import func
from app.core.database import Base


class EmailLog(Base):
    __tablename__ = "email_log"

    id = Column(Integer, primary_key=True, index=True)
    to_email = Column(String(255), nullable=False, index=True)
    subject = Column(String(255), nullable=False)
    template = Column(String(64), nullable=False, index=True)
    provider_id = Column(String(120), nullable=True)  # ID retornado pelo Resend
    success = Column(Boolean, default=False, nullable=False, index=True)
    error = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
