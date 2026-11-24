import uuid

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.additional_organization_item import (
    AdditionalOrganizationItem,
)
from app.schemas.additional_organization import (
    AdditionalOrganizationItemCreate,
    AdditionalOrganizationItemUpdate,
)


class AdditionalOrganizationItemRepository:
    @staticmethod
    def list_by_organization(
        db: Session, organization_id: uuid.UUID
    ) -> list[AdditionalOrganizationItem]:
        return (
            db.query(AdditionalOrganizationItem)
            .filter(
                AdditionalOrganizationItem.organization_id == organization_id
            )
            .order_by(
                AdditionalOrganizationItem.position.asc(),
                AdditionalOrganizationItem.created_at.asc(),
            )
            .all()
        )

    @staticmethod
    def get_by_id(
        db: Session, item_id: uuid.UUID
    ) -> AdditionalOrganizationItem | None:
        return (
            db.query(AdditionalOrganizationItem)
            .filter(AdditionalOrganizationItem.id == item_id)
            .first()
        )

    @staticmethod
    def get_by_id_for_update(
        db: Session, item_id: uuid.UUID
    ) -> AdditionalOrganizationItem | None:
        return (
            db.query(AdditionalOrganizationItem)
            .filter(AdditionalOrganizationItem.id == item_id)
            .with_for_update()
            .first()
        )

    @staticmethod
    def next_position(
        db: Session, organization_id: uuid.UUID
    ) -> int:
        highest = (
            db.query(func.max(AdditionalOrganizationItem.position))
            .filter(
                AdditionalOrganizationItem.organization_id == organization_id
            )
            .scalar()
        )
        return int(highest or 0) + 1

    @staticmethod
    def create(
        db: Session,
        organization_id: uuid.UUID,
        data: AdditionalOrganizationItemCreate,
        position: int,
    ) -> AdditionalOrganizationItem:
        item = AdditionalOrganizationItem(
            organization_id=organization_id,
            name=data.name,
            amount=data.amount,
            observation=data.observation,
            position=position,
        )
        db.add(item)
        db.flush()
        db.refresh(item)
        return item

    @staticmethod
    def update(
        db: Session,
        item: AdditionalOrganizationItem,
        data: AdditionalOrganizationItemUpdate,
    ) -> AdditionalOrganizationItem:
        update_data = data.model_dump(
            exclude_unset=True, exclude={"expected_updated_at"}
        )
        for key, value in update_data.items():
            setattr(item, key, value)
        db.flush()
        db.refresh(item)
        return item

    @staticmethod
    def delete(db: Session, item: AdditionalOrganizationItem) -> None:
        db.delete(item)
        db.flush()
