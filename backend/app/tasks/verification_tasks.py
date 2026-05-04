"""
Descarte de imagens cifradas após o período de retenção.
Roda diariamente — leve, varre por timestamp.
"""
import logging
from datetime import datetime, timedelta, timezone

from app.core.config import settings
from app.core.database import SessionLocal
from app.core.storage import delete_attempt
from app.models.verification import VerificationAttempt, VerificationStatus
from app.tasks.celery_app import celery_app

logger = logging.getLogger(__name__)


@celery_app.task(name="tasks.purge_expired_verifications")
def purge_expired_verifications() -> dict:
    cutoff = datetime.now(timezone.utc) - timedelta(days=settings.VERIFY_RETENTION_DAYS)
    db = SessionLocal()
    purged = 0
    try:
        rows = (
            db.query(VerificationAttempt)
            .filter(
                VerificationAttempt.images_purged.is_(False),
                VerificationAttempt.created_at < cutoff,
            )
            .all()
        )
        for v in rows:
            try:
                delete_attempt(v.user_id, v.id)
                v.images_purged = True
                v.purged_at = datetime.now(timezone.utc)
                if v.status not in (VerificationStatus.approved, VerificationStatus.rejected):
                    v.status = VerificationStatus.expired
                purged += 1
            except Exception as e:
                logger.warning("Falha ao purgar attempt %d: %s", v.id, e)
        db.commit()
        logger.info("purge_expired_verifications: %d itens descartados", purged)
        return {"purged": purged}
    finally:
        db.close()
