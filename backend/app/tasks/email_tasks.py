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


@celery_app.task(bind=True, max_retries=3, name="tasks.send_password_reset")
def send_password_reset(self, to: str, name: str, reset_url: str):
    try:
        subject, html, text = T.password_reset(name, reset_url)
        return send_email(to, subject, html, text, template="password_reset")
    except Exception as e:
        _retry_strategy(self, e)


# Mantém compatibilidade com chamada antiga
@celery_app.task(name="tasks.send_confirmation_email")
def send_confirmation_email(to_email: str, name: str):
    """Compatibilidade: redireciona para send_welcome."""
    return send_welcome.delay(to_email, name)


# ============================================
# Tarefas de logística (Fase 2)
# ============================================

@celery_app.task(bind=True, max_retries=3, name="tasks.send_shipping_method_chosen")
def send_shipping_method_chosen(self, to: str, requester_name: str, method: str, request_title: str, request_id: int):
    """Helper escolheu método. Notifica solicitante."""
    try:
        subject, html, text = T.shipping_method_chosen(requester_name, method, request_title, request_id)
        return send_email(to, subject, html, text, template="shipping_method_chosen")
    except Exception as e:
        _retry_strategy(self, e)


@celery_app.task(bind=True, max_retries=3, name="tasks.send_shipping_address_provided")
def send_shipping_address_provided(self, to: str, helper_name: str, method: str, request_title: str, request_id: int):
    """Solicitante preencheu endereço/ponto. Notifica helper."""
    try:
        subject, html, text = T.shipping_address_provided(helper_name, method, request_title, request_id)
        return send_email(to, subject, html, text, template="shipping_address_provided")
    except Exception as e:
        _retry_strategy(self, e)


@celery_app.task(bind=True, max_retries=3, name="tasks.send_package_shipped")
def send_package_shipped(self, to: str, requester_name: str, tracking_code: str, request_title: str, request_id: int):
    """Helper anexou tracking. Notifica solicitante."""
    try:
        subject, html, text = T.package_shipped(requester_name, tracking_code, request_title, request_id)
        return send_email(to, subject, html, text, template="package_shipped")
    except Exception as e:
        _retry_strategy(self, e)


@celery_app.task(bind=True, max_retries=3, name="tasks.send_delivery_confirmed")
def send_delivery_confirmed(self, to: str, helper_name: str, request_title: str, request_id: int):
    """Solicitante confirmou recebimento. Notifica helper."""
    try:
        subject, html, text = T.delivery_confirmed(helper_name, request_title, request_id)
        return send_email(to, subject, html, text, template="delivery_confirmed")
    except Exception as e:
        _retry_strategy(self, e)


@celery_app.task(bind=True, max_retries=3, name="tasks.send_delivery_auto_confirmed")
def send_delivery_auto_confirmed(self, to: str, name: str, request_title: str, request_id: int):
    """Auto-confirm após 7 dias. Notifica usuário (chamado 2x: 1 pra requester, 1 pra helper)."""
    try:
        subject, html, text = T.delivery_auto_confirmed(name, request_title, request_id)
        return send_email(to, subject, html, text, template="delivery_auto_confirmed")
    except Exception as e:
        _retry_strategy(self, e)


# ============================================
# Beat task: auto-confirm pedidos em in_transit há +7 dias
# ============================================

@celery_app.task(name="tasks.auto_confirm_deliveries")
def auto_confirm_deliveries():
    """Roda diariamente. Marca delivered em pedidos in_transit há mais de 7 dias."""
    from datetime import datetime, timedelta, timezone
    from app.core.database import SessionLocal
    from app.models.help import HelpRequest, HelpRequestStatus, HelpOffer
    from app.models.user import User

    db = SessionLocal()
    try:
        cutoff = datetime.now(timezone.utc) - timedelta(days=7)
        stale = db.query(HelpRequest).filter(
            HelpRequest.status == HelpRequestStatus.in_transit,
            HelpRequest.shipped_at < cutoff,
        ).all()

        count = 0
        for req in stale:
            req.delivered_at = datetime.now(timezone.utc)
            req.status = HelpRequestStatus.delivered
            db.commit()

            # Notifica ambos
            requester = db.query(User).filter(User.id == req.requester_id).first()
            if requester:
                send_delivery_auto_confirmed.delay(
                    requester.email, requester.name, req.title, req.id
                )

            if req.accepted_offer_id:
                offer = db.query(HelpOffer).filter(HelpOffer.id == req.accepted_offer_id).first()
                if offer:
                    helper = db.query(User).filter(User.id == offer.helper_id).first()
                    if helper:
                        send_delivery_auto_confirmed.delay(
                            helper.email, helper.name, req.title, req.id
                        )

            count += 1
            logger.info(f"Auto-confirmed delivery for req_id={req.id}")

        logger.info(f"auto_confirm_deliveries: {count} pedidos auto-confirmados")
        return {"auto_confirmed": count}
    except Exception as e:
        logger.error(f"auto_confirm_deliveries falhou: {e}")
        raise
    finally:
        db.close()


@celery_app.task(name="tasks.notify_admin_verify_pending")
def notify_admin_verify_pending():
    """
    Beat diário: conta verificações pendentes e notifica admin via e-mail.
    Não envia e-mail se zero pendências (silêncio = tudo ok).
    """
    from app.core.database import SessionLocal
    from app.models.verification import VerificationAttempt, VerificationStatus
    from app.models.user import User, UserRole
    from app.core.config import settings

    db = SessionLocal()
    try:
        pending_count = (
            db.query(VerificationAttempt)
            .filter(VerificationAttempt.status == VerificationStatus.pending)
            .count()
        )
        manual_count = (
            db.query(VerificationAttempt)
            .filter(VerificationAttempt.status == VerificationStatus.manual)
            .count()
        )
        total = pending_count + manual_count

        if total == 0:
            logger.info("notify_admin_verify_pending: zero pendências — não enviando e-mail")
            return {"sent": False, "pending": 0, "manual": 0}

        # Busca admins
        admins = db.query(User).filter(User.role == UserRole.admin).all()
        if not admins:
            logger.warning("notify_admin_verify_pending: nenhum admin configurado")
            return {"sent": False, "reason": "no admins"}

        sent_count = 0
        for admin in admins:
            try:
                send_admin_verify_pending.delay(admin.email, total)
                sent_count += 1
            except Exception as e:
                logger.error(f"notify_admin_verify_pending: falha pra {admin.email}: {e}")

        logger.info(f"notify_admin_verify_pending: {sent_count} admins notificados, {total} verificações pendentes")
        return {"sent": True, "admins_notified": sent_count, "pending": pending_count, "manual": manual_count}
    except Exception as e:
        logger.error(f"notify_admin_verify_pending falhou: {e}")
        raise
    finally:
        db.close()
