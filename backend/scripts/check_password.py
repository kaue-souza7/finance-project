"""Verifica localmente se uma senha corresponde ao hash salvo.

A senha é lida via getpass e nunca é exibida, logada ou enviada pela rede.
Não altera nada no banco.

Uso:
    python -m scripts.check_password usuario@exemplo.com
"""

import argparse
import getpass
import sys

import app.models  # noqa: F401  # registra relacionamentos do User
from app.core.security import verify_password
from app.database.session import SessionLocal
from app.repositories.user_repository import UserRepository


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("email")
    args = parser.parse_args()

    password = getpass.getpass("Senha (não será exibida): ")
    if not password:
        print("Senha vazia.", file=sys.stderr)
        return 2

    db = SessionLocal()
    try:
        user = UserRepository().get_by_email(db, args.email)
        if not user:
            print("account_found: false")
            return 1

        print("account_found: true")
        print("is_active:", bool(user.is_active))
        print("password_matches:", verify_password(password, user.hashed_password))
        return 0
    finally:
        db.close()


if __name__ == "__main__":
    raise SystemExit(main())
