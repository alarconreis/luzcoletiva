"""
Cliente de e-mail via Resend.
Função pública: send_email() — chamada pelas tasks Celery.
"""
import logging
from typing import Optional

import resend

from app.core.config import settings
from app.core.database import SessionLocal
from app.models.email_log import EmailLog

logger = logging.getLogger(__name__)


def send_email(
    to: str,
    subject: str,
    html: str,
    text: Optional[str] = None,
    template: str = "generic",
) -> dict:
    """
    Envia um e-mail via Resend e registra no EmailLog.
    Levanta exceção se falhar — caller (Celery task) cuida do retry.
    """
    if not settings.RESEND_API_KEY:
        logger.warning("RESEND_API_KEY não configurada — e-mail não enviado para %s", to)
        return {"status": "skipped"}

    if not to:
        logger.warning("E-mail sem destinatário — pulando")
        return {"status": "skipped"}

    resend.api_key = settings.RESEND_API_KEY

    payload: dict = {
        "from": settings.EMAIL_FROM,
        "to": to,
        "subject": subject,
        "html": html,
    }
    if text:
        payload["text"] = text
    if settings.EMAIL_REPLY_TO:
        payload["reply_to"] = settings.EMAIL_REPLY_TO

    db = SessionLocal()
    log = EmailLog(to_email=to, subject=subject, template=template)
    try:
        result = resend.Emails.send(payload)
        log.success = True
        log.provider_id = result.get("id") if isinstance(result, dict) else None
        db.add(log)
        db.commit()
        return {"status": "sent", "id": log.provider_id}
    except Exception as e:
        log.success = False
        log.error = str(e)[:1000]
        db.add(log)
        db.commit()
        logger.exception("Falha ao enviar e-mail para %s", to)
        raise
    finally:
        db.close()
