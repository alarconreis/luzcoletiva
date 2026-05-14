"""
Rate limiter centralizado — slowapi com Redis como storage.

Uso típico nas rotas:

    from app.core.limiter import limiter
    @router.post("/login")
    @limiter.limit("5/5minutes")
    def login(request: Request, ...):
        ...

A injeção de `request: Request` é OBRIGATÓRIA — slowapi extrai
o IP do cliente a partir dela.
"""
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.core.config import settings


def _real_ip(request) -> str:
    """
    Pega o IP real do cliente atrás de Cloudflare + Caddy.
    Ordem de confiança:
      1. CF-Connecting-IP (Cloudflare — não forjável por cliente HTTP comum)
      2. X-Forwarded-For (primeiro IP)
      3. remote_address
    Atrás de Cloudflare, X-Forwarded-For pode ser manipulado;
    CF-Connecting-IP é o único confiável.
    """
    cf_ip = request.headers.get("cf-connecting-ip")
    if cf_ip:
        return cf_ip.strip()
    xff = request.headers.get("x-forwarded-for")
    if xff:
        return xff.split(",")[0].strip()
    return get_remote_address(request)


def real_ip(request) -> str:
    """Wrapper público para `_real_ip` — uso em rotas que precisam
    derivar identidade do cliente (ex.: dedup de curtidas por IP)."""
    return _real_ip(request)


limiter = Limiter(
    key_func=_real_ip,
    storage_uri=settings.REDIS_URL,
    default_limits=["100/minute"],   # rede de segurança global
    headers_enabled=False,           # injeção de headers requer response: Response na assinatura
)
