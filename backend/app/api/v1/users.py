from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.schemas.auth import UserResponse
from app.schemas.shopping_list import UserSearchResponse
from app.services.shopping_list_service import ShoppingListService

router = APIRouter(prefix="/users", tags=["users"])


@router.get(
    "/search",
    response_model=list[UserSearchResponse],
)
def search_users(
    q: str = Query(..., min_length=1, max_length=100),
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = ShoppingListService(db)
    return service.search_users(q, str(current_user.id))
