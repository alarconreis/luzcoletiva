"""
Pipeline de verificação de identidade usando Claude Vision.

Três chamadas separadas para isolar responsabilidades:
  1. analyze_document(rg)   → é RG/CNH? extrai nome+nascimento
  2. analyze_liveness(selfie) → pessoa viva, não foto de foto?
  3. analyze_face_match(rg, selfie) → mesma pessoa?

Cada chamada retorna {score: 0..1, ...}, com fallback robusto
quando o modelo retornar JSON inválido.
"""
import json
import logging
import re
import unicodedata
from io import BytesIO
from typing import Any

from PIL import Image

from app.core.config import settings

logger = logging.getLogger(__name__)

# Limite de tamanho pra não estourar tokens
_MAX_DIM = 1568   # recomendado pela Anthropic
_JPEG_QUALITY = 80


def _resize_for_vision(img_bytes: bytes) -> bytes:
    """Reduz e recompacta JPEG pra controlar custo/latência."""
    img = Image.open(BytesIO(img_bytes))
    img = img.convert("RGB")
    img.thumbnail((_MAX_DIM, _MAX_DIM), Image.Resampling.LANCZOS)
    buf = BytesIO()
    img.save(buf, format="JPEG", quality=_JPEG_QUALITY, optimize=True)
    return buf.getvalue()


def _extract_json(text: str) -> dict[str, Any]:
    """
    Modelo às vezes embrulha JSON em texto — extraímos com regex
    e damos fallback seguro pra dict vazio se falhar.
    """
    # Tenta cru
    try:
        return json.loads(text.strip())
    except json.JSONDecodeError:
        pass
    # Tenta achar primeiro bloco { ... }
    m = re.search(r"\{[\s\S]*\}", text)
    if m:
        try:
            return json.loads(m.group(0))
        except json.JSONDecodeError:
            pass
    logger.warning("Falha ao extrair JSON da resposta do Vision: %r", text[:200])
    return {}


def _client():
    # Importa só quando precisa (evita custo no startup)
    from anthropic import Anthropic
    if not settings.ANTHROPIC_API_KEY:
        raise RuntimeError("ANTHROPIC_API_KEY não configurada")
    return Anthropic(api_key=settings.ANTHROPIC_API_KEY)


def _ask_vision(prompt: str, images: list[bytes]) -> dict[str, Any]:
    client = _client()
    content: list[dict[str, Any]] = []
    for img in images:
        b64 = __import__("base64").standard_b64encode(_resize_for_vision(img)).decode("ascii")
        content.append({
            "type": "image",
            "source": {"type": "base64", "media_type": "image/jpeg", "data": b64},
        })
    content.append({"type": "text", "text": prompt})

    resp = client.messages.create(
        model=settings.ANTHROPIC_MODEL,
        max_tokens=600,
        messages=[{"role": "user", "content": content}],
    )
    text = "".join(b.text for b in resp.content if hasattr(b, "text"))
    return _extract_json(text)


# ============= Prompts =============

_DOC_PROMPT = """Analise esta imagem que deveria ser de um documento de identidade brasileiro \
(RG ou CNH). Avalie objetivamente.

Responda APENAS com JSON, sem texto fora. Schema:
{
  "is_document": <bool, true se é claramente um RG ou CNH brasileiro>,
  "doc_type": <"rg" | "cnh" | "outro" | "nao_documento">,
  "confidence": <float 0..1>,
  "extracted_name": <string ou null, nome COMPLETO conforme aparece no documento>,
  "extracted_birthdate": <string DD/MM/AAAA ou null>,
  "quality_issues": <array de strings: "blurry", "cropped", "glare", "low_resolution", "edited", "screen_photo">,
  "tampering_signs": <array de strings vazia ou indícios de adulteração>,
  "notes": <string curta com observação relevante>
}

Seja rigoroso: se a imagem é qualquer coisa que NÃO seja um documento brasileiro de identidade \
(paisagem, animal, foto pessoal, captura de tela genérica), is_document=false e confidence baixa."""


_LIVENESS_PROMPT = """Analise esta selfie verificando sinais de pessoa real (liveness).

Responda APENAS com JSON, sem texto fora. Schema:
{
  "is_live_person": <bool>,
  "confidence": <float 0..1>,
  "is_screen_photo": <bool, true se parece foto de tela/monitor>,
  "is_photo_of_photo": <bool, true se parece foto de foto impressa>,
  "face_visible": <bool, true se rosto está claramente visível e centralizado>,
  "face_count": <int, quantos rostos detectou>,
  "quality_issues": <array: "blurry", "dark", "overexposed", "occluded", "side_profile">,
  "notes": <string curta>
}

Sinais de NÃO-liveness: padrões de moiré (faixas em telas), reflexos retangulares, bordas de tela visíveis, \
dois rostos (RG aparecendo na selfie), foto claramente impressa. Seja rigoroso."""


_FACE_MATCH_PROMPT = """Compare as duas imagens fornecidas.
- Imagem 1: foto do rosto extraída de um documento de identidade (RG/CNH)
- Imagem 2: selfie atual

Avalie se mostram a MESMA pessoa, mesmo considerando diferença de idade, iluminação, ângulo, \
óculos, pelo facial.

Responda APENAS com JSON, sem texto fora. Schema:
{
  "same_person": <bool>,
  "confidence": <float 0..1>,
  "match_score": <float 0..1, sua estimativa de similaridade>,
  "key_features_matching": <array de strings: "facial_structure", "eyes", "nose", "mouth", "ears">,
  "key_differences": <array de strings com diferenças notáveis>,
  "notes": <string curta>
}

Se uma das imagens não tem rosto reconhecível, same_person=false e confidence alta."""


# ============= API pública =============

def analyze_document(rg_bytes: bytes) -> dict[str, Any]:
    return _ask_vision(_DOC_PROMPT, [rg_bytes])


def analyze_liveness(selfie_bytes: bytes) -> dict[str, Any]:
    return _ask_vision(_LIVENESS_PROMPT, [selfie_bytes])


def analyze_face_match(rg_bytes: bytes, selfie_bytes: bytes) -> dict[str, Any]:
    return _ask_vision(_FACE_MATCH_PROMPT, [rg_bytes, selfie_bytes])


# ============= Cruzamento de nome =============

def _normalize_name(s: str) -> str:
    s = unicodedata.normalize("NFD", s)
    s = "".join(c for c in s if not unicodedata.combining(c))
    s = re.sub(r"[^a-zA-Z\s]", "", s).lower().strip()
    return re.sub(r"\s+", " ", s)


def name_similarity(extracted: str | None, registered: str) -> float:
    """
    Score 0..1 — combinação de:
    - sobrenome bate?
    - primeiro nome bate?
    - quantas palavras em comum
    Não usamos Levenshtein pra evitar dependência extra; comparação por tokens.
    """
    if not extracted or not registered:
        return 0.0
    a = set(_normalize_name(extracted).split())
    b = set(_normalize_name(registered).split())
    if not a or not b:
        return 0.0
    intersection = a & b
    if not intersection:
        return 0.0
    # Bate primeiro nome E pelo menos um sobrenome → score alto
    return len(intersection) / max(len(a), len(b))
