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
    Pega o IP real do cliente quando há proxy reverso (Caddy) na frente.
    Caddy envia X-Forwarded-For automaticamente.
    Cai no remote_address se o header não existir.
    """
    xff = request.headers.get("x-forwarded-for")
    if xff:
        # X-Forwarded-For pode ter múltiplos IPs: client, proxy1, proxy2...
        # O primeiro é o cliente original.
        return xff.split(",")[0].strip()
    return get_remote_address(request)


limiter = Limiter(
    key_func=_real_ip,
    storage_uri=settings.REDIS_URL,
    default_limits=["100/minute"],   # rede de segurança global
    headers_enabled=False,           # injeção de headers requer response: Response na assinatura
)
