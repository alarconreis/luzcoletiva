"""
Avaliações bilaterais após pedidos concluídos.

Regras:
- Só disponível quando status = closed
- Requester avalia o helper aceito; helper avalia o requester
- Uma avaliação por pessoa por pedido (unique request_id + rater_id)
"""
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.core.limiter import limiter
from app.models.help import HelpOffer, HelpRequest, HelpRequestStatus
from app.models.rating import Rating
from app.models.user import User
from app.schemas.rating import RatingCreate, RatingOut

router = APIRouter(prefix="/api", tags=["ratings"])


def _get_involved_ids(req: HelpRequest, db: Session) -> tuple[int, int] | None:
    """Retorna (requester_id, helper_id) ou None se não há oferta aceita."""
    if not req.accepted_offer_id:
        return None
    offer = db.query(HelpOffer).filter(HelpOffer.id == req.accepted_offer_id).first()
    if not offer:
        return None
    return req.requester_id, offer.helper_id


def _recalculate_rating(db: Session, ratee_id: int) -> None:
    """Recalcula avg_rating e rating_count direto do banco (preciso)."""
    result = (
        db.query(func.avg(Rating.score), func.count(Rating.id))
        .filter(Rating.ratee_id == ratee_id)
        .first()
    )
    ratee = db.query(User).filter(User.id == ratee_id).first()
    ratee.avg_rating = round(float(result[0]), 2) if result[0] else None
    ratee.rating_count = result[1] or 0


@router.post("/help-requests/{req_id}/rate", response_model=RatingOut, status_code=201)
@limiter.limit("20/hour")
def submit_rating(
    req_id: int,
    payload: RatingCreate,
    request: Request,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    req = db.query(HelpRequest).filter(HelpRequest.id == req_id).first()
    if not req:
        raise HTTPException(404, "Pedido não encontrado")
    if req.status != HelpRequestStatus.closed:
        raise HTTPException(400, "A avaliação só está disponível após o pedido ser concluído")

    ids = _get_involved_ids(req, db)
    if not ids:
        raise HTTPException(400, "Pedido sem helper aceito registrado")
    requester_id, helper_id = ids

    if user.id == requester_id:
        ratee_id = helper_id
    elif user.id == helper_id:
        ratee_id = requester_id
    else:
        raise HTTPException(403, "Apenas os envolvidos podem avaliar")

    existing = db.query(Rating).filter(
        Rating.request_id == req_id, Rating.rater_id == user.id
    ).first()
    if existing:
        raise HTTPException(409, "Você já avaliou este pedido")

    rating = Rating(
        request_id=req_id,
        rater_id=user.id,
        ratee_id=ratee_id,
        score=payload.score,
        comment=payload.comment.strip() if payload.comment else None,
    )
    db.add(rating)
    db.flush()
    _recalculate_rating(db, ratee_id)
    db.commit()
    db.refresh(rating)
    return rating


@router.get("/help-requests/{req_id}/ratings", response_model=list[RatingOut])
@limiter.limit("60/minute")
def list_ratings(
    req_id: int,
    request: Request,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    req = db.query(HelpRequest).filter(HelpRequest.id == req_id).first()
    if not req:
        raise HTTPException(404, "Pedido não encontrado")
    ids = _get_involved_ids(req, db)
    if not ids or user.id not in ids:
        raise HTTPException(403, "Acesso negado")
    return db.query(Rating).filter(Rating.request_id == req_id).all()
