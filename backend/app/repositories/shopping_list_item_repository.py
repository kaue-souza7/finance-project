import uuid

from sqlalchemy.orm import Session

from app.models.shopping_list_item import ShoppingListItem
from app.schemas.shopping_list import (
    ShoppingListItemCreate,
    ShoppingListItemUpdate,
)


class ShoppingListItemRepository:
    @staticmethod
    def list_by_list(
        db: Session, shopping_list_id: uuid.UUID
    ) -> list[ShoppingListItem]:
        return (
            db.query(ShoppingListItem)
            .filter(ShoppingListItem.shopping_list_id == shopping_list_id)
            .order_by(
                ShoppingListItem.order.asc(),
                ShoppingListItem.created_at.asc(),
            )
            .all()
        )

    @staticmethod
    def get_by_id(
        db: Session, item_id: uuid.UUID
    ) -> ShoppingListItem | None:
        return (
            db.query(ShoppingListItem)
            .filter(ShoppingListItem.id == item_id)
            .first()
        )

    @staticmethod
    def create(
        db: Session,
        shopping_list_id: uuid.UUID,
        data: ShoppingListItemCreate,
    ) -> ShoppingListItem:
        item = ShoppingListItem(
            shopping_list_id=shopping_list_id,
            name=data.name,
            quantity=data.quantity,
            order=data.order,
        )
        db.add(item)
        db.flush()
        db.refresh(item)
        return item

    @staticmethod
    def update(
        db: Session,
        item: ShoppingListItem,
        data: ShoppingListItemUpdate,
    ) -> ShoppingListItem:
        update_data = data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(item, key, value)
        db.flush()
        db.refresh(item)
        return item

    @staticmethod
    def delete(db: Session, item: ShoppingListItem) -> None:
        db.delete(item)
        db.flush()

    @staticmethod
    def count_checked(
        db: Session, shopping_list_id: uuid.UUID
    ) -> int:
        return (
            db.query(ShoppingListItem)
            .filter(
                ShoppingListItem.shopping_list_id == shopping_list_id,
                ShoppingListItem.checked == True,
            )
            .count()
        )

    @staticmethod
    def count_total(
        db: Session, shopping_list_id: uuid.UUID
    ) -> int:
        return (
            db.query(ShoppingListItem)
            .filter(
                ShoppingListItem.shopping_list_id == shopping_list_id
            )
            .count()
        )
