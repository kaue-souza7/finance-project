import uuid
from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.repositories.leisure_invite_repository import LeisureInviteRepository
from app.repositories.leisure_participant_repository import (
    LeisureParticipantRepository,
)
from app.repositories.leisure_repository import LeisureRepository
from app.repositories.user_repository import UserRepository
from app.schemas.leisure_invite import (
    InviteResponse,
    LeisureParticipantResponse,
)


class LeisureInviteService:
    def __init__(self, db: Session):
        self.db = db
        self.invite_repo = LeisureInviteRepository()
        self.participant_repo = LeisureParticipantRepository()
        self.leisure_repo = LeisureRepository()
        self.user_repo = UserRepository()

    def _invite_to_response(
        self, invite
    ) -> InviteResponse:
        resp = InviteResponse.model_validate(invite)
        if invite.leisure:
            resp.leisure_title = invite.leisure.title
            resp.leisure_date = invite.leisure.date.isoformat()
        if invite.sender:
            resp.sender_name = invite.sender.name
            resp.sender_email = invite.sender.email
        if invite.receiver:
            resp.receiver_name = invite.receiver.name
            resp.receiver_email = invite.receiver.email
        return resp

    def _participant_to_response(
        self, participant
    ) -> LeisureParticipantResponse:
        resp = LeisureParticipantResponse.model_validate(participant)
        if participant.user:
            resp.user_name = participant.user.name
            resp.user_email = participant.user.email
        return resp

    def get_participants(
        self, leisure_id: str, user_id: str
    ) -> list[LeisureParticipantResponse]:
        lid = uuid.UUID(leisure_id)
        uid = uuid.UUID(user_id)
        if not LeisureRepository.is_owner_or_participant(self.db, lid, uid):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Leisure event not found",
            )
        participants = self.participant_repo.list_by_leisure(self.db, lid)
        return [self._participant_to_response(p) for p in participants]

    def send_invite(
        self, leisure_id: str, sender_id: str, email: str
    ) -> InviteResponse:
        lid = uuid.UUID(leisure_id)
        sid = uuid.UUID(sender_id)

        event = self.leisure_repo.get_by_id(self.db, lid)
        if not event:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)

        if str(event.owner_id) != sender_id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)

        receiver = self.user_repo.get_by_email(self.db, email)
        if not receiver:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Usuário não encontrado",
            )

        if str(receiver.id) == sender_id:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Você não pode convidar a si mesmo",
            )

        existing = self.participant_repo.get_by_leisure_and_user(
            self.db, lid, receiver.id
        )
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Usuário já é participante deste lazer",
            )

        pending = self.invite_repo.get_pending_by_leisure_and_user(
            self.db, lid, receiver.id
        )
        if pending:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Convite já enviado para este usuário",
            )

        invite = self.invite_repo.create(self.db, lid, sid, receiver.id)
        self.db.commit()
        self.db.refresh(invite)
        return self._invite_to_response(invite)

    def accept_invite(
        self, invite_id: str, user_id: str
    ) -> InviteResponse:
        invite = self.invite_repo.get_by_id(
            self.db, uuid.UUID(invite_id)
        )
        if not invite or str(invite.receiver_user_id) != user_id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)

        if invite.status != "pending":
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Convite já foi respondido",
            )

        existing = self.participant_repo.get_by_leisure_and_user(
            self.db, invite.leisure_id, uuid.UUID(user_id)
        )
        if existing:
            self.invite_repo.update_status(self.db, invite, "accepted")
            self.db.commit()
            self.db.refresh(invite)
            return self._invite_to_response(invite)

        try:
            self.invite_repo.update_status(self.db, invite, "accepted")
            self.participant_repo.create(
                self.db, invite.leisure_id, uuid.UUID(user_id)
            )
            self.db.commit()
            self.db.refresh(invite)
        except Exception:
            self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Erro ao aceitar convite",
            )

        return self._invite_to_response(invite)

    def decline_invite(
        self, invite_id: str, user_id: str
    ) -> InviteResponse:
        invite = self.invite_repo.get_by_id(
            self.db, uuid.UUID(invite_id)
        )
        if not invite or str(invite.receiver_user_id) != user_id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)

        if invite.status != "pending":
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Convite já foi respondido",
            )

        self.invite_repo.update_status(self.db, invite, "declined")
        self.db.commit()
        self.db.refresh(invite)
        return self._invite_to_response(invite)

    def get_received_invites(
        self, user_id: str
    ) -> list[InviteResponse]:
        uid = uuid.UUID(user_id)
        invites = self.invite_repo.list_received_by_user(self.db, uid)
        return [self._invite_to_response(i) for i in invites]

    def get_pending_invites_by_leisure(
        self, leisure_id: str, user_id: str
    ) -> list[InviteResponse]:
        lid = uuid.UUID(leisure_id)
        uid = uuid.UUID(user_id)
        event = self.leisure_repo.get_by_id(self.db, lid)
        if not event or event.owner_id != uid:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Leisure event not found",
            )
        invites = self.invite_repo.list_pending_by_leisure(self.db, lid)
        return [self._invite_to_response(i) for i in invites]
