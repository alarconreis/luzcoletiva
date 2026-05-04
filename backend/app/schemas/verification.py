"""
Schemas Pydantic para verificação de identidade.
"""
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class VerificationStatusOut(BaseModel):
    """Resumo da verificação atual do usuário (sem expor scores brutos)."""
    is_verified: bool
    status: Optional[str] = None
    rejection_reason: Optional[str] = None
    can_retry: bool
    attempts_last_24h: int
    selfie_keep_as_avatar: bool = False


class VerificationAttemptOut(BaseModel):
    """Versão simplificada para o usuário."""
    model_config = ConfigDict(from_attributes=True)
    id: int
    status: str
    final_decision: Optional[str]
    rejection_reason: Optional[str]
    created_at: datetime
    processed_at: Optional[datetime]


class AdminVerificationOut(BaseModel):
    """Versão completa para admin/moderator."""
    model_config = ConfigDict(from_attributes=True)
    id: int
    user_id: int
    status: str
    score_document: Optional[float]
    score_liveness: Optional[float]
    score_face_match: Optional[float]
    extracted_name: Optional[str]
    extracted_birthdate: Optional[str]
    name_match_score: Optional[float]
    final_decision: Optional[str]
    rejection_reason: Optional[str]
    images_purged: bool
    ip: Optional[str]
    created_at: datetime
    processed_at: Optional[datetime]
