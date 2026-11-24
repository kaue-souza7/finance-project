import uuid

from sqlalchemy.orm import Session, joinedload

from app.models.additional_organization_member import (
    AdditionalOrganizationMember,
)


class AdditionalOrganizationMemberRepository:
    @staticmethod
    def get_by_org_and_user(
        db: Session, organization_id: uuid.UUID, user_id: uuid.UUID
    ) -> AdditionalOrganizationMember | None:
        return (
            db.query(AdditionalOrganizationMember)
            .filter(
                AdditionalOrganizationMember.organization_id
                == organization_id,
                AdditionalOrganizationMember.user_id == user_id,
            )
            .first()
        )

    @staticmethod
    def list_by_organization(
        db: Session, organization_id: uuid.UUID
    ) -> list[AdditionalOrganizationMember]:
        return (
            db.query(AdditionalOrganizationMember)
            .options(joinedload(AdditionalOrganizationMember.user))
            .filter(
                AdditionalOrganizationMember.organization_id
                == organization_id
            )
            .order_by(AdditionalOrganizationMember.created_at.asc())
            .all()
        )

    @staticmethod
    def get_by_id_and_org(
        db: Session, member_id: uuid.UUID, organization_id: uuid.UUID
    ) -> AdditionalOrganizationMember | None:
        return (
            db.query(AdditionalOrganizationMember)
            .filter(
                AdditionalOrganizationMember.id == member_id,
                AdditionalOrganizationMember.organization_id
                == organization_id,
            )
            .first()
        )

    @staticmethod
    def create(
        db: Session, organization_id: uuid.UUID, user_id: uuid.UUID
    ) -> AdditionalOrganizationMember:
        member = AdditionalOrganizationMember(
            organization_id=organization_id,
            user_id=user_id,
        )
        db.add(member)
        db.flush()
        return member

    @staticmethod
    def delete(
        db: Session, member: AdditionalOrganizationMember
    ) -> None:
        db.delete(member)
        db.flush()
