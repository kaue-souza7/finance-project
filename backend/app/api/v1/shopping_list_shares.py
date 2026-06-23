from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.schemas.auth import UserResponse
from app.schemas.shopping_list import (
    ShareUpdateRequest,
    ShoppingListShareResponse,
)
from app.services.shopping_list_service import ShoppingListService

router = APIRouter(prefix="/shopping-lists", tags=["shopping-lists"])


@router.get(
    "/{list_id}/shares",
    response_model=list[ShoppingListShareResponse],
)
def list_shares(
    list_id: str,
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = ShoppingListService(db)
    return service.list_shares(list_id, str(current_user.id))


@router.put(
    "/{list_id}/shares/{share_id}",
    response_model=ShoppingListShareResponse,
)
def update_share(
    list_id: str,
    share_id: str,
    data: ShareUpdateRequest,
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = ShoppingListService(db)
    return service.update_share(
        list_id, share_id, str(current_user.id), data.role
    )


@router.delete("/{list_id}/shares/{share_id}", status_code=204)
def remove_share(
    list_id: str,
    share_id: str,
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = ShoppingListService(db)
    service.remove_share(list_id, share_id, str(current_user.id))
