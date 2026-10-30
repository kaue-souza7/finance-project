"""Gera um link de recuperação para uma conta existente.

Uso (com o DATABASE_URL do ambiente desejado):
    python -m scripts.create_password_reset_link usuario@exemplo.com \
        --frontend-url https://seu-frontend

Não altera a senha: apenas cria um token de uso único, com expiração curta.
"""

import argparse
import sys
from datetime import datetime, timedelta, timezone
from urllib.parse import urlencode

import app.models  # noqa: F401  # registra relacionamentos do User
from app.core.config import settings
from app.core.security import generate_opaque_token, hash_opaque_token
from app.database.session import SessionLocal
from app.repositories.password_reset_token_repository import (
    PasswordResetTokenRepository,
)
from app.repositories.user_repository import UserRepository


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("email", help="E-mail da conta")
    parser.add_argument(
        "--frontend-url",
        default=settings.FRONTEND_URL,
        help="URL pública do frontend",
    )
    args = parser.parse_args()

    db = SessionLocal()
    try:
        user = UserRepository().get_by_email(db, args.email)
        if not user:
            print("Conta não encontrada.", file=sys.stderr)
            return 1
        if not user.is_active:
            print("Conta inativa.", file=sys.stderr)
            return 1

        raw_token = generate_opaque_token()
        repo = PasswordResetTokenRepository()
        repo.invalidate_all_for_user(db, user.id)
        repo.create(
            db,
            user_id=user.id,
            token_hash=hash_opaque_token(raw_token),
            expires_at=datetime.now(timezone.utc)
            + timedelta(minutes=settings.PASSWORD_RESET_EXPIRE_MINUTES),
        )
        db.commit()

        base = args.frontend_url.rstrip("/")
        query = urlencode({"token": raw_token})
        print(f"{base}/reset-password?{query}")
        return 0
    finally:
        db.close()


if __name__ == "__main__":
    raise SystemExit(main())
