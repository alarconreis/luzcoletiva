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
        "alimentacao", "educacao", "saude", "instrumentos_musicais", "livros"
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

    @field_validator("category", "status", mode="before")
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
