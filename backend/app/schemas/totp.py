from pydantic import BaseModel, Field


class TotpSetupOut(BaseModel):
    """Resposta do setup — QR code + secret pra digitar manualmente."""
    qr_code_base64: str
    secret: str  # base32, pra digitar se QR não funcionar
    issuer: str = "Luz Coletiva"


class TotpConfirmIn(BaseModel):
    code: str = Field(..., min_length=6, max_length=6, pattern=r"^\d{6}$")


class TotpConfirmOut(BaseModel):
    enabled: bool
    backup_codes: list[str]
    message: str


class TotpDisableIn(BaseModel):
    password: str = Field(..., min_length=1)
    code: str = Field(..., min_length=6, max_length=6, pattern=r"^\d{6}$")


class TotpVerifyIn(BaseModel):
    challenge_token: str = Field(..., min_length=8)
    code: str = Field(..., min_length=6)  # TOTP 6 dígitos OU backup XXXX-XXXX (9 chars)
    is_backup: bool = False


class TotpVerifyOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
