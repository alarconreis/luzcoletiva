"""
Luz Coletiva — API principal (FastAPI).
"""
import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.core.limiter import limiter
from app.core.config import settings
from app.core.database import Base, engine
from app.core.migrations import run_migrations
from app.routes import admin, auth, help as help_routes, profile, stories, verify as verify_routes, rating as rating_routes

logging.basicConfig(level=logging.INFO if not settings.DEBUG else logging.DEBUG)
logger = logging.getLogger(__name__)

# Criação automática das tabelas no MVP. Em produção, usar Alembic.
Base.metadata.create_all(bind=engine)
run_migrations()

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
)


# Rate limiting (slowapi + Redis)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE"],
    allow_headers=["Content-Type", "Accept"],
)

app.include_router(auth.router)
app.include_router(profile.router)
app.include_router(stories.router)
app.include_router(admin.router)
app.include_router(help_routes.router)
app.include_router(verify_routes.router)
app.include_router(rating_routes.router)


@app.get("/", tags=["health"])
def root():
    return {
        "name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "slogan": "Iluminando vidas juntos.",
    }


@app.get("/health", tags=["health"])
def health():
    return {"status": "ok"}
