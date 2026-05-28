import uuid

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.repositories.leisure_participant_repository import (
    LeisureParticipantRepository,
)
from app.repositories.leisure_repository import LeisureRepository
from app.schemas.leisure import LeisureCreate, LeisureResponse, LeisureUpdate


class LeisureService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = LeisureRepository()
        self.participant_repo = LeisureParticipantRepository()

    def _can_access(self, event_id: uuid.UUID, user_id: uuid.UUID) -> bool:
        event = self.repo.get_by_id(self.db, event_id)
        if not event:
            return False
        if event.owner_id == user_id:
            return True
        return (
            self.participant_repo.get_by_leisure_and_user(
                self.db, event_id, user_id
            )
            is not None
        )

    def _assert_is_owner(
        self, event_id: uuid.UUID, user_id: uuid.UUID
    ):
        event = self.repo.get_by_id(self.db, event_id)
        if not event or event.owner_id != user_id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)
        return event

    def _enrich_response(
        self, resp: LeisureResponse
    ) -> LeisureResponse:
        resp.participant_count = self.repo.count_all_participants(
            self.db, resp.id
        )
        return resp

    def get_all_by_user(self, user_id: str) -> list[LeisureResponse]:
        uid = uuid.UUID(user_id)
        events = self.repo.get_all_by_user(self.db, uid)
        return [
            self._enrich_response(LeisureResponse.model_validate(e))
            for e in events
        ]

    def get_by_id(self, event_id: str, user_id: str) -> LeisureResponse:
        eid = uuid.UUID(event_id)
        uid = uuid.UUID(user_id)
        if not self._can_access(eid, uid):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)
        event = self.repo.get_by_id(self.db, eid)
        resp = LeisureResponse.model_validate(event)
        return self._enrich_response(resp)

    def create(self, user_id: str, data: LeisureCreate) -> LeisureResponse:
        uid = uuid.UUID(user_id)
        event = self.repo.create(self.db, uid, data)
        resp = LeisureResponse.model_validate(event)
        return self._enrich_response(resp)

    def update(
        self, event_id: str, user_id: str, data: LeisureUpdate
    ) -> LeisureResponse:
        eid = uuid.UUID(event_id)
        uid = uuid.UUID(user_id)
        event = self._assert_is_owner(eid, uid)
        event = self.repo.update(self.db, event, data)
        resp = LeisureResponse.model_validate(event)
        return self._enrich_response(resp)

    def delete(self, event_id: str, user_id: str) -> None:
        eid = uuid.UUID(event_id)
        uid = uuid.UUID(user_id)
        event = self._assert_is_owner(eid, uid)
        self.repo.delete(self.db, event)
