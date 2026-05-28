import uuid
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.models.leisure_invite import LeisureInvite


class LeisureInviteRepository:
    @staticmethod
    def get_by_id(
        db: Session, invite_id: uuid.UUID
    ) -> LeisureInvite | None:
        return (
            db.query(LeisureInvite)
            .filter(LeisureInvite.id == invite_id)
            .first()
        )

    @staticmethod
    def get_pending_by_leisure_and_user(
        db: Session, leisure_id: uuid.UUID, receiver_user_id: uuid.UUID
    ) -> LeisureInvite | None:
        return (
            db.query(LeisureInvite)
            .filter(
                LeisureInvite.leisure_id == leisure_id,
                LeisureInvite.receiver_user_id == receiver_user_id,
                LeisureInvite.status == "pending",
            )
            .first()
        )

    @staticmethod
    def list_received_by_user(
        db: Session, user_id: uuid.UUID
    ) -> list[LeisureInvite]:
        return (
            db.query(LeisureInvite)
            .filter(LeisureInvite.receiver_user_id == user_id)
            .order_by(LeisureInvite.created_at.desc())
            .all()
        )

    @staticmethod
    def list_pending_by_leisure(
        db: Session, leisure_id: uuid.UUID
    ) -> list[LeisureInvite]:
        return (
            db.query(LeisureInvite)
            .filter(
                LeisureInvite.leisure_id == leisure_id,
                LeisureInvite.status == "pending",
            )
            .all()
        )

    @staticmethod
    def create(
        db: Session,
        leisure_id: uuid.UUID,
        sender_id: uuid.UUID,
        receiver_user_id: uuid.UUID,
    ) -> LeisureInvite:
        invite = LeisureInvite(
            leisure_id=leisure_id,
            sender_id=sender_id,
            receiver_user_id=receiver_user_id,
            status="pending",
        )
        db.add(invite)
        db.flush()
        return invite

    @staticmethod
    def update_status(
        db: Session, invite: LeisureInvite, status: str
    ) -> LeisureInvite:
        invite.status = status
        invite.responded_at = datetime.now(timezone.utc)
        db.flush()
        return invite
