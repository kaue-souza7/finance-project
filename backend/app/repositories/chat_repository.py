import uuid
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.models.chat import Chat
from app.models.chat_participant import ChatParticipant


class ChatRepository:
    @staticmethod
    def get_by_id(db: Session, chat_id: uuid.UUID) -> Chat | None:
        return db.query(Chat).filter(Chat.id == chat_id).first()

    @staticmethod
    def get_by_user(db: Session, user_id: uuid.UUID) -> list[Chat]:
        return (
            db.query(Chat)
            .join(ChatParticipant, ChatParticipant.chat_id == Chat.id)
            .filter(ChatParticipant.user_id == user_id)
            .order_by(Chat.updated_at.desc())
            .all()
        )

    @staticmethod
    def get_existing_pair(
        db: Session, user1_id: uuid.UUID, user2_id: uuid.UUID
    ) -> Chat | None:
        user1_chat_ids = (
            db.query(ChatParticipant.chat_id)
            .filter(ChatParticipant.user_id == user1_id)
            .subquery()
        )
        return (
            db.query(Chat)
            .join(ChatParticipant, ChatParticipant.chat_id == Chat.id)
            .filter(
                ChatParticipant.chat_id.in_(user1_chat_ids),
                ChatParticipant.user_id == user2_id,
            )
            .first()
        )

    @staticmethod
    def create(db: Session) -> Chat:
        chat = Chat()
        db.add(chat)
        db.flush()
        db.refresh(chat)
        return chat

    @staticmethod
    def update_timestamp(db: Session, chat: Chat) -> Chat:
        chat.updated_at = datetime.now(timezone.utc)
        db.flush()
        db.refresh(chat)
        return chat
