from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.schemas.auth import UserResponse
from app.schemas.leisure_invite import (
    InviteResponse,
    InviteSendRequest,
    LeisureParticipantResponse,
)
from app.services.leisure_invite_service import LeisureInviteService

router = APIRouter(prefix="/leisure", tags=["leisure"])


@router.get("/invites/received", response_model=list[InviteResponse])
def list_received_invites(
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = LeisureInviteService(db)
    return service.get_received_invites(str(current_user.id))


@router.post(
    "/{leisure_id}/invite", response_model=InviteResponse, status_code=201
)
def send_invite(
    leisure_id: str,
    data: InviteSendRequest,
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = LeisureInviteService(db)
    return service.send_invite(
        leisure_id, str(current_user.id), data.email
    )


@router.post("/invites/{invite_id}/accept", response_model=InviteResponse)
def accept_invite(
    invite_id: str,
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = LeisureInviteService(db)
    return service.accept_invite(invite_id, str(current_user.id))


@router.post("/invites/{invite_id}/decline", response_model=InviteResponse)
def decline_invite(
    invite_id: str,
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = LeisureInviteService(db)
    return service.decline_invite(invite_id, str(current_user.id))


@router.get(
    "/{leisure_id}/participants",
    response_model=list[LeisureParticipantResponse],
)
def list_participants(
    leisure_id: str,
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = LeisureInviteService(db)
    return service.get_participants(leisure_id, str(current_user.id))


@router.get(
    "/{leisure_id}/invites/pending",
    response_model=list[InviteResponse],
)
def list_pending_invites(
    leisure_id: str,
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = LeisureInviteService(db)
    return service.get_pending_invites_by_leisure(
        leisure_id, str(current_user.id)
    )
