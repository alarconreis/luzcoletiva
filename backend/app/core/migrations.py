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

        # helpcategory
        conn.execute(text("""
            DO $$ BEGIN
                IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'helpcategory') THEN
                    CREATE TYPE helpcategory AS ENUM (
                        'livros', 'material_escolar', 'instrumentos_musicais',
                        'roupas_calcados', 'itens_bebe'
                    );
                END IF;
            END$$;
        """))
        # Adiciona novos valores ao enum (idempotente em DBs existentes)
        conn.execute(text("""
            DO $$ BEGIN
                IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'helpcategory') THEN
                    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumtypid = 'helpcategory'::regtype AND enumlabel = 'cursos') THEN
                        ALTER TYPE helpcategory ADD VALUE 'cursos';
                    END IF;
                    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumtypid = 'helpcategory'::regtype AND enumlabel = 'exames') THEN
                        ALTER TYPE helpcategory ADD VALUE 'exames';
                    END IF;
                    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumtypid = 'helpcategory'::regtype AND enumlabel = 'equipamentos') THEN
                        ALTER TYPE helpcategory ADD VALUE 'equipamentos';
                    END IF;
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

        # reset_token — esqueci minha senha
        conn.execute(text("""
            DO $$ BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns
                    WHERE table_name='users' AND column_name='reset_token_hash'
                ) THEN
                    ALTER TABLE users ADD COLUMN reset_token_hash VARCHAR(64);
                END IF;
            END$$;
        """))
        conn.execute(text("""
            DO $$ BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns
                    WHERE table_name='users' AND column_name='reset_token_expires_at'
                ) THEN
                    ALTER TABLE users ADD COLUMN reset_token_expires_at TIMESTAMPTZ;
                END IF;
            END$$;
        """))

        # LGPD — registro de consentimento e soft-delete
        for col, ddl in [
            ("terms_accepted_at", "ALTER TABLE users ADD COLUMN terms_accepted_at TIMESTAMPTZ"),
            ("privacy_accepted_at", "ALTER TABLE users ADD COLUMN privacy_accepted_at TIMESTAMPTZ"),
            ("terms_version", "ALTER TABLE users ADD COLUMN terms_version VARCHAR(20)"),
            ("consent_ip", "ALTER TABLE users ADD COLUMN consent_ip VARCHAR(64)"),
            ("biometric_consent_at", "ALTER TABLE users ADD COLUMN biometric_consent_at TIMESTAMPTZ"),
            ("deleted_at", "ALTER TABLE users ADD COLUMN deleted_at TIMESTAMPTZ"),
        ]:
            conn.execute(text(f"""
                DO $$ BEGIN
                    IF NOT EXISTS (
                        SELECT 1 FROM information_schema.columns
                        WHERE table_name='users' AND column_name='{col}'
                    ) THEN
                        {ddl};
                    END IF;
                END$$;
            """))
        conn.execute(text(
            "CREATE INDEX IF NOT EXISTS ix_users_deleted_at ON users (deleted_at)"
        ))

        # Atendimento assistido — endereço admin-only
        for col, ddl in [
            ("cep", "ALTER TABLE assisted_profiles ADD COLUMN cep VARCHAR(8)"),
            ("address", "ALTER TABLE assisted_profiles ADD COLUMN address TEXT"),
        ]:
            conn.execute(text(f"""
                DO $$ BEGIN
                    IF EXISTS (
                        SELECT 1 FROM information_schema.tables
                        WHERE table_name='assisted_profiles'
                    ) AND NOT EXISTS (
                        SELECT 1 FROM information_schema.columns
                        WHERE table_name='assisted_profiles' AND column_name='{col}'
                    ) THEN
                        {ddl};
                    END IF;
                END$$;
            """))

    logger.info("Migrations aplicadas com sucesso")
