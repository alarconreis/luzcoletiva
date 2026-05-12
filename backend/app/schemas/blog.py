from datetime import datetime
from typing import Optional, Literal
from pydantic import BaseModel, ConfigDict, field_validator
import re


def _slugify(text: str) -> str:
    """Converte string em slug URL-friendly."""
    import unicodedata
    s = unicodedata.normalize("NFD", text)
    s = "".join(c for c in s if not unicodedata.combining(c))
    s = re.sub(r"[^a-zA-Z0-9\s-]", "", s).lower().strip()
    s = re.sub(r"\s+", "-", s)
    s = re.sub(r"-+", "-", s)
    return s[:100]


class BlogPostCreate(BaseModel):
    kind: Literal["external", "internal"]
    title: str
    summary: str
    image_url: Optional[str] = None
    image_is_external: bool = False
    body_md: Optional[str] = None
    source_url: Optional[str] = None
    source_name: Optional[str] = None
    published: bool = False

    @field_validator("title")
    @classmethod
    def title_min(cls, v):
        if len(v.strip()) < 5:
            raise ValueError("Título precisa ter ao menos 5 caracteres")
        if len(v) > 200:
            raise ValueError("Título no máximo 200 caracteres")
        return v.strip()

    @field_validator("summary")
    @classmethod
    def summary_min(cls, v):
        if len(v.strip()) < 10:
            raise ValueError("Resumo precisa ter ao menos 10 caracteres")
        if len(v) > 300:
            raise ValueError("Resumo no máximo 300 caracteres")
        return v.strip()


class BlogPostUpdate(BaseModel):
    kind: Optional[Literal["external", "internal"]] = None
    title: Optional[str] = None
    summary: Optional[str] = None
    image_url: Optional[str] = None
    image_is_external: Optional[bool] = None
    body_md: Optional[str] = None
    source_url: Optional[str] = None
    source_name: Optional[str] = None
    published: Optional[bool] = None


class BlogPostOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    slug: str
    kind: str
    title: str
    summary: str
    image_url: Optional[str]
    image_is_external: bool
    body_md: Optional[str]
    source_url: Optional[str]
    source_name: Optional[str]
    published: bool
    published_at: Optional[datetime]
    created_at: datetime


class BlogPostPublic(BaseModel):
    """Versão pública (sem campos de gestão)."""
    model_config = ConfigDict(from_attributes=True)

    slug: str
    kind: str
    title: str
    summary: str
    image_url: Optional[str]
    image_is_external: bool
    body_md: Optional[str]
    source_url: Optional[str]
    source_name: Optional[str]
    published_at: Optional[datetime]
