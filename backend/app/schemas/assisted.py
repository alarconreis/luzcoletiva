from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field, field_validator


def normalize_cep(value):
    """Normaliza CEP para 8 dígitos. Aceita None/vazio. Valida formato."""
    if value is None or value == "":
        return None
    digits = "".join(c for c in str(value) if c.isdigit())
    if len(digits) != 8:
        raise ValueError("CEP deve ter 8 dígitos")
    return digits


class AssistedProfileCreate(BaseModel):
    """Body pra criar perfil assistido. Foto vem como UploadFile separado no endpoint."""
    full_name: str = Field(..., min_length=2, max_length=120)
    city: str = Field(..., min_length=2, max_length=80)
    state: str = Field(..., min_length=2, max_length=2)
    contact_phone: Optional[str] = Field(None, max_length=20)
    cep: Optional[str] = Field(None, max_length=9)
    address: Optional[str] = Field(None, max_length=500)
    story: str = Field(..., min_length=20, max_length=2000)

    @field_validator("state", mode="before")
    @classmethod
    def _upper_state(cls, v):
        return v.upper() if isinstance(v, str) else v

    @field_validator("contact_phone", mode="before")
    @classmethod
    def _normalize_phone(cls, v):
        if v is None or v == "":
            return None
        digits = "".join(c for c in str(v) if c.isdigit())
        if len(digits) < 10 or len(digits) > 15:
            raise ValueError("Telefone deve ter 10-15 dígitos com DDD")
        return digits

    @field_validator("cep", mode="before")
    @classmethod
    def _normalize_cep(cls, v):
        return normalize_cep(v)


class AssistedProfileOut(BaseModel):
    """Versão pública (mod): SEM endereço/CEP."""
    model_config = ConfigDict(from_attributes=True)
    id: int
    full_name: str
    city: str
    state: str
    contact_phone: Optional[str] = None
    photo_path: str
    story: str
    created_by_admin_id: int
    archived: bool
    created_at: datetime


class AssistedProfileAdminOut(AssistedProfileOut):
    """Versão admin: inclui CEP e endereço."""
    cep: Optional[str] = None
    address: Optional[str] = None


class InstitutionalRequestCreate(BaseModel):
    """Cria pedido em nome de um assisted_profile."""
    assisted_profile_id: int
    title: str = Field(..., min_length=5, max_length=120)
    description: str = Field(..., min_length=10, max_length=2000)
    category: str
    value: float = Field(..., ge=50.0, le=300.0)
