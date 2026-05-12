"""
Instância do Celery para processamento assíncrono.
"""
from celery import Celery
from celery.schedules import crontab

from app.core.config import settings

celery_app = Celery(
    "luzcoletiva",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
    include=["app.tasks.email_tasks", "app.tasks.verification_tasks"],
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="America/Sao_Paulo",
    enable_utc=True,
    task_track_started=True,
    task_time_limit=60,  # segurança: não deixar tasks penduradas
)


# Tarefas agendadas
celery_app.conf.beat_schedule = {
    'auto-confirm-deliveries-daily': {
        'task': 'tasks.auto_confirm_deliveries',
        'schedule': crontab(hour=3, minute=0),  # 03:00 UTC diariamente
    },
    "purge-expired-verifications-daily": {
        "task": "tasks.purge_expired_verifications",
        "schedule": 86400.0,  # 24h
    },
    "notify-admin-verify-pending-daily": {
        "task": "tasks.notify_admin_verify_pending",
        "schedule": crontab(hour=12, minute=0),  # 09:00 BRT = 12:00 UTC
    },
}
