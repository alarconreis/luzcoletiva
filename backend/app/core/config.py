"""
Configurações centrais da aplicação Luz Coletiva.
Carrega variáveis de ambiente com defaults seguros para desenvolvimento.
"""
import os
from functools import lru_cache
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Aplicação
    APP_NAME: str = "Luz Coletiva API"
    APP_VERSION: str = "0.1.0"
    DEBUG: bool = os.getenv("DEBUG", "false").lower() == "true"

    # Banco de dados
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "postgresql+psycopg2://luzcoletiva:luzcoletiva@db:5432/luzcoletiva",
    )

    # JWT
    JWT_SECRET: str = os.getenv("JWT_SECRET", "troque-este-segredo-em-producao")
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRES_MIN: int = int(os.getenv("JWT_EXPIRES_MIN", "60"))

    # Redis / Celery
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://redis:6379/0")
    CELERY_BROKER_URL: str = os.getenv("CELERY_BROKER_URL", "redis://redis:6379/0")
    CELERY_RESULT_BACKEND: str = os.getenv(
        "CELERY_RESULT_BACKEND", "redis://redis:6379/1"
    )

    # SMTP (mock por padrão — para produção usar provedor real)
    SMTP_HOST: str = os.getenv("SMTP_HOST", "localhost")
    SMTP_PORT: int = int(os.getenv("SMTP_PORT", "1025"))
    SMTP_USER: str = os.getenv("SMTP_USER", "")
    SMTP_PASSWORD: str = os.getenv("SMTP_PASSWORD", "")
    SMTP_FROM: str = os.getenv("SMTP_FROM", "no-reply@luzcoletiva.com.br")
    ALERT_EMAIL: str = os.getenv("ALERT_EMAIL", "contato@luzcoletiva.com.br")

    # ClickSend (SMS OTP)
    CLICKSEND_USERNAME: str = os.getenv("CLICKSEND_USERNAME", "")
    CLICKSEND_API_KEY: str = os.getenv("CLICKSEND_API_KEY", "")

    # CORS
    CORS_ORIGINS: str = os.getenv(
        "CORS_ORIGINS", "http://localhost:5173,http://localhost:3000"
    )

    @property
    def cors_origins_list(self) -> list[str]:
        origins = [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]
        if not self.DEBUG:
            origins = [o for o in origins if o.startswith("https://")]
        return origins


    # Verificação de identidade
    ANTHROPIC_API_KEY: str = os.getenv("ANTHROPIC_API_KEY", "")
    ANTHROPIC_MODEL: str = os.getenv("ANTHROPIC_MODEL", "claude-sonnet-4-6")
    VERIFY_ENCRYPTION_KEY: str = os.getenv("VERIFY_ENCRYPTION_KEY", "")
    VERIFY_STORAGE_PATH: str = os.getenv("VERIFY_STORAGE_PATH", "/data/verifications")
    VERIFY_RETENTION_DAYS: int = int(os.getenv("VERIFY_RETENTION_DAYS", "30"))
    VERIFY_MAX_ATTEMPTS_24H: int = int(os.getenv("VERIFY_MAX_ATTEMPTS_24H", "3"))


    # E-mail transacional (Resend)
    RESEND_API_KEY: str = os.getenv("RESEND_API_KEY", "")
    EMAIL_FROM: str = os.getenv("EMAIL_FROM", "Luz Coletiva <no-reply@luzcoletiva.com.br>")
    EMAIL_REPLY_TO: str = os.getenv("EMAIL_REPLY_TO", "")
    ADMIN_NOTIFY_EMAIL: str = os.getenv("ADMIN_NOTIFY_EMAIL", "")
    APP_BASE_URL: str = os.getenv("APP_BASE_URL", "https://luzcoletiva.com.br")
    EMAIL_CHAT_DEBOUNCE_MIN: int = int(os.getenv("EMAIL_CHAT_DEBOUNCE_MIN", "30"))

    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
