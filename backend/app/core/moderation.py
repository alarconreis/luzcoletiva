"""
Moderação automática de mensagens de chat.
Bloqueia compartilhamento de contato direto e ofensas óbvias.
"""
import re
from typing import Optional

# Padrões que disparam bloqueio (ordem importa: mais específico primeiro)
_PATTERNS = [
    # E-mails
    (re.compile(r"\b[\w.+-]+@[\w-]+\.[\w.-]+\b"), "compartilhamento de e-mail"),
    # URLs (http, https, www)
    (re.compile(r"(https?://\S+|www\.\S+)", re.IGNORECASE), "compartilhamento de link"),
    # Telefones BR — formatos variados
    (re.compile(r"(?:\(?\d{2}\)?\s?)?(?:9?\d{4})[\s.-]?\d{4}\b"), "compartilhamento de telefone"),
    # Sequências longas de dígitos (8+) — pega CPF, RG, conta bancária
    (re.compile(r"\b\d{8,}\b"), "sequência longa de dígitos"),
]

# Lista mínima de palavrões / ofensas — ampliar conforme necessário
# Usar word boundaries pra evitar falsos positivos (ex: "cuidado" não bate em "cu")
_OFFENSIVE_WORDS = {
    "porra", "caralho", "merda", "buceta", "viado", "puta",
    "vagabundo", "vagabunda", "otario", "otaria", "babaca",
    "imbecil", "idiota", "retardado", "bicha",
}
_OFFENSIVE_RE = re.compile(
    r"\b(" + "|".join(_OFFENSIVE_WORDS) + r")\b",
    re.IGNORECASE,
)

MAX_LENGTH = 500


def check_message(content: str) -> Optional[str]:
    """
    Retorna None se mensagem está OK, ou string com motivo da rejeição.
    """
    if not content or not content.strip():
        return "mensagem vazia"

    if len(content) > MAX_LENGTH:
        return f"mensagem muito longa (máximo {MAX_LENGTH} caracteres)"

    for regex, label in _PATTERNS:
        if regex.search(content):
            return f"não é permitido compartilhar {label} no chat"

    if _OFFENSIVE_RE.search(content):
        return "linguagem ofensiva detectada"

    return None
