"""Rotas públicas do blog."""
import hashlib
import hmac
import pathlib

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import FileResponse
from sqlalchemy import update
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.limiter import limiter, real_ip
from app.core.uploads import UPLOAD_DIR
from app.models.blog import BlogPost, BlogPostLike
from app.schemas.blog import BlogPostLikeResponse, BlogPostPublic

router = APIRouter(prefix="/api/blog", tags=["blog"])


def _hash_ip(ip: str) -> str:
    """HMAC-SHA256(ip, JWT_SECRET) — armazenamos só o hash para LGPD."""
    return hmac.new(
        settings.JWT_SECRET.encode("utf-8"),
        ip.encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()


@router.get("/posts", response_model=list[BlogPostPublic])
@limiter.limit("60/minute")
def list_posts(request: Request, db: Session = Depends(get_db)):
    """Lista posts publicados, ordenados pelo mais recente."""
    posts = (
        db.query(BlogPost)
        .filter(BlogPost.published == True)
        .order_by(BlogPost.published_at.desc())
        .limit(50)
        .all()
    )
    return posts


@router.get("/posts/{slug}", response_model=BlogPostPublic)
@limiter.limit("60/minute")
def get_post(slug: str, request: Request, db: Session = Depends(get_db)):
    """Retorna detalhe de um post publicado."""
    post = db.query(BlogPost).filter(
        BlogPost.slug == slug,
        BlogPost.published == True,
    ).first()
    if not post:
        raise HTTPException(404, "Post não encontrado")
    return post


@router.post("/posts/{slug}/like", response_model=BlogPostLikeResponse)
@limiter.limit("10/minute")
def like_post(slug: str, request: Request, db: Session = Depends(get_db)):
    """Curte um post (público, sem autenticação).
    Dedup por IP hasheado: o mesmo IP só conta uma vez por post.
    Idempotente — chamadas repetidas retornam a contagem atual com
    `liked=False`."""
    post = db.query(BlogPost).filter(
        BlogPost.slug == slug,
        BlogPost.published == True,
    ).first()
    if not post:
        raise HTTPException(404, "Post não encontrado")

    ip_hash = _hash_ip(real_ip(request))

    # INSERT ... ON CONFLICT DO NOTHING — retorna a row inserida ou None.
    stmt = (
        pg_insert(BlogPostLike)
        .values(post_id=post.id, ip_hash=ip_hash)
        .on_conflict_do_nothing(index_elements=["post_id", "ip_hash"])
        .returning(BlogPostLike.id)
    )
    inserted_id = db.execute(stmt).scalar()

    if inserted_id is None:
        # Esse IP já curtiu — retorna a contagem atual sem incrementar.
        db.rollback()
        return BlogPostLikeResponse(likes_count=post.likes_count, liked=False)

    # Incremento atômico para evitar perda em corrida.
    db.execute(
        update(BlogPost)
        .where(BlogPost.id == post.id)
        .values(likes_count=BlogPost.likes_count + 1)
    )
    db.commit()
    db.refresh(post)
    return BlogPostLikeResponse(likes_count=post.likes_count, liked=True)


@router.get("/images/{filename}")
@limiter.limit("120/minute")
def get_image(filename: str, request: Request, db: Session = Depends(get_db)):
    """Serve imagem de post de blog. Só libera arquivos referenciados por
    algum BlogPost com image_is_external=False, evitando expor outros uploads
    privados (selfies de verificação, documentos, etc.) que vivem no mesmo volume."""
    # Defesa contra path traversal: a filename salva por save_upload é um UUID
    # com extensão; rejeita qualquer coisa com separadores ou navegação.
    if pathlib.PurePosixPath(filename).name != filename or "/" in filename or "\\" in filename:
        raise HTTPException(404, "Imagem não encontrada")

    exists = db.query(BlogPost.id).filter(
        BlogPost.image_url == filename,
        BlogPost.image_is_external == False,
    ).first()
    if not exists:
        raise HTTPException(404, "Imagem não encontrada")

    path = UPLOAD_DIR / filename
    if not path.is_file():
        raise HTTPException(404, "Imagem não encontrada")
    return FileResponse(path)
