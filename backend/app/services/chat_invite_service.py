import logging
import uuid

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)

from app.repositories.chat_invite_repository import ChatInviteRepository
from app.repositories.chat_participant_repository import (
    ChatParticipantRepository,
)
from app.repositories.chat_repository import ChatRepository
from app.repositories.user_repository import UserRepository
from app.schemas.chat_invite import InviteResponse


class ChatInviteService:
    def __init__(self, db: Session):
        self.db = db
        self.invite_repo = ChatInviteRepository()
        self.chat_repo = ChatRepository()
        self.participant_repo = ChatParticipantRepository()
        self.user_repo = UserRepository()

    def _invite_to_response(
        self, invite
    ) -> InviteResponse:
        resp = InviteResponse.model_validate(invite)
        if invite.sender:
            resp.sender_name = invite.sender.name
            resp.sender_avatar_url = invite.sender.avatar_url
        return resp

    def send_invite(self, sender_id: str, email: str) -> InviteResponse:
        sid = uuid.UUID(sender_id)

        receiver = self.user_repo.get_by_email(self.db, email)
        if not receiver:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Usuário não encontrado",
            )

        if receiver.id == sid:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Você não pode criar um chat consigo mesmo",
            )

        existing = self.chat_repo.get_existing_pair(self.db, sid, receiver.id)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Você já tem um chat com este usuário",
            )

        pending = self.invite_repo.get_pending_between_any(
            self.db, sid, receiver.id
        )
        if pending:
            if pending.sender_id == sid:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Convite já enviado para este usuário",
                )

            try:
                chat = self.chat_repo.create(self.db)
                self.participant_repo.create(self.db, chat.id, sid)
                self.participant_repo.create(self.db, chat.id, receiver.id)
                self.invite_repo.update_status(self.db, pending, "accepted")
                self.db.commit()
            except Exception as e:
                self.db.rollback()
                logger.exception(
                    "Erro ao processar auto-accept (sender=%s, receiver=%s)", sender_id, email
                )
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Erro ao processar convite",
                ) from e

            self.db.refresh(pending)
            resp = self._invite_to_response(pending)
            resp.chat_id = chat.id
            return resp

        invite = self.invite_repo.create(self.db, sid, receiver.id)
        self.db.commit()
        self.db.refresh(invite)
        return self._invite_to_response(invite)

    def accept_invite(
        self, invite_id: str, user_id: str
    ) -> InviteResponse:
        iid = uuid.UUID(invite_id)
        uid = uuid.UUID(user_id)

        invite = self.invite_repo.get_by_id(self.db, iid)
        if not invite or invite.receiver_id != uid:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)

        if invite.status != "pending":
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Convite já foi respondido",
            )

        existing = self.chat_repo.get_existing_pair(
            self.db, invite.sender_id, uid
        )
        if existing:
            self.invite_repo.update_status(self.db, invite, "accepted")
            self.db.commit()
            self.db.refresh(invite)
            resp = self._invite_to_response(invite)
            resp.chat_id = existing.id
            return resp

        try:
            chat = self.chat_repo.create(self.db)
            self.participant_repo.create(self.db, chat.id, invite.sender_id)
            self.participant_repo.create(self.db, chat.id, uid)
            self.invite_repo.update_status(self.db, invite, "accepted")
            self.db.commit()
        except Exception as e:
            self.db.rollback()
            logger.exception(
                "Erro ao aceitar convite (invite_id=%s, user_id=%s)", invite_id, user_id
            )
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Erro ao aceitar convite",
            ) from e

        self.db.refresh(invite)
        resp = self._invite_to_response(invite)
        resp.chat_id = chat.id
        return resp

    def decline_invite(
        self, invite_id: str, user_id: str
    ) -> InviteResponse:
        iid = uuid.UUID(invite_id)
        uid = uuid.UUID(user_id)

        invite = self.invite_repo.get_by_id(self.db, iid)
        if not invite or invite.receiver_id != uid:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)

        if invite.status != "pending":
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Convite já foi respondido",
            )

        invite = self.invite_repo.update_status(self.db, invite, "declined")
        self.db.commit()
        self.db.refresh(invite)
        return self._invite_to_response(invite)

    def list_received_invites(
        self, user_id: str
    ) -> list[InviteResponse]:
        uid = uuid.UUID(user_id)
        invites = self.invite_repo.list_pending_by_receiver(self.db, uid)
        return [self._invite_to_response(i) for i in invites]
