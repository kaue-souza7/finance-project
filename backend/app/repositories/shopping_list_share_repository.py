import uuid

from sqlalchemy.orm import Session

from app.models.shopping_list import ShoppingList
from app.models.shopping_list_share import ShoppingListShare


class ShoppingListShareRepository:
    @staticmethod
    def get_by_id(
        db: Session, share_id: uuid.UUID
    ) -> ShoppingListShare | None:
        return (
            db.query(ShoppingListShare)
            .filter(ShoppingListShare.id == share_id)
            .first()
        )

    @staticmethod
    def get_by_list_and_user(
        db: Session, shopping_list_id: uuid.UUID, user_id: uuid.UUID
    ) -> ShoppingListShare | None:
        return (
            db.query(ShoppingListShare)
            .filter(
                ShoppingListShare.shopping_list_id == shopping_list_id,
                ShoppingListShare.user_id == user_id,
            )
            .first()
        )

    @staticmethod
    def list_by_list(
        db: Session, shopping_list_id: uuid.UUID
    ) -> list[ShoppingListShare]:
        return (
            db.query(ShoppingListShare)
            .filter(ShoppingListShare.shopping_list_id == shopping_list_id)
            .order_by(ShoppingListShare.created_at.desc())
            .all()
        )

    @staticmethod
    def list_shared_lists_for_user(
        db: Session, user_id: uuid.UUID
    ) -> list[ShoppingList]:
        return (
            db.query(ShoppingList)
            .join(
                ShoppingListShare,
                ShoppingListShare.shopping_list_id == ShoppingList.id,
            )
            .filter(ShoppingListShare.user_id == user_id)
            .order_by(ShoppingList.updated_at.desc())
            .all()
        )

    @staticmethod
    def create(
        db: Session,
        shopping_list_id: uuid.UUID,
        user_id: uuid.UUID,
        role: str,
        created_by: uuid.UUID,
    ) -> ShoppingListShare:
        share = ShoppingListShare(
            shopping_list_id=shopping_list_id,
            user_id=user_id,
            role=role,
            created_by=created_by,
        )
        db.add(share)
        db.flush()
        return share

    @staticmethod
    def update_role(
        db: Session, share: ShoppingListShare, role: str
    ) -> ShoppingListShare:
        share.role = role
        db.flush()
        return share

    @staticmethod
    def delete(db: Session, share: ShoppingListShare) -> None:
        db.delete(share)
        db.flush()
