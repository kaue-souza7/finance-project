import uuid
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.models.shopping_list_invite import ShoppingListInvite


class ShoppingListInviteRepository:
    @staticmethod
    def get_by_id(
        db: Session, invite_id: uuid.UUID
    ) -> ShoppingListInvite | None:
        return (
            db.query(ShoppingListInvite)
            .filter(ShoppingListInvite.id == invite_id)
            .first()
        )

    @staticmethod
    def get_pending_by_list_and_user(
        db: Session, shopping_list_id: uuid.UUID, receiver_user_id: uuid.UUID
    ) -> ShoppingListInvite | None:
        return (
            db.query(ShoppingListInvite)
            .filter(
                ShoppingListInvite.shopping_list_id == shopping_list_id,
                ShoppingListInvite.receiver_user_id == receiver_user_id,
                ShoppingListInvite.status == "pending",
            )
            .first()
        )

    @staticmethod
    def list_received_by_user(
        db: Session, user_id: uuid.UUID
    ) -> list[ShoppingListInvite]:
        return (
            db.query(ShoppingListInvite)
            .filter(ShoppingListInvite.receiver_user_id == user_id)
            .order_by(ShoppingListInvite.created_at.desc())
            .all()
        )

    @staticmethod
    def list_pending_by_list(
        db: Session, shopping_list_id: uuid.UUID
    ) -> list[ShoppingListInvite]:
        return (
            db.query(ShoppingListInvite)
            .filter(
                ShoppingListInvite.shopping_list_id == shopping_list_id,
                ShoppingListInvite.status == "pending",
            )
            .all()
        )

    @staticmethod
    def create(
        db: Session,
        shopping_list_id: uuid.UUID,
        sender_id: uuid.UUID,
        receiver_user_id: uuid.UUID,
        role: str,
    ) -> ShoppingListInvite:
        invite = ShoppingListInvite(
            shopping_list_id=shopping_list_id,
            sender_id=sender_id,
            receiver_user_id=receiver_user_id,
            role=role,
            status="pending",
        )
        db.add(invite)
        db.flush()
        return invite

    @staticmethod
    def update_status(
        db: Session, invite: ShoppingListInvite, status: str
    ) -> ShoppingListInvite:
        invite.status = status
        invite.responded_at = datetime.now(timezone.utc)
        db.flush()
        return invite

    @staticmethod
    def delete(db: Session, invite: ShoppingListInvite) -> None:
        db.delete(invite)
        db.flush()
