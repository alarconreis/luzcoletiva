"""
Migrations idempotentes executadas no startup.
"""
import logging
from sqlalchemy import text
from app.core.database import engine

logger = logging.getLogger(__name__)


def run_migrations() -> None:
    with engine.begin() as conn:
        # userrole
        conn.execute(text("""
            DO $$ BEGIN
                IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'userrole') THEN
                    CREATE TYPE userrole AS ENUM ('user', 'moderator', 'admin');
                END IF;
            END$$;
        """))
        conn.execute(text("""
            DO $$ BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns
                    WHERE table_name='users' AND column_name='role'
                ) THEN
                    ALTER TABLE users ADD COLUMN role userrole NOT NULL DEFAULT 'user';
                END IF;
            END$$;
        """))

        # helpcategory / helprequeststatus / helpofferstatus
        conn.execute(text("""
            DO $$ BEGIN
                IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'helpcategory') THEN
                    CREATE TYPE helpcategory AS ENUM (
                        'alimentacao', 'educacao', 'saude',
                        'instrumentos_musicais', 'livros'
                    );
                END IF;
            END$$;
        """))
        conn.execute(text("""
            DO $$ BEGIN
                IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'helprequeststatus') THEN
                    CREATE TYPE helprequeststatus AS ENUM (
                        'open', 'proposed', 'matched', 'closed', 'cancelled'
                    );
                END IF;
            END$$;
        """))
        conn.execute(text("""
            DO $$ BEGIN
                IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'helpofferstatus') THEN
                    CREATE TYPE helpofferstatus AS ENUM (
                        'pending', 'accepted', 'declined', 'withdrawn'
                    );
                END IF;
            END$$;
        """))

        # verificationstatus
        conn.execute(text("""
            DO $$ BEGIN
                IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'verificationstatus') THEN
                    CREATE TYPE verificationstatus AS ENUM (
                        'pending', 'processing', 'approved',
                        'rejected', 'manual', 'expired'
                    );
                END IF;
            END$$;
        """))

    logger.info("Migrations aplicadas com sucesso")
