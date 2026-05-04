"""
OTP generation, verification (Redis-backed) and SMS delivery (ClickSend).
"""
import logging
import random
import uuid
from datetime import timedelta

import redis as redis_lib
import requests

from app.core.config import settings

logger = logging.getLogger(__name__)

_redis = redis_lib.from_url(settings.REDIS_URL, decode_responses=True)
OTP_TTL = 600  # 10 minutes

_CLICKSEND_URL = "https://rest.clicksend.com/v3/sms/send"


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


def send_otp_sms(phone: str, code: str) -> None:
    """Sends via ClickSend if configured, otherwise logs for dev."""
    if not (settings.CLICKSEND_USERNAME and settings.CLICKSEND_API_KEY):
        logger.info("[DEV OTP] phone=%s code=%s", phone, code)
        return

    resp = requests.post(
        _CLICKSEND_URL,
        auth=(settings.CLICKSEND_USERNAME, settings.CLICKSEND_API_KEY),
        json={
            "messages": [
                {
                    "to": phone,
                    "body": f"Seu código Luz Coletiva: {code}. Válido por 10 minutos.",
                    "source": "LuzColetiva",
                }
            ]
        },
        timeout=10,
    )
    resp.raise_for_status()
    data = resp.json()
    if data.get("response_code") != "SUCCESS":
        raise RuntimeError(f"ClickSend error: {data.get('response_code')}")
