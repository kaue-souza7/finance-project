import uuid
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import (
    generate_opaque_token,
    hash_opaque_token,
    hash_password,
    verify_password,
)
from app.repositories.category_repository import CategoryRepository
from app.repositories.password_reset_token_repository import (
    PasswordResetTokenRepository,
)
from app.repositories.user_repository import UserRepository
from app.schemas.auth import (
    LoginRequest,
    ResetPasswordRequest,
    TokenResponse,
    UserCreate,
    UserResponse,
)
from app.services.token_service import TokenService, TokenPair


def _to_response(pair: TokenPair) -> TokenResponse:
    return TokenResponse(
        access_token=pair.access_token,
        refresh_token=pair.refresh_token,
        expires_in=pair.expires_in,
    )


class AuthService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = UserRepository()
        self.category_repo = CategoryRepository()
        self.reset_repo = PasswordResetTokenRepository()
        self.token_service = TokenService(db)

    def register(
        self,
        data: UserCreate,
        user_agent: str | None = None,
        ip_address: str | None = None,
    ) -> TokenResponse:
        email = data.email.strip().lower()
        existing = self.repo.get_by_email(self.db, email)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="E-mail já cadastrado",
            )

        try:
            user = self.repo.create(
                self.db,
                data.model_copy(update={"email": email}),
                hash_password(data.password),
            )
            self.category_repo.seed_defaults(self.db, user.id)
            pair = self.token_service.issue(user.id, user_agent, ip_address)
        except IntegrityError:
            self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="E-mail já cadastrado",
            ) from None
        except Exception:
            self.db.rollback()
            raise

        return _to_response(pair)

    def login(
        self,
        data: LoginRequest,
        user_agent: str | None = None,
        ip_address: str | None = None,
    ) -> TokenResponse:
        user = self.repo.get_by_email(self.db, data.email)
        if not user or not verify_password(data.password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="E-mail ou senha inválidos",
            )

        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Usuário inativo",
            )

        pair = self.token_service.issue(user.id, user_agent, ip_address)
        return _to_response(pair)

    def refresh(
        self,
        refresh_token: str,
        user_agent: str | None = None,
        ip_address: str | None = None,
    ) -> TokenResponse:
        pair = self.token_service.rotate(refresh_token, user_agent, ip_address)
        return _to_response(pair)

    def logout(self, refresh_token: str) -> None:
        self.token_service.revoke(refresh_token)

    def request_password_reset(self, email: str) -> tuple[str, str] | None:
        user = self.repo.get_by_email(self.db, email)
        if not user or not user.is_active:
            return None

        raw_token = generate_opaque_token()
        expires_at = datetime.now(timezone.utc) + timedelta(
            minutes=settings.PASSWORD_RESET_EXPIRE_MINUTES
        )
        self.reset_repo.invalidate_all_for_user(self.db, user.id)
        self.reset_repo.create(
            self.db,
            user_id=user.id,
            token_hash=hash_opaque_token(raw_token),
            expires_at=expires_at,
        )
        self.db.commit()
        return user.email, raw_token

    def reset_password(self, data: ResetPasswordRequest) -> None:
        token = self.reset_repo.get_active_by_hash(
            self.db, hash_opaque_token(data.token)
        )
        if not token:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Token inválido ou expirado",
            )

        user = self.repo.get_by_id(self.db, token.user_id)
        if not user or not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Token inválido ou expirado",
            )

        if verify_password(data.new_password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="A nova senha deve ser diferente da atual",
            )

        user.hashed_password = hash_password(data.new_password)
        self.reset_repo.mark_used(self.db, token)
        self.reset_repo.invalidate_all_for_user(self.db, user.id)
        self.token_service.revoke_all_for_user(user.id)
        self.db.commit()

    def get_current_user(self, user_id: str) -> UserResponse:
        user = self.repo.get_by_id(self.db, uuid.UUID(user_id))
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)
        return UserResponse.model_validate(user)
