import uuid
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import (
    create_access_token,
    generate_opaque_token,
    hash_opaque_token,
)
from app.repositories.refresh_token_repository import RefreshTokenRepository


@dataclass(frozen=True)
class TokenPair:
    access_token: str
    refresh_token: str
    expires_in: int


class TokenService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = RefreshTokenRepository()

    def _build_pair(
        self,
        user_id: uuid.UUID,
        user_agent: str | None = None,
        ip_address: str | None = None,
    ) -> TokenPair:
        raw_refresh = generate_opaque_token()
        expires_at = datetime.now(timezone.utc) + timedelta(
            days=settings.REFRESH_TOKEN_EXPIRE_DAYS
        )
        self.repo.create(
            self.db,
            user_id=user_id,
            token_hash=hash_opaque_token(raw_refresh),
            expires_at=expires_at,
            user_agent=user_agent,
            ip_address=ip_address,
        )
        return TokenPair(
            access_token=create_access_token(data={"sub": str(user_id)}),
            refresh_token=raw_refresh,
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        )

    def issue(
        self,
        user_id: uuid.UUID,
        user_agent: str | None = None,
        ip_address: str | None = None,
    ) -> TokenPair:
        pair = self._build_pair(user_id, user_agent, ip_address)
        self.db.commit()
        return pair

    def rotate(
        self,
        raw_refresh: str,
        user_agent: str | None = None,
        ip_address: str | None = None,
    ) -> TokenPair:
        token_hash = hash_opaque_token(raw_refresh)
        current = self.repo.get_active_by_hash(self.db, token_hash)

        if not current:
            # Token já usado/revogado: possível reutilização. Revoga a família
            # inteira por precaução.
            known = self.repo.get_by_hash(self.db, token_hash)
            if known and known.revoked_at is not None:
                # Reutilização de um token já rotacionado: revoga a família.
                self.repo.revoke_all_for_user(self.db, known.user_id)
                self.db.commit()
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Refresh token inválido ou expirado",
            )

        self.repo.revoke(self.db, current)
        pair = self._build_pair(current.user_id, user_agent, ip_address)
        self.db.commit()
        return pair

    def revoke(self, raw_refresh: str) -> None:
        token_hash = hash_opaque_token(raw_refresh)
        token = self.repo.get_active_by_hash(self.db, token_hash)
        if token:
            self.repo.revoke(self.db, token)
            self.db.commit()

    def revoke_all_for_user(self, user_id: uuid.UUID) -> None:
        self.repo.revoke_all_for_user(self.db, user_id)
        self.db.flush()
