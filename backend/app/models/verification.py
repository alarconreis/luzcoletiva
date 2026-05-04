"""
Modelo de tentativa de verificação de identidade.

Estados:
  pending   → upload feito, aguardando processamento
  processing → Claude Vision rodando
  approved  → todos os checks passaram
  rejected  → algum check falhou (sem ambiguidade)
  manual    → ambíguo, fila de revisão admin
  expired   → 30 dias passaram, imagens descartadas
"""
import enum
from sqlalchemy import (
    Boolean, Column, DateTime, Enum, Float, ForeignKey, Integer, String, Text
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class VerificationStatus(str, enum.Enum):
    pending = "pending"
    processing = "processing"
    approved = "approved"
    rejected = "rejected"
    manual = "manual"
    expired = "expired"


class VerificationAttempt(Base):
    __tablename__ = "verification_attempts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    status = Column(Enum(VerificationStatus), nullable=False, default=VerificationStatus.pending, index=True)

    # Resultados dos 3 checks (score 0..1, ou null se não rodou)
    score_document = Column(Float, nullable=True)
    score_liveness = Column(Float, nullable=True)
    score_face_match = Column(Float, nullable=True)

    # Dados extraídos do RG (apenas pra cruzamento; descartado com a imagem)
    extracted_name = Column(String(160), nullable=True)
    extracted_birthdate = Column(String(20), nullable=True)
    name_match_score = Column(Float, nullable=True)

    # Veredito final e motivo (se rejeitado)
    final_decision = Column(String(40), nullable=True)
    rejection_reason = Column(String(500), nullable=True)

    # Avatar — selfie pode virar foto de perfil (decisão 5b: opt-in)
    selfie_keep_as_avatar = Column(Boolean, default=False, nullable=False)

    # Imagens já foram descartadas?
    images_purged = Column(Boolean, default=False, nullable=False, index=True)

    # Auditoria
    ip = Column(String(64), nullable=True)
    user_agent = Column(String(500), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    processed_at = Column(DateTime(timezone=True), nullable=True)
    purged_at = Column(DateTime(timezone=True), nullable=True)

    user = relationship("User", foreign_keys=[user_id])
