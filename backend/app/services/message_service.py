import logging
import uuid
from datetime import datetime

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)

from app.repositories.chat_participant_repository import (
    ChatParticipantRepository,
)
from app.repositories.chat_repository import ChatRepository
from app.repositories.message_repository import MessageRepository
from app.schemas.message import MessagePageResponse, MessageResponse


class MessageService:
    def __init__(self, db: Session):
        self.db = db
        self.message_repo = MessageRepository()
        self.chat_repo = ChatRepository()
        self.participant_repo = ChatParticipantRepository()

    def _assert_is_participant(
        self, chat_id: uuid.UUID, user_id: uuid.UUID
    ):
        if not self.participant_repo.is_participant(
            self.db, chat_id, user_id
        ):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)

    def _message_to_response(
        self, message
    ) -> MessageResponse:
        return MessageResponse.model_validate(message)

    def send_message(
        self, chat_id: str, user_id: str, content: str
    ) -> MessageResponse:
        cid = uuid.UUID(chat_id)
        uid = uuid.UUID(user_id)

        self._assert_is_participant(cid, uid)

        try:
            message = self.message_repo.create(self.db, cid, uid, content)
            chat = self.chat_repo.get_by_id(self.db, cid)
            self.chat_repo.update_timestamp(self.db, chat)
            self.db.commit()
        except Exception as e:
            self.db.rollback()
            logger.exception("Erro ao enviar mensagem (chat_id=%s, user_id=%s)", chat_id, user_id)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Erro ao enviar mensagem",
            ) from e

        self.db.refresh(message)
        return self._message_to_response(message)

    def list_messages(
        self,
        chat_id: str,
        user_id: str,
        cursor: str | None = None,
        limit: int = 50,
    ) -> MessagePageResponse:
        cid = uuid.UUID(chat_id)
        uid = uuid.UUID(user_id)

        self._assert_is_participant(cid, uid)

        cursor_dt = datetime.fromisoformat(cursor) if cursor else None

        messages = self.message_repo.get_by_chat_before(
            self.db, cid, before=cursor_dt, limit=limit
        )

        has_more = len(messages) > limit
        if has_more:
            messages = messages[:-1]

        next_cursor = (
            messages[-1].created_at.isoformat()
            if has_more and messages
            else None
        )

        messages.reverse()

        return MessagePageResponse(
            messages=[self._message_to_response(m) for m in messages],
            next_cursor=next_cursor,
            has_more=has_more,
        )

    def list_new_messages(
        self,
        chat_id: str,
        user_id: str,
        after: str | None = None,
        limit: int = 50,
    ) -> list[MessageResponse]:
        cid = uuid.UUID(chat_id)
        uid = uuid.UUID(user_id)

        self._assert_is_participant(cid, uid)

        after_dt = datetime.fromisoformat(after) if after else None

        messages = self.message_repo.get_by_chat_after(
            self.db, cid, after=after_dt, limit=limit
        )

        return [self._message_to_response(m) for m in messages]

    def cleanup_expired(self) -> int:
        return self.message_repo.delete_expired(self.db)
