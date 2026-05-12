"""Rotas públicas do blog."""
import pathlib

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.limiter import limiter
from app.core.uploads import UPLOAD_DIR
from app.models.blog import BlogPost
from app.schemas.blog import BlogPostPublic

router = APIRouter(prefix="/api/blog", tags=["blog"])


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
