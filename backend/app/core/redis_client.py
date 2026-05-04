import redis

from app.core.config import settings

_client: redis.Redis | None = None


def _get() -> redis.Redis:
    global _client
    if _client is None:
        _client = redis.from_url(settings.REDIS_URL, decode_responses=True)
    return _client


def add_to_blocklist(jti: str, ttl_seconds: int) -> None:
    try:
        _get().setex(f"bl:{jti}", ttl_seconds, "1")
    except Exception:
        pass  # fail open: não impede logout se Redis estiver fora


def is_blocklisted(jti: str) -> bool:
    try:
        return bool(_get().exists(f"bl:{jti}"))
    except Exception:
        return True  # fail-closed: rejeita token se Redis indisponível — exige novo login
