import logging
import uuid

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)

from app.repositories.chat_participant_repository import (
    ChatParticipantRepository,
)
from app.repositories.chat_repository import ChatRepository
from app.repositories.message_repository import MessageRepository
from app.repositories.user_repository import UserRepository
from app.schemas.chat import ChatParticipantResponse, ChatResponse


class ChatService:
    def __init__(self, db: Session):
        self.db = db
        self.chat_repo = ChatRepository()
        self.participant_repo = ChatParticipantRepository()
        self.message_repo = MessageRepository()
        self.user_repo = UserRepository()

    def _participant_to_response(
        self, participant
    ) -> ChatParticipantResponse:
        return ChatParticipantResponse(
            user_id=participant.user_id,
            name=participant.user.name if participant.user else "Usuário removido",
            avatar_url=participant.user.avatar_url if participant.user else None,
        )

    def _chat_to_response(
        self, chat, user_id: uuid.UUID
    ) -> ChatResponse:
        other = self.participant_repo.get_other_participant(
            self.db, chat.id, user_id
        )
        last = self.message_repo.get_last_by_chat(self.db, chat.id)

        participant = (
            self._participant_to_response(other) if other else None
        )

        return ChatResponse(
            id=chat.id,
            participant=participant,
            last_message=last.content if last else None,
            last_interaction_at=chat.updated_at,
            created_at=chat.created_at,
        )

    def list_chats(self, user_id: str) -> list[ChatResponse]:
        uid = uuid.UUID(user_id)
        chats = self.chat_repo.get_by_user(self.db, uid)
        return [self._chat_to_response(c, uid) for c in chats]

    def get_chat(self, chat_id: str, user_id: str) -> ChatResponse:
        cid = uuid.UUID(chat_id)
        uid = uuid.UUID(user_id)

        if not self.participant_repo.is_participant(self.db, cid, uid):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)

        chat = self.chat_repo.get_by_id(self.db, cid)
        return self._chat_to_response(chat, uid)
