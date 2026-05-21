"""
Modelos de pedido de ajuda, oferta e chat.

Fluxo:
  HelpRequest (OPEN)
    └─ HelpOffer (PROPOSED) ───────┐
                                    │ aceito pelo solicitante
                                    ▼
                       HelpRequest (MATCHED) → chat liberado
                                    │
                                    ▼ marcado concluído
                       HelpRequest (CLOSED)
"""
import enum
from sqlalchemy import (
    Column, DateTime, Enum, ForeignKey, Integer, Numeric, String, Text, Boolean
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class HelpCategory(str, enum.Enum):
    livros = "livros"
    material_escolar = "material_escolar"
    instrumentos_musicais = "instrumentos_musicais"
    roupas_calcados = "roupas_calcados"
    itens_bebe = "itens_bebe"
    racao_pets = "racao_pets"



class HelpRequestStatus(str, enum.Enum):
    pending_review = "pending_review"  # aguardando aprovação do moderador
    open = "open"              # aguardando ofertas
    proposed = "proposed"      # ao menos uma oferta pendente
    matched = "matched"        # solicitante aceitou um helper
    in_transit = "in_transit"  # helper enviou, ajudado aguardando
    delivered = "delivered"    # ajudado confirmou recebimento
    closed = "closed"          # concluído (ou auto após 7d em delivered)
    cancelled = "cancelled"    # cancelado pelo solicitante


class ShippingMethod(str, enum.Enum):
    correios = "correios"
    pickup_point = "pickup_point"


class HelpOfferStatus(str, enum.Enum):
    pending = "pending"      # aguardando resposta do solicitante
    accepted = "accepted"    # solicitante aceitou
    declined = "declined"    # solicitante recusou
    withdrawn = "withdrawn"  # helper desistiu


class HelpRequest(Base):
    __tablename__ = "help_requests"

    id = Column(Integer, primary_key=True, index=True)
    requester_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(120), nullable=False)
    description = Column(Text, nullable=False)
    category = Column(Enum(HelpCategory), nullable=False, index=True)
    city = Column(String(80), nullable=False)
    state = Column(String(2), nullable=False)
    status = Column(Enum(HelpRequestStatus), nullable=False, default=HelpRequestStatus.open, index=True)
    accepted_offer_id = Column(Integer, ForeignKey("help_offers.id", ondelete="SET NULL"), nullable=True)
    value = Column(Numeric(8, 2), nullable=True)  # valor solicitado em BRL (R$ 50–300)
    document_path = Column(String(255), nullable=True)  # prova de necessidade obrigatória no cadastro
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    # Logística pós-aceite (Fase 2)
    shipping_method = Column(Enum(ShippingMethod), nullable=True)
    shipping_address_json = Column(JSONB, nullable=True)  # apagado quando vira closed (LGPD)
    pickup_location = Column(Text, nullable=True)         # apagado quando vira closed (LGPD)
    tracking_code = Column(String(20), nullable=True)     # formato XX123456789BR
    shipped_at = Column(DateTime(timezone=True), nullable=True)
    delivered_at = Column(DateTime(timezone=True), nullable=True)

    # Atendimento Assistido (Fase Institucional)
    is_institutional = Column(Boolean, nullable=False, default=False)
    assisted_profile_id = Column(Integer, ForeignKey("assisted_profiles.id"), nullable=True)
    created_by_admin_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    assisted_profile = relationship("AssistedProfile", back_populates="requests", foreign_keys=[assisted_profile_id])
    created_by_admin = relationship("User", foreign_keys=[created_by_admin_id])
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    requester = relationship("User", foreign_keys=[requester_id])


class HelpOffer(Base):
    __tablename__ = "help_offers"

    id = Column(Integer, primary_key=True, index=True)
    request_id = Column(Integer, ForeignKey("help_requests.id", ondelete="CASCADE"), nullable=False, index=True)
    helper_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    message = Column(Text, nullable=True)  # apresentação do helper (opcional, max 500)
    status = Column(Enum(HelpOfferStatus), nullable=False, default=HelpOfferStatus.pending, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    request = relationship("HelpRequest", foreign_keys=[request_id])
    helper = relationship("User", foreign_keys=[helper_id])


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    request_id = Column(Integer, ForeignKey("help_requests.id", ondelete="CASCADE"), nullable=False, index=True)
    sender_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    content = Column(String(500), nullable=False)
    is_redacted = Column(Boolean, default=False, nullable=False)  # admin pode censurar
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)


class ChatReport(Base):
    __tablename__ = "chat_reports"

    id = Column(Integer, primary_key=True, index=True)
    request_id = Column(Integer, ForeignKey("help_requests.id", ondelete="CASCADE"), nullable=False, index=True)
    reporter_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    reason = Column(String(500), nullable=True)
    resolved = Column(Boolean, default=False, nullable=False, index=True)
    resolved_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    resolved_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
