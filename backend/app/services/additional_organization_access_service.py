import uuid
from dataclasses import dataclass
from typing import Literal

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.additional_organization import AdditionalOrganization
from app.repositories.additional_organization_member_repository import (
    AdditionalOrganizationMemberRepository,
)
from app.repositories.additional_organization_repository import (
    AdditionalOrganizationRepository,
)

AdditionalOrganizationRole = Literal["owner", "participant"]


@dataclass(frozen=True)
class OrganizationAccess:
    organization: AdditionalOrganization
    role: AdditionalOrganizationRole


class AdditionalOrganizationAccessService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = AdditionalOrganizationRepository()
        self.member_repo = AdditionalOrganizationMemberRepository()

    def get_accessible(
        self, organization_id: uuid.UUID, user_id: uuid.UUID
    ) -> OrganizationAccess:
        organization = self.repo.get_by_id_with_owner(
            self.db, organization_id
        )
        if not organization:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Organização não encontrada",
            )

        if organization.user_id == user_id:
            return OrganizationAccess(organization, "owner")

        member = self.member_repo.get_by_org_and_user(
            self.db, organization.id, user_id
        )
        if member:
            return OrganizationAccess(organization, "participant")

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organização não encontrada",
        )

    def get_owned_or_403(
        self, organization_id: uuid.UUID, user_id: uuid.UUID
    ) -> AdditionalOrganization:
        access = self.get_accessible(organization_id, user_id)
        if access.role != "owner":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Apenas o proprietário pode realizar esta ação",
            )
        return access.organization
