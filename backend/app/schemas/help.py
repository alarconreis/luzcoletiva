"""
Schemas Pydantic para pedidos de ajuda, ofertas e chat.
"""
from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator


# ---------- Inputs ----------


class HelpRequestCreate(BaseModel):
    title: str = Field(min_length=5, max_length=120)
    description: str = Field(min_length=10, max_length=2000)
    category: Literal[
        "livros",
        "material_escolar",
        "instrumentos_musicais",
        "roupas_calcados",
        "itens_bebe",
        "racao_pets",
    ]
    city: str = Field(min_length=2, max_length=80)
    state: str = Field(min_length=2, max_length=2)


class HelpOfferCreate(BaseModel):
    message: Optional[str] = Field(None, max_length=500)


class ChatMessageCreate(BaseModel):
    content: str = Field(min_length=1, max_length=500)


class ChatReportCreate(BaseModel):
    reason: Optional[str] = Field(None, max_length=500)


# ---------- Outputs ----------

class _UserMini(BaseModel):
    """Versão pública mínima de usuário."""
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    avg_rating: Optional[float] = None
    rating_count: int = 0
    created_at: datetime

    @field_validator("name")
    @classmethod
    def _full_name(cls, v: str) -> str:
        return v


class _UserAnon(BaseModel):
    """Versão anônima: primeiro nome + inicial."""
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    trust_level: str
    avg_rating: Optional[float] = None
    rating_count: int = 0
    created_at: datetime

    @field_validator("name", mode="before")
    @classmethod
    def _anonymize(cls, v: str) -> str:
        if not v:
            return ""
        parts = v.strip().split()
        if len(parts) == 1:
            return parts[0]
        return f"{parts[0]} {parts[-1][0]}."

    @field_validator("trust_level", mode="before")
    @classmethod
    def _trust_str(cls, v) -> str:
        return v.value if hasattr(v, "value") else str(v)


class HelpRequestPublic(BaseModel):
    """
    Versão pública listada para helpers — solicitante anonimizado.
    """
    is_institutional: bool = False
    assisted_profile_name: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)
    id: int
    title: str
    description: str
    category: str
    city: str
    state: str
    status: str
    value: Optional[float] = None
    requester: _UserAnon
    created_at: datetime

    @field_validator("category", "status", mode="before")
    @classmethod
    def _enum_to_str(cls, v):
        return v.value if hasattr(v, "value") else v


class HelpRequestDetail(BaseModel):
    """
    Versão completa para o solicitante (dono) e o helper aceito.
    """
    is_accepted_helper: bool = False  # populado pelo backend baseado no usuário atual
    has_open_report: bool = False  # populado pelo backend: usuário atual já denunciou e ainda não foi resolvido

    model_config = ConfigDict(from_attributes=True)
    id: int
    title: str
    description: str
    category: str
    city: str
    state: str
    status: str
    value: Optional[float] = None
    requester: _UserMini
    accepted_offer_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    # Campos de logística (Fase 2)
    shipping_method: Optional[str] = None  # 'correios' | 'pickup_point'
    shipping_address_json: Optional[dict] = None
    pickup_location: Optional[str] = None
    tracking_code: Optional[str] = None
    shipped_at: Optional[datetime] = None
    delivered_at: Optional[datetime] = None

    # Atendimento Assistido
    is_institutional: bool = False
    assisted_profile_name: Optional[str] = None  # populado pelo backend

    @field_validator("category", "status", "shipping_method", mode="before")
    @classmethod
    def _enum_to_str(cls, v):
        return v.value if hasattr(v, "value") else v


class HelpOfferOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    request_id: int
    helper: _UserMini
    message: Optional[str]
    status: str
    created_at: datetime

    @field_validator("status", mode="before")
    @classmethod
    def _enum_to_str(cls, v):
        return v.value if hasattr(v, "value") else v


class ChatMessageOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    request_id: int
    sender_id: int
    content: str
    is_redacted: bool
    created_at: datetime


# ============================================
# Schemas de logística (Fase 2)
# ============================================

class ShippingAddress(BaseModel):
    """Endereço estruturado para envio via Correios."""
    cep: str = Field(..., min_length=8, max_length=9, description="CEP (com ou sem hífen)")
    street: str = Field(..., min_length=3, max_length=120)
    number: str = Field(..., min_length=1, max_length=20)
    complement: Optional[str] = Field(None, max_length=80)
    neighborhood: str = Field(..., min_length=2, max_length=80)
    city: str = Field(..., min_length=2, max_length=80)
    state: str = Field(..., min_length=2, max_length=2)
    recipient_name: str = Field(..., min_length=2, max_length=120)
    recipient_phone: str = Field(..., min_length=10, max_length=20)

    @field_validator("cep")
    @classmethod
    def normalize_cep(cls, v: str) -> str:
        digits = "".join(c for c in v if c.isdigit())
        if len(digits) != 8:
            raise ValueError("CEP deve ter 8 dígitos")
        return f"{digits[:5]}-{digits[5:]}"

    @field_validator("state")
    @classmethod
    def upper_state(cls, v: str) -> str:
        return v.upper()


class ShippingMethodChoice(BaseModel):
    """Helper escolhe modo de entrega."""
    method: Literal["correios", "pickup_point"]


class PickupLocationUpdate(BaseModel):
    """Ajudado descreve ponto de retirada (texto livre)."""
    location: str = Field(..., min_length=10, max_length=500)


class TrackingCodeUpdate(BaseModel):
    """Helper anexa código de rastreio dos Correios."""
    tracking_code: str = Field(..., min_length=13, max_length=13)

    @field_validator("tracking_code")
    @classmethod
    def validate_correios_format(cls, v: str) -> str:
        v = v.upper().strip()
        # Formato: XX 9 dígitos BR (ex: BR123456789BR)
        import re
        if not re.match(r"^[A-Z]{2}\d{9}[A-Z]{2}$", v):
            raise ValueError("Formato esperado: XX123456789BR (2 letras + 9 dígitos + 2 letras)")
        return v
