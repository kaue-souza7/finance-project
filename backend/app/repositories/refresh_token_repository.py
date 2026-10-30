import uuid
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.models.refresh_token import RefreshToken


class RefreshTokenRepository:
    @staticmethod
    def create(
        db: Session,
        user_id: uuid.UUID,
        token_hash: str,
        expires_at: datetime,
        user_agent: str | None = None,
        ip_address: str | None = None,
    ) -> RefreshToken:
        token = RefreshToken(
            user_id=user_id,
            token_hash=token_hash,
            expires_at=expires_at,
            user_agent=user_agent,
            ip_address=ip_address,
        )
        db.add(token)
        db.flush()
        return token

    @staticmethod
    def get_active_by_hash(db: Session, token_hash: str) -> RefreshToken | None:
        now = datetime.now(timezone.utc)
        return (
            db.query(RefreshToken)
            .filter(
                RefreshToken.token_hash == token_hash,
                RefreshToken.revoked_at.is_(None),
                RefreshToken.expires_at > now,
            )
            .with_for_update()
            .first()
        )

    @staticmethod
    def get_by_hash(db: Session, token_hash: str) -> RefreshToken | None:
        return (
            db.query(RefreshToken)
            .filter(RefreshToken.token_hash == token_hash)
            .first()
        )

    @staticmethod
    def revoke(db: Session, token: RefreshToken, when: datetime | None = None) -> None:
        token.revoked_at = when or datetime.now(timezone.utc)
        db.flush()

    @staticmethod
    def revoke_all_for_user(
        db: Session, user_id: uuid.UUID, when: datetime | None = None
    ) -> int:
        revoked_at = when or datetime.now(timezone.utc)
        return (
            db.query(RefreshToken)
            .filter(
                RefreshToken.user_id == user_id,
                RefreshToken.revoked_at.is_(None),
            )
            .update({"revoked_at": revoked_at}, synchronize_session=False)
        )

    @staticmethod
    def delete_expired(db: Session) -> int:
        now = datetime.now(timezone.utc)
        return (
            db.query(RefreshToken)
            .filter(RefreshToken.expires_at <= now)
            .delete(synchronize_session=False)
        )
