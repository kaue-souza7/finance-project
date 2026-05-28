from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.schemas.auth import UserResponse
from app.schemas.chat_invite import InviteResponse, InviteSendRequest
from app.services.chat_invite_service import ChatInviteService

router = APIRouter(prefix="/chat", tags=["chat"])


@router.post("/invite", response_model=InviteResponse, status_code=201)
def send_invite(
    data: InviteSendRequest,
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = ChatInviteService(db)
    return service.send_invite(str(current_user.id), data.email)


@router.get("/invites/received", response_model=list[InviteResponse])
def list_received_invites(
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = ChatInviteService(db)
    return service.list_received_invites(str(current_user.id))


@router.post("/invites/{invite_id}/accept", response_model=InviteResponse)
def accept_invite(
    invite_id: str,
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = ChatInviteService(db)
    return service.accept_invite(invite_id, str(current_user.id))


@router.post("/invites/{invite_id}/decline", response_model=InviteResponse)
def decline_invite(
    invite_id: str,
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = ChatInviteService(db)
    return service.decline_invite(invite_id, str(current_user.id))
