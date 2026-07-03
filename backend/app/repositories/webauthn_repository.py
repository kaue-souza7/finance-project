import uuid
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.models.webauthn import WebAuthnChallenge, WebAuthnCredential


class WebAuthnCredentialRepository:
    @staticmethod
    def get_by_user_id(db: Session, user_id: uuid.UUID) -> list[WebAuthnCredential]:
        return (
            db.query(WebAuthnCredential)
            .filter(WebAuthnCredential.user_id == user_id)
            .order_by(WebAuthnCredential.created_at.desc())
            .all()
        )

    @staticmethod
    def get_by_credential_id(
        db: Session, credential_id: str
    ) -> WebAuthnCredential | None:
        return (
            db.query(WebAuthnCredential)
            .filter(WebAuthnCredential.credential_id == credential_id)
            .first()
        )

    @staticmethod
    def create(
        db: Session,
        user_id: uuid.UUID,
        credential_id: str,
        public_key: str,
        sign_count: int,
        device_name: str | None = None,
        device_type: str | None = None,
    ) -> WebAuthnCredential:
        credential = WebAuthnCredential(
            user_id=user_id,
            credential_id=credential_id,
            public_key=public_key,
            sign_count=sign_count,
            device_name=device_name,
            device_type=device_type,
        )
        db.add(credential)
        db.commit()
        db.refresh(credential)
        return credential

    @staticmethod
    def update_sign_count(
        db: Session, credential_id: str, new_count: int
    ) -> WebAuthnCredential | None:
        credential = (
            db.query(WebAuthnCredential)
            .filter(WebAuthnCredential.credential_id == credential_id)
            .first()
        )
        if not credential:
            return None
        credential.sign_count = new_count
        credential.last_used_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(credential)
        return credential

    @staticmethod
    def delete(db: Session, credential_id: str, user_id: uuid.UUID) -> bool:
        deleted = (
            db.query(WebAuthnCredential)
            .filter(
                WebAuthnCredential.credential_id == credential_id,
                WebAuthnCredential.user_id == user_id,
            )
            .delete()
        )
        db.commit()
        return deleted > 0


class WebAuthnChallengeRepository:
    @staticmethod
    def get(db: Session, challenge: str) -> WebAuthnChallenge | None:
        return (
            db.query(WebAuthnChallenge)
            .filter(WebAuthnChallenge.challenge == challenge)
            .first()
        )

    @staticmethod
    def save(
        db: Session,
        challenge: str,
        purpose: str,
        user_id: uuid.UUID | None = None,
        email: str | None = None,
    ) -> WebAuthnChallenge:
        from datetime import timedelta

        record = WebAuthnChallenge(
            challenge=challenge,
            purpose=purpose,
            user_id=user_id,
            email=email,
            expires_at=datetime.now(timezone.utc) + timedelta(minutes=5),
        )
        db.add(record)
        db.commit()
        return record

    @staticmethod
    def delete(db: Session, challenge: str) -> bool:
        deleted = (
            db.query(WebAuthnChallenge)
            .filter(WebAuthnChallenge.challenge == challenge)
            .delete()
        )
        db.commit()
        return deleted > 0

    @staticmethod
    def delete_expired(db: Session) -> int:
        from datetime import datetime, timezone
        deleted = (
            db.query(WebAuthnChallenge)
            .filter(WebAuthnChallenge.expires_at < datetime.now(timezone.utc))
            .delete()
        )
        db.commit()
        return deleted
