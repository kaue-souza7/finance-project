from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.schemas.auth import UserResponse
from app.schemas.shopping_list import (
    InviteSendRequest,
    ShoppingListInviteResponse,
)
from app.services.shopping_list_service import ShoppingListService

router = APIRouter(prefix="/shopping-lists", tags=["shopping-lists"])


@router.get(
    "/invites/received",
    response_model=list[ShoppingListInviteResponse],
)
def list_received_invites(
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = ShoppingListService(db)
    return service.get_received_invites(str(current_user.id))


@router.post(
    "/{list_id}/invite",
    response_model=ShoppingListInviteResponse,
    status_code=201,
)
def send_invite(
    list_id: str,
    data: InviteSendRequest,
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = ShoppingListService(db)
    return service.send_invite(
        list_id, str(current_user.id), data.user_email, data.role
    )


@router.post(
    "/invites/{invite_id}/accept",
    response_model=ShoppingListInviteResponse,
)
def accept_invite(
    invite_id: str,
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = ShoppingListService(db)
    return service.accept_invite(invite_id, str(current_user.id))


@router.post(
    "/invites/{invite_id}/decline",
    response_model=ShoppingListInviteResponse,
)
def decline_invite(
    invite_id: str,
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = ShoppingListService(db)
    return service.decline_invite(invite_id, str(current_user.id))


@router.get(
    "/{list_id}/invites/pending",
    response_model=list[ShoppingListInviteResponse],
)
def list_pending_invites(
    list_id: str,
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = ShoppingListService(db)
    return service.get_pending_invites_by_list(
        list_id, str(current_user.id)
    )


@router.delete("/{list_id}/invites/{invite_id}", status_code=204)
def cancel_invite(
    list_id: str,
    invite_id: str,
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = ShoppingListService(db)
    service.cancel_invite(
        list_id, invite_id, str(current_user.id)
    )
