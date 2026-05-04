"""
Tasks Celery para envio de e-mail.
Cada tipo é uma task separada — facilita retry, debug e rate limit.
"""
import logging
from app.core.email import send_email
from app.core import email_templates as T
from app.tasks.celery_app import celery_app

logger = logging.getLogger(__name__)


def _retry_strategy(self, exc):
    countdown = 30 * (2 ** self.request.retries)  # 30s, 60s, 120s
    raise self.retry(exc=exc, countdown=countdown)


@celery_app.task(bind=True, max_retries=3, name="tasks.send_welcome")
def send_welcome(self, to: str, name: str):
    try:
        subject, html, text = T.welcome(name)
        return send_email(to, subject, html, text, template="welcome")
    except Exception as e:
        _retry_strategy(self, e)


@celery_app.task(bind=True, max_retries=3, name="tasks.send_verify_approved")
def send_verify_approved(self, to: str, name: str):
    try:
        subject, html, text = T.verify_approved(name)
        return send_email(to, subject, html, text, template="verify_approved")
    except Exception as e:
        _retry_strategy(self, e)


@celery_app.task(bind=True, max_retries=3, name="tasks.send_verify_rejected")
def send_verify_rejected(self, to: str, name: str, reason: str):
    try:
        subject, html, text = T.verify_rejected(name, reason)
        return send_email(to, subject, html, text, template="verify_rejected")
    except Exception as e:
        _retry_strategy(self, e)


@celery_app.task(bind=True, max_retries=3, name="tasks.send_verify_manual")
def send_verify_manual(self, to: str, name: str):
    try:
        subject, html, text = T.verify_manual(name)
        return send_email(to, subject, html, text, template="verify_manual")
    except Exception as e:
        _retry_strategy(self, e)


@celery_app.task(bind=True, max_retries=3, name="tasks.send_offer_received")
def send_offer_received(self, to: str, requester_name: str, helper_name: str, request_title: str, request_id: int):
    try:
        subject, html, text = T.offer_received(requester_name, helper_name, request_title, request_id)
        return send_email(to, subject, html, text, template="offer_received")
    except Exception as e:
        _retry_strategy(self, e)


@celery_app.task(bind=True, max_retries=3, name="tasks.send_offer_accepted")
def send_offer_accepted(self, to: str, helper_name: str, request_title: str, request_id: int):
    try:
        subject, html, text = T.offer_accepted(helper_name, request_title, request_id)
        return send_email(to, subject, html, text, template="offer_accepted")
    except Exception as e:
        _retry_strategy(self, e)


@celery_app.task(bind=True, max_retries=3, name="tasks.send_offer_declined")
def send_offer_declined(self, to: str, helper_name: str, request_title: str):
    try:
        subject, html, text = T.offer_declined(helper_name, request_title)
        return send_email(to, subject, html, text, template="offer_declined")
    except Exception as e:
        _retry_strategy(self, e)


@celery_app.task(bind=True, max_retries=3, name="tasks.send_chat_pending")
def send_chat_pending(self, to: str, recipient_name: str, request_title: str, request_id: int, count: int):
    try:
        subject, html, text = T.chat_messages_pending(recipient_name, request_title, request_id, count)
        return send_email(to, subject, html, text, template="chat_pending")
    except Exception as e:
        _retry_strategy(self, e)


@celery_app.task(bind=True, max_retries=3, name="tasks.send_admin_report")
def send_admin_report(self, to: str, reporter_email: str, request_id: int, reason: str):
    try:
        subject, html, text = T.admin_report(reporter_email, request_id, reason)
        return send_email(to, subject, html, text, template="admin_report")
    except Exception as e:
        _retry_strategy(self, e)


@celery_app.task(bind=True, max_retries=3, name="tasks.send_admin_verify_pending")
def send_admin_verify_pending(self, to: str, count: int):
    try:
        subject, html, text = T.admin_verify_pending(count)
        return send_email(to, subject, html, text, template="admin_verify_pending")
    except Exception as e:
        _retry_strategy(self, e)


@celery_app.task(bind=True, max_retries=3, name="tasks.send_admin_backup_failed")
def send_admin_backup_failed(self, to: str, error_excerpt: str):
    try:
        subject, html, text = T.admin_backup_failed(error_excerpt)
        return send_email(to, subject, html, text, template="admin_backup_failed")
    except Exception as e:
        _retry_strategy(self, e)


# Mantém compatibilidade com chamada antiga
@celery_app.task(name="tasks.send_confirmation_email")
def send_confirmation_email(to_email: str, name: str):
    """Compatibilidade: redireciona para send_welcome."""
    return send_welcome.delay(to_email, name)
