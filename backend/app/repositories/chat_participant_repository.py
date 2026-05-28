import uuid

from sqlalchemy.orm import Session

from app.models.chat_participant import ChatParticipant


class ChatParticipantRepository:
    @staticmethod
    def is_participant(
        db: Session, chat_id: uuid.UUID, user_id: uuid.UUID
    ) -> bool:
        return (
            db.query(ChatParticipant)
            .filter(
                ChatParticipant.chat_id == chat_id,
                ChatParticipant.user_id == user_id,
            )
            .first()
            is not None
        )

    @staticmethod
    def list_by_chat(
        db: Session, chat_id: uuid.UUID
    ) -> list[ChatParticipant]:
        return (
            db.query(ChatParticipant)
            .filter(ChatParticipant.chat_id == chat_id)
            .order_by(ChatParticipant.joined_at.asc())
            .all()
        )

    @staticmethod
    def get_other_participant(
        db: Session, chat_id: uuid.UUID, user_id: uuid.UUID
    ) -> ChatParticipant | None:
        return (
            db.query(ChatParticipant)
            .filter(
                ChatParticipant.chat_id == chat_id,
                ChatParticipant.user_id != user_id,
            )
            .first()
        )

    @staticmethod
    def create(
        db: Session, chat_id: uuid.UUID, user_id: uuid.UUID
    ) -> ChatParticipant:
        participant = ChatParticipant(
            chat_id=chat_id,
            user_id=user_id,
        )
        db.add(participant)
        db.flush()
        db.refresh(participant)
        return participant
