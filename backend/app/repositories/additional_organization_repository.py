import uuid
from datetime import datetime, timezone
from decimal import Decimal

from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload, selectinload

from app.models.additional_organization import AdditionalOrganization
from app.models.additional_organization_item import AdditionalOrganizationItem
from app.models.additional_organization_member import (
    AdditionalOrganizationMember,
)
from app.schemas.additional_organization import AdditionalOrganizationCreate


class AdditionalOrganizationRepository:
    @staticmethod
    def list_by_user_with_totals(
        db: Session, user_id: uuid.UUID
    ) -> list[tuple[AdditionalOrganization, int, Decimal]]:
        allocated = func.coalesce(
            func.sum(AdditionalOrganizationItem.amount), 0
        )
        rows = (
            db.query(
                AdditionalOrganization,
                func.count(AdditionalOrganizationItem.id),
                allocated,
            )
            .outerjoin(
                AdditionalOrganizationItem,
                AdditionalOrganizationItem.organization_id
                == AdditionalOrganization.id,
            )
            .filter(AdditionalOrganization.user_id == user_id)
            .options(selectinload(AdditionalOrganization.user))
            .group_by(AdditionalOrganization.id)
            .order_by(AdditionalOrganization.updated_at.desc())
            .all()
        )
        return [
            (organization, int(item_count), amount)
            for organization, item_count, amount in rows
        ]

    @staticmethod
    def list_shared_by_user_with_totals(
        db: Session, user_id: uuid.UUID
    ) -> list[tuple[AdditionalOrganization, int, Decimal]]:
        allocated = func.coalesce(
            func.sum(AdditionalOrganizationItem.amount), 0
        )
        rows = (
            db.query(
                AdditionalOrganization,
                func.count(AdditionalOrganizationItem.id),
                allocated,
            )
            .join(
                AdditionalOrganizationMember,
                AdditionalOrganizationMember.organization_id
                == AdditionalOrganization.id,
            )
            .outerjoin(
                AdditionalOrganizationItem,
                AdditionalOrganizationItem.organization_id
                == AdditionalOrganization.id,
            )
            .filter(AdditionalOrganizationMember.user_id == user_id)
            .options(selectinload(AdditionalOrganization.user))
            .group_by(AdditionalOrganization.id)
            .order_by(AdditionalOrganization.updated_at.desc())
            .all()
        )
        return [
            (organization, int(item_count), amount)
            for organization, item_count, amount in rows
        ]

    @staticmethod
    def get_by_id(
        db: Session, organization_id: uuid.UUID
    ) -> AdditionalOrganization | None:
        return (
            db.query(AdditionalOrganization)
            .filter(AdditionalOrganization.id == organization_id)
            .first()
        )

    @staticmethod
    def get_by_id_with_owner(
        db: Session, organization_id: uuid.UUID
    ) -> AdditionalOrganization | None:
        return (
            db.query(AdditionalOrganization)
            .options(joinedload(AdditionalOrganization.user))
            .filter(AdditionalOrganization.id == organization_id)
            .first()
        )

    @staticmethod
    def get_by_id_for_update(
        db: Session, organization_id: uuid.UUID
    ) -> AdditionalOrganization | None:
        return (
            db.query(AdditionalOrganization)
            .filter(AdditionalOrganization.id == organization_id)
            .with_for_update()
            .first()
        )

    @staticmethod
    def get_by_id_and_user(
        db: Session, organization_id: uuid.UUID, user_id: uuid.UUID
    ) -> AdditionalOrganization | None:
        return (
            db.query(AdditionalOrganization)
            .filter(
                AdditionalOrganization.id == organization_id,
                AdditionalOrganization.user_id == user_id,
            )
            .first()
        )

    @staticmethod
    def create(
        db: Session, user_id: uuid.UUID, data: AdditionalOrganizationCreate
    ) -> AdditionalOrganization:
        organization = AdditionalOrganization(
            user_id=user_id,
            title=data.title,
            type=data.type,
            content=data.content,
            total_amount=data.total_amount,
            show_observations=data.show_observations,
            content_version=1,
        )
        db.add(organization)
        db.flush()
        db.refresh(organization)
        return organization

    @staticmethod
    def update(
        db: Session,
        organization: AdditionalOrganization,
        values: dict,
    ) -> AdditionalOrganization:
        for key, value in values.items():
            setattr(organization, key, value)
        organization.updated_at = datetime.now(timezone.utc)
        db.flush()
        db.refresh(organization)
        return organization

    @staticmethod
    def touch(
        db: Session, organization: AdditionalOrganization
    ) -> None:
        organization.updated_at = datetime.now(timezone.utc)
        db.flush()

    @staticmethod
    def delete(
        db: Session, organization: AdditionalOrganization
    ) -> None:
        db.delete(organization)
        db.flush()
