"""
CLI: promove um usuário existente para admin.

Uso:
  docker exec -it luz-backend python -m app.cli.promote_admin email@dominio
"""
import sys

from app.core.database import SessionLocal
from app.models.user import User, UserRole


def main():
    if len(sys.argv) != 2:
        print("Uso: python -m app.cli.promote_admin <email>")
        sys.exit(1)

    email = sys.argv[1].strip().lower()
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == email).first()
        if not user:
            print(f"Usuário '{email}' não encontrado.")
            sys.exit(1)
        old = user.role.value
        user.role = UserRole.admin
        db.commit()
        print(f"OK: {email} promovido de '{old}' para 'admin'.")
    finally:
        db.close()


if __name__ == "__main__":
    main()
