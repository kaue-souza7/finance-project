from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.schemas.auth import UserResponse
from app.schemas.shopping_list import (
    ShoppingListCreate,
    ShoppingListDetailResponse,
    ShoppingListResponse,
    ShoppingListUpdate,
    ShoppingListItemCreate,
    ShoppingListItemResponse,
    ShoppingListItemToggle,
    ShoppingListItemUpdate,
)
from app.services.shopping_list_service import ShoppingListService

router = APIRouter(prefix="/shopping-lists", tags=["shopping-lists"])


@router.get("/", response_model=list[ShoppingListResponse])
def list_shopping_lists(
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = ShoppingListService(db)
    return service.list_by_user(str(current_user.id))


@router.post("/", response_model=ShoppingListResponse, status_code=201)
def create_shopping_list(
    data: ShoppingListCreate,
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = ShoppingListService(db)
    return service.create(str(current_user.id), data)


@router.get(
    "/{list_id}", response_model=ShoppingListDetailResponse
)
def get_shopping_list(
    list_id: str,
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = ShoppingListService(db)
    return service.get_by_id(list_id, str(current_user.id))


@router.put("/{list_id}", response_model=ShoppingListResponse)
def update_shopping_list(
    list_id: str,
    data: ShoppingListUpdate,
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = ShoppingListService(db)
    return service.update(list_id, str(current_user.id), data)


@router.delete("/{list_id}", status_code=204)
def delete_shopping_list(
    list_id: str,
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = ShoppingListService(db)
    service.delete(list_id, str(current_user.id))


@router.post(
    "/{list_id}/items",
    response_model=ShoppingListItemResponse,
    status_code=201,
)
def create_item(
    list_id: str,
    data: ShoppingListItemCreate,
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = ShoppingListService(db)
    return service.create_item(list_id, str(current_user.id), data)


@router.put(
    "/{list_id}/items/{item_id}",
    response_model=ShoppingListItemResponse,
)
def update_item(
    list_id: str,
    item_id: str,
    data: ShoppingListItemUpdate,
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = ShoppingListService(db)
    return service.update_item(
        list_id, item_id, str(current_user.id), data
    )


@router.delete(
    "/{list_id}/items/{item_id}",
    status_code=204,
)
def delete_item(
    list_id: str,
    item_id: str,
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = ShoppingListService(db)
    service.delete_item(list_id, item_id, str(current_user.id))


@router.patch(
    "/{list_id}/items/{item_id}/toggle",
    response_model=ShoppingListItemResponse,
)
def toggle_item(
    list_id: str,
    item_id: str,
    data: ShoppingListItemToggle,
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = ShoppingListService(db)
    return service.toggle_item(
        list_id, item_id, str(current_user.id), data
    )
