"""
Modelo User — pessoas que oferecem ou solicitam ajuda.

profile_type: natureza do uso (helper | requester)
role:         autorização (user | moderator | admin)
trust_level:  score de confiabilidade do solicitante (novo → parceiro_validado)
"""
import enum
from sqlalchemy import Column, DateTime, Enum, Float, Integer, String, Boolean
from sqlalchemy.sql import func

from app.core.database import Base


class ProfileType(str, enum.Enum):
    helper = "helper"
    requester = "requester"


class UserRole(str, enum.Enum):
    user = "user"
    moderator = "moderator"
    admin = "admin"


class DocType(str, enum.Enum):
    pf = "pf"   # pessoa física  — CPF + RG
    pj = "pj"   # pessoa jurídica — CNPJ (empresa / ONG)


class TrustLevel(str, enum.Enum):
    novo = "novo"
    verificado = "verificado"
    confiavel = "confiavel"
    parceiro_validado = "parceiro_validado"


# Máximo de pedidos abertos simultâneos por nível — solicitante (None = sem limite)
TRUST_OPEN_LIMITS: dict[TrustLevel, int | None] = {
    TrustLevel.novo: 2,
    TrustLevel.verificado: 5,
    TrustLevel.confiavel: 10,
    TrustLevel.parceiro_validado: None,
}

# Máximo de ofertas pendentes simultâneas por nível — helper (None = sem limite)
TRUST_OFFER_LIMITS: dict[TrustLevel, int | None] = {
    TrustLevel.novo: 3,
    TrustLevel.verificado: 8,
    TrustLevel.confiavel: 15,
    TrustLevel.parceiro_validado: None,
}

# Peso de ordenação na lista pública (menor = aparece primeiro)
TRUST_SORT_WEIGHT: dict[TrustLevel, int] = {
    TrustLevel.parceiro_validado: 1,
    TrustLevel.confiavel: 2,
    TrustLevel.verificado: 3,
    TrustLevel.novo: 4,
}


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(120), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    profile_type = Column(Enum(ProfileType), nullable=False, default=ProfileType.helper)
    role = Column(Enum(UserRole), nullable=False, default=UserRole.user, server_default="user")
    doc_type = Column(Enum(DocType), nullable=False, default=DocType.pf, server_default="pf")
    cpf = Column(String(14), unique=True, nullable=True, index=True)
    rg = Column(String(30), nullable=True)
    cnpj = Column(String(18), unique=True, nullable=True, index=True)
    is_approved = Column(Boolean, default=False, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    is_verified = Column(Boolean, default=False, nullable=False)
    trust_level = Column(
        Enum(TrustLevel), nullable=False,
        default=TrustLevel.novo, server_default="novo",
    )
    avg_rating = Column(Float, nullable=True)
    rating_count = Column(Integer, nullable=False, default=0, server_default="0")
    phone = Column(String(20), nullable=True)
    selfie_path = Column(String(255), nullable=True)
    doc_photo_path = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    def __repr__(self) -> str:
        return f"<User id={self.id} email={self.email} role={self.role}>"
