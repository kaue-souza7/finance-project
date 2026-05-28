import uuid
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.models.message import Message


class MessageRepository:
    @staticmethod
    def get_by_chat_before(
        db: Session,
        chat_id: uuid.UUID,
        before: datetime | None = None,
        limit: int = 50,
    ) -> list[Message]:
        query = (
            db.query(Message)
            .filter(
                Message.chat_id == chat_id,
                Message.expires_at > datetime.now(timezone.utc),
            )
            .order_by(Message.created_at.desc())
        )
        if before is not None:
            query = query.filter(Message.created_at < before)
        return query.limit(limit + 1).all()

    @staticmethod
    def get_by_chat_after(
        db: Session,
        chat_id: uuid.UUID,
        after: datetime | None = None,
        limit: int = 50,
    ) -> list[Message]:
        query = (
            db.query(Message)
            .filter(
                Message.chat_id == chat_id,
                Message.expires_at > datetime.now(timezone.utc),
            )
            .order_by(Message.created_at.asc())
        )
        if after is not None:
            query = query.filter(Message.created_at > after)
        return query.limit(limit).all()

    @staticmethod
    def get_last_by_chat(
        db: Session, chat_id: uuid.UUID
    ) -> Message | None:
        return (
            db.query(Message)
            .filter(
                Message.chat_id == chat_id,
                Message.expires_at > datetime.now(timezone.utc),
            )
            .order_by(Message.created_at.desc())
            .first()
        )

    @staticmethod
    def create(
        db: Session, chat_id: uuid.UUID, sender_id: uuid.UUID, content: str
    ) -> Message:
        message = Message(
            chat_id=chat_id,
            sender_id=sender_id,
            content=content,
        )
        db.add(message)
        db.flush()
        db.refresh(message)
        return message

    @staticmethod
    def delete_expired(db: Session) -> int:
        result = (
            db.query(Message)
            .filter(Message.expires_at <= datetime.now(timezone.utc))
            .delete(synchronize_session=False)
        )
        db.commit()
        return result

    @staticmethod
    def count_by_chat(db: Session, chat_id: uuid.UUID) -> int:
        return (
            db.query(Message)
            .filter(
                Message.chat_id == chat_id,
                Message.expires_at > datetime.now(timezone.utc),
            )
            .count()
        )
