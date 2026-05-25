import uuid

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.repositories.category_repository import CategoryRepository
from app.schemas.category import CategoryCreate, CategoryResponse, CategoryUpdate


class CategoryService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = CategoryRepository()

    def list_by_user(self, user_id: str) -> list[CategoryResponse]:
        uid = uuid.UUID(user_id)
        cats = self.repo.list_by_user(self.db, uid)
        return [CategoryResponse.model_validate(c) for c in cats]

    def create(self, user_id: str, data: CategoryCreate) -> CategoryResponse:
        uid = uuid.UUID(user_id)
        cat = self.repo.create(self.db, uid, data)
        return CategoryResponse.model_validate(cat)

    def update(
        self, category_id: str, user_id: str, data: CategoryUpdate
    ) -> CategoryResponse:
        cat = self.repo.get_by_id(self.db, uuid.UUID(category_id))
        if not cat or str(cat.user_id) != user_id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)
        cat = self.repo.update(self.db, cat, data)
        return CategoryResponse.model_validate(cat)

    def delete(self, category_id: str, user_id: str) -> None:
        cat = self.repo.get_by_id(self.db, uuid.UUID(category_id))
        if not cat or str(cat.user_id) != user_id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)
        self.repo.delete(self.db, cat)
