import uuid

from sqlalchemy.orm import Session

from app.models.shopping_list import ShoppingList
from app.schemas.shopping_list import ShoppingListCreate, ShoppingListUpdate


class ShoppingListRepository:
    @staticmethod
    def list_by_user(db: Session, user_id: uuid.UUID) -> list[ShoppingList]:
        return (
            db.query(ShoppingList)
            .filter(ShoppingList.user_id == user_id)
            .order_by(ShoppingList.updated_at.desc())
            .all()
        )

    @staticmethod
    def get_by_id(
        db: Session, list_id: uuid.UUID
    ) -> ShoppingList | None:
        return (
            db.query(ShoppingList)
            .filter(ShoppingList.id == list_id)
            .first()
        )

    @staticmethod
    def create(
        db: Session, user_id: uuid.UUID, data: ShoppingListCreate
    ) -> ShoppingList:
        shopping_list = ShoppingList(
            user_id=user_id,
            title=data.title,
            color=data.color,
            icon=data.icon,
        )
        db.add(shopping_list)
        db.flush()
        db.refresh(shopping_list)
        return shopping_list

    @staticmethod
    def update(
        db: Session, shopping_list: ShoppingList, data: ShoppingListUpdate
    ) -> ShoppingList:
        update_data = data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(shopping_list, key, value)
        db.flush()
        db.refresh(shopping_list)
        return shopping_list

    @staticmethod
    def delete(db: Session, shopping_list: ShoppingList) -> None:
        db.delete(shopping_list)
        db.flush()
