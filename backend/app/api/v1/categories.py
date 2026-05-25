from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.schemas.auth import UserResponse
from app.schemas.category import CategoryCreate, CategoryResponse, CategoryUpdate
from app.services.category_service import CategoryService

router = APIRouter(prefix="/categories", tags=["categories"])


@router.get("/", response_model=list[CategoryResponse])
def list_categories(
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = CategoryService(db)
    return service.list_by_user(str(current_user.id))


@router.post("/", response_model=CategoryResponse, status_code=201)
def create_category(
    data: CategoryCreate,
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = CategoryService(db)
    return service.create(str(current_user.id), data)


@router.put("/{category_id}", response_model=CategoryResponse)
def update_category(
    category_id: str,
    data: CategoryUpdate,
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = CategoryService(db)
    return service.update(category_id, str(current_user.id), data)


@router.delete("/{category_id}", status_code=204)
def delete_category(
    category_id: str,
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = CategoryService(db)
    service.delete(category_id, str(current_user.id))
