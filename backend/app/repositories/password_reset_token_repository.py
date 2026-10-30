import uuid
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.models.password_reset_token import PasswordResetToken


class PasswordResetTokenRepository:
    @staticmethod
    def create(
        db: Session,
        user_id: uuid.UUID,
        token_hash: str,
        expires_at: datetime,
    ) -> PasswordResetToken:
        token = PasswordResetToken(
            user_id=user_id,
            token_hash=token_hash,
            expires_at=expires_at,
        )
        db.add(token)
        db.flush()
        return token

    @staticmethod
    def get_active_by_hash(
        db: Session, token_hash: str
    ) -> PasswordResetToken | None:
        now = datetime.now(timezone.utc)
        return (
            db.query(PasswordResetToken)
            .filter(
                PasswordResetToken.token_hash == token_hash,
                PasswordResetToken.used_at.is_(None),
                PasswordResetToken.expires_at > now,
            )
            .first()
        )

    @staticmethod
    def mark_used(
        db: Session, token: PasswordResetToken, when: datetime | None = None
    ) -> None:
        token.used_at = when or datetime.now(timezone.utc)
        db.flush()

    @staticmethod
    def invalidate_all_for_user(db: Session, user_id: uuid.UUID) -> int:
        now = datetime.now(timezone.utc)
        return (
            db.query(PasswordResetToken)
            .filter(
                PasswordResetToken.user_id == user_id,
                PasswordResetToken.used_at.is_(None),
            )
            .update({"used_at": now}, synchronize_session=False)
        )

    @staticmethod
    def delete_expired(db: Session) -> int:
        now = datetime.now(timezone.utc)
        return (
            db.query(PasswordResetToken)
            .filter(PasswordResetToken.expires_at <= now)
            .delete(synchronize_session=False)
        )
