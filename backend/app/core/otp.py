"""
OTP generation, verification (Redis-backed) and delivery via email (Resend).
"""
import logging
import random
import uuid
from datetime import timedelta

import redis as redis_lib

from app.core.config import settings

logger = logging.getLogger(__name__)

_redis = redis_lib.from_url(settings.REDIS_URL, decode_responses=True)
OTP_TTL = 600  # 10 minutes


# ============================================
# OTP rate limiting / cap diário (anti-bombing)
# ============================================

# Limites por janela
OTP_CAP_USER_DAILY = 5      # 5 OTPs em 24h por user_id
OTP_CAP_USER_HOURLY = 3     # 3 OTPs em 1h por user_id
OTP_CAP_IP_HOURLY = 20      # 20 OTPs em 1h por IP


class OtpCapExceeded(Exception):
    """Raised when OTP request exceeds rate cap. Carries retry_after seconds."""
    def __init__(self, retry_after: int, scope: str):
        self.retry_after = retry_after
        self.scope = scope
        super().__init__(f"OTP cap exceeded ({scope}). Retry in {retry_after}s.")


def _incr_counter(key: str, ttl_seconds: int) -> int:
    """Atomic INCR with TTL set on first hit. Returns new count."""
    pipe = _redis.pipeline()
    pipe.incr(key)
    pipe.expire(key, ttl_seconds)
    new_val, _ = pipe.execute()
    return int(new_val)


def check_otp_cap(user_id: int, ip: str | None = None) -> None:
    """
    Verifica se user_id ou ip atingiram cap de OTPs.
    Raise OtpCapExceeded se sim. Caso contrário, incrementa contadores.
    Chame antes de generate_otp().
    """
    # Cap por user — daily
    daily_key = f"otp_cap:user:{user_id}:24h"
    daily_count = _incr_counter(daily_key, 86400)
    if daily_count > OTP_CAP_USER_DAILY:
        ttl = _redis.ttl(daily_key) or 86400
        logger.warning(
            "OTP cap user_daily exceeded: user_id=%s count=%s retry_after=%s",
            user_id, daily_count, ttl,
        )
        raise OtpCapExceeded(retry_after=ttl, scope="user_daily")

    # Cap por user — hourly
    hourly_key = f"otp_cap:user:{user_id}:1h"
    hourly_count = _incr_counter(hourly_key, 3600)
    if hourly_count > OTP_CAP_USER_HOURLY:
        ttl = _redis.ttl(hourly_key) or 3600
        logger.warning(
            "OTP cap user_hourly exceeded: user_id=%s count=%s retry_after=%s",
            user_id, hourly_count, ttl,
        )
        raise OtpCapExceeded(retry_after=ttl, scope="user_hourly")

    # Cap por IP — hourly
    if ip:
        ip_key = f"otp_cap:ip:{ip}:1h"
        ip_count = _incr_counter(ip_key, 3600)
        if ip_count > OTP_CAP_IP_HOURLY:
            ttl = _redis.ttl(ip_key) or 3600
            logger.warning(
                "OTP cap ip_hourly exceeded: ip=%s count=%s user_id=%s retry_after=%s",
                ip, ip_count, user_id, ttl,
            )
            raise OtpCapExceeded(retry_after=ttl, scope="ip_hourly")


def generate_otp(user_id: int) -> tuple[str, str]:
    """Returns (otp_token, code). Stores in Redis with 10-min TTL."""
    code = f"{random.randint(0, 999999):06d}"
    token = str(uuid.uuid4())
    _redis.setex(f"otp:{token}", timedelta(seconds=OTP_TTL), f"{user_id}:{code}")
    return token, code


def verify_otp(otp_token: str, code: str) -> int | None:
    """Returns user_id if valid, None otherwise. Deletes key on success."""
    key = f"otp:{otp_token}"
    value = _redis.get(key)
    if not value:
        return None
    stored_user_id, stored_code = value.split(":", 1)
    if stored_code != code.strip():
        return None
    _redis.delete(key)
    return int(stored_user_id)


def send_otp_email(email: str, code: str) -> None:
    """Sends OTP code via email (Resend). Logs for dev if Resend not configured."""
    from app.core.email import send_email

    if not settings.RESEND_API_KEY:
        logger.info("[DEV OTP] email=%s code=%s", email, code)
        return

    html = (
        f"<p>Seu código de acesso à Luz Coletiva é:</p>"
        f"<p style=\"font-size:28px;font-weight:bold;letter-spacing:4px;\">{code}</p>"
        f"<p>Válido por 10 minutos. Se você não tentou entrar, ignore este e-mail.</p>"
    )
    text = f"Seu código de acesso à Luz Coletiva: {code}. Válido por 10 minutos."

    send_email(
        to=email,
        subject="Seu código de acesso — Luz Coletiva",
        html=html,
        text=text,
        template="otp_login",
    )
