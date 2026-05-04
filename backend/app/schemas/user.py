"""
Schemas Pydantic — contratos da API.
"""
import re
from datetime import datetime
from typing import Literal, Optional


from pydantic import BaseModel, EmailStr, Field, ConfigDict, field_validator, model_validator


def _cpf_valid(digits: str) -> bool:
    if len(set(digits)) == 1:
        return False
    s = sum(int(digits[i]) * (10 - i) for i in range(9))
    r = s % 11
    if int(digits[9]) != (0 if r < 2 else 11 - r):
        return False
    s = sum(int(digits[i]) * (11 - i) for i in range(10))
    r = s % 11
    return int(digits[10]) == (0 if r < 2 else 11 - r)


def _cnpj_valid(digits: str) -> bool:
    if len(set(digits)) == 1:
        return False
    w1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
    w2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
    def mod(n: int) -> int:
        r = n % 11
        return 0 if r < 2 else 11 - r
    s1 = sum(int(digits[i]) * w1[i] for i in range(12))
    if int(digits[12]) != mod(s1):
        return False
    s2 = sum(int(digits[i]) * w2[i] for i in range(13))
    return int(digits[13]) == mod(s2)


def _validate_password_strength(v: str) -> str:
    errors = []
    if not re.search(r"[A-Z]", v):
        errors.append("uma letra maiúscula")
    if not re.search(r"[a-z]", v):
        errors.append("uma letra minúscula")
    if not re.search(r"\d", v):
        errors.append("um número")
    if not re.search(r"[^A-Za-z0-9]", v):
        errors.append("um caractere especial")
    if errors:
        raise ValueError(f"A senha deve conter ao menos: {', '.join(errors)}")
    return v


class UserRegister(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    profile_type: Literal["helper", "requester"] = "helper"
    doc_type: Literal["pf", "pj"] = "pf"
    phone: str = Field(max_length=20)
    # Pessoa física
    cpf: Optional[str] = Field(None, max_length=14)
    rg: Optional[str] = Field(None, max_length=30)
    # Pessoa jurídica
    cnpj: Optional[str] = Field(None, max_length=18)

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        return _validate_password_strength(v)

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        digits = re.sub(r"\D", "", v)
        if digits.startswith("55") and len(digits) > 11:
            digits = digits[2:]
        if len(digits) not in (10, 11):
            raise ValueError("Número de telefone inválido (DDD + número)")
        return f"+55{digits}"

    @field_validator("cpf")
    @classmethod
    def validate_cpf(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        digits = re.sub(r"\D", "", v)
        if len(digits) != 11 or not _cpf_valid(digits):
            raise ValueError("CPF inválido")
        return f"{digits[:3]}.{digits[3:6]}.{digits[6:9]}-{digits[9:]}"

    @field_validator("cnpj")
    @classmethod
    def validate_cnpj(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        digits = re.sub(r"\D", "", v)
        if len(digits) != 14 or not _cnpj_valid(digits):
            raise ValueError("CNPJ inválido")
        return f"{digits[:2]}.{digits[2:5]}.{digits[5:8]}/{digits[8:12]}-{digits[12:]}"

    @model_validator(mode="after")
    def _validate_doc_combination(self) -> "UserRegister":
        if self.doc_type == "pf":
            if not self.cpf:
                raise ValueError("CPF é obrigatório para pessoa física")
            if not self.rg or len(self.rg.strip()) < 4:
                raise ValueError("RG é obrigatório para pessoa física")
        else:
            if not self.cnpj:
                raise ValueError("CNPJ é obrigatório para empresa ou ONG")
        return self


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class OTPLoginResponse(BaseModel):
    otp_required: bool = True
    otp_token: str
    phone_hint: str


class OTPVerify(BaseModel):
    otp_token: str
    code: str = Field(min_length=6, max_length=6)


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    email: EmailStr
    profile_type: str
    role: str
    is_verified: bool
    trust_level: str
    avg_rating: Optional[float] = None
    rating_count: int = 0
    phone: Optional[str] = None
    created_at: datetime


class ProfileUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=120)
    phone: Optional[str] = Field(None, max_length=20)
    current_password: Optional[str] = None
    new_password: Optional[str] = Field(None, min_length=8, max_length=128)

    @field_validator("new_password")
    @classmethod
    def validate_new_password(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        return _validate_password_strength(v)

    @model_validator(mode="after")
    def _password_consistency(self):
        if self.new_password and not self.current_password:
            raise ValueError("Informe a senha atual para definir uma nova")
        return self


class AdminUserUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=120)
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(None, max_length=20)
    cpf: Optional[str] = None
    rg: Optional[str] = None
    cnpj: Optional[str] = None
    is_verified: Optional[bool] = None


class LoginResponse(BaseModel):
    user: UserOut


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class StoryOut(BaseModel):
    id: int
    title: str
    excerpt: str
    author: str
    image_url: str
    category: str


class AdminUserOut(BaseModel):
    """Versão completa do user pra painel admin."""
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    email: EmailStr
    profile_type: str
    role: str
    doc_type: str
    cpf: Optional[str] = None
    rg: Optional[str] = None
    cnpj: Optional[str] = None
    is_approved: bool
    is_active: bool
    is_verified: bool
    trust_level: str
    avg_rating: Optional[float] = None
    rating_count: int = 0
    phone: Optional[str] = None
    selfie_path: Optional[str] = None
    doc_photo_path: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class AdminStatsOut(BaseModel):
    total_users: int
    active_users: int
    suspended_users: int
    pending_approval: int
    new_last_7_days: int
    helpers: int
    requesters: int
    moderators: int
    admins: int


class RoleUpdate(BaseModel):
    role: Literal["user", "moderator", "admin"]


class TrustLevelUpdate(BaseModel):
    trust_level: Literal["novo", "verificado", "confiavel", "parceiro_validado"]


class AuditLogOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    actor_id: int
    actor_email: str
    target_id: int | None
    target_email: str | None
    action: str
    details: str | None
    ip: str | None
    created_at: datetime


class LoginLogOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int | None
    email: str
    success: bool
    ip: str | None
    created_at: datetime
