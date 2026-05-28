import uuid
from datetime import datetime, timezone

from sqlalchemy import and_, or_
from sqlalchemy.orm import Session

from app.models.chat_invite import ChatInvite


class ChatInviteRepository:
    @staticmethod
    def get_by_id(
        db: Session, invite_id: uuid.UUID
    ) -> ChatInvite | None:
        return (
            db.query(ChatInvite)
            .filter(ChatInvite.id == invite_id)
            .first()
        )

    @staticmethod
    def get_pending_between(
        db: Session, sender_id: uuid.UUID, receiver_id: uuid.UUID
    ) -> ChatInvite | None:
        return (
            db.query(ChatInvite)
            .filter(
                ChatInvite.sender_id == sender_id,
                ChatInvite.receiver_id == receiver_id,
                ChatInvite.status == "pending",
            )
            .first()
        )

    @staticmethod
    def get_pending_between_any(
        db: Session, user1_id: uuid.UUID, user2_id: uuid.UUID
    ) -> ChatInvite | None:
        return (
            db.query(ChatInvite)
            .filter(
                or_(
                    and_(
                        ChatInvite.sender_id == user1_id,
                        ChatInvite.receiver_id == user2_id,
                    ),
                    and_(
                        ChatInvite.sender_id == user2_id,
                        ChatInvite.receiver_id == user1_id,
                    ),
                ),
                ChatInvite.status == "pending",
            )
            .first()
        )

    @staticmethod
    def list_pending_by_receiver(
        db: Session, user_id: uuid.UUID
    ) -> list[ChatInvite]:
        return (
            db.query(ChatInvite)
            .filter(
                ChatInvite.receiver_id == user_id,
                ChatInvite.status == "pending",
            )
            .order_by(ChatInvite.created_at.desc())
            .all()
        )

    @staticmethod
    def create(
        db: Session, sender_id: uuid.UUID, receiver_id: uuid.UUID
    ) -> ChatInvite:
        invite = ChatInvite(
            sender_id=sender_id,
            receiver_id=receiver_id,
            status="pending",
        )
        db.add(invite)
        db.flush()
        db.refresh(invite)
        return invite

    @staticmethod
    def update_status(
        db: Session, invite: ChatInvite, status: str
    ) -> ChatInvite:
        invite.status = status
        invite.responded_at = datetime.now(timezone.utc)
        db.flush()
        db.refresh(invite)
        return invite
