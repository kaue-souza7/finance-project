import re
import uuid
from datetime import datetime, timezone
from decimal import Decimal

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.additional_organization import AdditionalOrganization
from app.models.additional_organization_item import (
    AdditionalOrganizationItem,
)
from app.repositories.additional_organization_item_repository import (
    AdditionalOrganizationItemRepository,
)
from app.repositories.additional_organization_repository import (
    AdditionalOrganizationRepository,
)
from app.schemas.additional_organization import (
    AdditionalOrganizationContentUpdate,
    AdditionalOrganizationCreate,
    AdditionalOrganizationDetailResponse,
    AdditionalOrganizationItemCreate,
    AdditionalOrganizationItemResponse,
    AdditionalOrganizationItemUpdate,
    AdditionalOrganizationRole,
    AdditionalOrganizationSummaryResponse,
    AdditionalOrganizationUpdate,
)
from app.services.additional_organization_access_service import (
    AdditionalOrganizationAccessService,
)

ZERO = Decimal("0.00")
CENT = Decimal("0.01")


class AdditionalOrganizationService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = AdditionalOrganizationRepository()
        self.item_repo = AdditionalOrganizationItemRepository()
        self.access = AdditionalOrganizationAccessService(db)

    @staticmethod
    def _money(value: object) -> Decimal:
        if isinstance(value, Decimal):
            amount = value
        else:
            amount = Decimal(str(value or 0))
        return amount.quantize(CENT)

    @classmethod
    def _allocated(
        cls, items: list[AdditionalOrganizationItem]
    ) -> Decimal:
        total = ZERO
        for item in items:
            total += cls._money(item.amount)
        return total

    @staticmethod
    def _content_preview(content: str | None) -> str | None:
        if not content:
            return None
        preview = re.sub(r"\s+", " ", content).strip()
        if not preview:
            return None
        return preview[:160]

    def _summary(
        self,
        organization: AdditionalOrganization,
        item_count: int,
        allocated: object,
        role: AdditionalOrganizationRole,
    ) -> AdditionalOrganizationSummaryResponse:
        allocated_amount = self._money(allocated)
        remaining = (
            self._money(organization.total_amount) - allocated_amount
            if organization.type == "additional_income"
            else None
        )
        owner = organization.user
        return AdditionalOrganizationSummaryResponse(
            id=organization.id,
            user_id=organization.user_id,
            title=organization.title,
            type=organization.type,
            total_amount=organization.total_amount,
            content_preview=(
                self._content_preview(organization.content)
                if organization.type == "free_text"
                else None
            ),
            show_observations=organization.show_observations,
            content_version=organization.content_version,
            item_count=item_count,
            allocated_amount=allocated_amount,
            remaining_amount=remaining,
            role=role,
            owner={
                "id": owner.id,
                "name": owner.name,
                "avatar_url": owner.avatar_url,
            },
            created_at=organization.created_at,
            updated_at=organization.updated_at,
        )

    def _detail(
        self,
        organization: AdditionalOrganization,
        role: AdditionalOrganizationRole,
    ) -> AdditionalOrganizationDetailResponse:
        items = self.item_repo.list_by_organization(
            self.db, organization.id
        )
        allocated = self._allocated(items)
        remaining = (
            self._money(organization.total_amount) - allocated
            if organization.type == "additional_income"
            else None
        )
        owner = organization.user
        return AdditionalOrganizationDetailResponse(
            id=organization.id,
            user_id=organization.user_id,
            title=organization.title,
            type=organization.type,
            total_amount=organization.total_amount,
            content_preview=(
                self._content_preview(organization.content)
                if organization.type == "free_text"
                else None
            ),
            content=organization.content,
            show_observations=organization.show_observations,
            content_version=organization.content_version,
            item_count=len(items),
            allocated_amount=allocated,
            remaining_amount=remaining,
            role=role,
            owner={
                "id": owner.id,
                "name": owner.name,
                "avatar_url": owner.avatar_url,
            },
            items=[
                AdditionalOrganizationItemResponse.model_validate(item)
                for item in items
            ],
            created_at=organization.created_at,
            updated_at=organization.updated_at,
        )

    @staticmethod
    def _require_income(organization: AdditionalOrganization) -> None:
        if organization.type != "additional_income":
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=(
                    "Esta organização é de texto livre e não aceita valores"
                ),
            )

    @staticmethod
    def _as_utc(value: datetime) -> datetime:
        if value.tzinfo is None:
            return value.replace(tzinfo=timezone.utc)
        return value.astimezone(timezone.utc)

    def list_by_user(
        self, user_id: uuid.UUID
    ) -> list[AdditionalOrganizationSummaryResponse]:
        rows = self.repo.list_by_user_with_totals(self.db, user_id)
        return [
            self._summary(organization, item_count, allocated, "owner")
            for organization, item_count, allocated in rows
        ]

    def list_shared_by_user(
        self, user_id: uuid.UUID
    ) -> list[AdditionalOrganizationSummaryResponse]:
        rows = self.repo.list_shared_by_user_with_totals(
            self.db, user_id
        )
        return [
            self._summary(
                organization, item_count, allocated, "participant"
            )
            for organization, item_count, allocated in rows
        ]

    def create(
        self, user_id: uuid.UUID, data: AdditionalOrganizationCreate
    ) -> AdditionalOrganizationSummaryResponse:
        organization = self.repo.create(self.db, user_id, data)
        self.db.commit()
        self.db.refresh(organization)
        return self._summary(organization, 0, ZERO, "owner")

    def get_by_id(
        self, organization_id: uuid.UUID, user_id: uuid.UUID
    ) -> AdditionalOrganizationDetailResponse:
        access = self.access.get_accessible(organization_id, user_id)
        return self._detail(access.organization, access.role)

    def update(
        self,
        organization_id: uuid.UUID,
        user_id: uuid.UUID,
        data: AdditionalOrganizationUpdate,
    ) -> AdditionalOrganizationSummaryResponse:
        organization = self.access.get_owned_or_403(
            organization_id, user_id
        )
        fields = data.model_fields_set
        values: dict = {}

        if "title" in fields:
            if data.title is None:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail="Informe um título",
                )
            values["title"] = data.title

        if organization.type == "free_text":
            if "total_amount" in fields and data.total_amount is not None:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail="Texto Livre não aceita valor",
                )
            if "show_observations" in fields:
                values["show_observations"] = False
        else:
            if "total_amount" in fields:
                if data.total_amount is None:
                    raise HTTPException(
                        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                        detail="Informe o valor da receita adicional",
                    )
                values["total_amount"] = data.total_amount
            if (
                "show_observations" in fields
                and data.show_observations is not None
            ):
                values["show_observations"] = data.show_observations

        organization = self.repo.update(self.db, organization, values)
        self.db.commit()
        self.db.refresh(organization)

        items = self.item_repo.list_by_organization(
            self.db, organization.id
        )
        return self._summary(
            organization, len(items), self._allocated(items), "owner"
        )

    def update_content(
        self,
        organization_id: uuid.UUID,
        user_id: uuid.UUID,
        data: AdditionalOrganizationContentUpdate,
    ) -> AdditionalOrganizationSummaryResponse:
        access = self.access.get_accessible(organization_id, user_id)
        if access.organization.type != "free_text":
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Esta organização não aceita anotações",
            )

        organization = self.repo.get_by_id_for_update(
            self.db, organization_id
        )
        if not organization:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Organização não encontrada",
            )

        if organization.content_version != data.expected_version:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=(
                    "O texto foi alterado por outra pessoa. "
                    "Recarregue a versão atual."
                ),
            )

        organization.content = data.content
        organization.content_version += 1
        organization.updated_at = datetime.now(timezone.utc)
        self.db.commit()
        self.db.refresh(organization)

        items = self.item_repo.list_by_organization(
            self.db, organization.id
        )
        return self._summary(
            organization,
            len(items),
            self._allocated(items),
            access.role,
        )

    def delete(
        self, organization_id: uuid.UUID, user_id: uuid.UUID
    ) -> None:
        organization = self.access.get_owned_or_403(
            organization_id, user_id
        )
        self.repo.delete(self.db, organization)
        self.db.commit()

    def create_item(
        self,
        organization_id: uuid.UUID,
        user_id: uuid.UUID,
        data: AdditionalOrganizationItemCreate,
    ) -> AdditionalOrganizationItemResponse:
        access = self.access.get_accessible(organization_id, user_id)
        organization = access.organization
        self._require_income(organization)

        try:
            position = (
                data.position
                if data.position is not None
                else self.item_repo.next_position(self.db, organization.id)
            )
            item = self.item_repo.create(
                self.db, organization.id, data, position
            )
            self.repo.touch(self.db, organization)
            self.db.commit()
            self.db.refresh(item)
        except Exception:
            self.db.rollback()
            raise

        return AdditionalOrganizationItemResponse.model_validate(item)

    def update_item(
        self,
        organization_id: uuid.UUID,
        item_id: uuid.UUID,
        user_id: uuid.UUID,
        data: AdditionalOrganizationItemUpdate,
    ) -> AdditionalOrganizationItemResponse:
        access = self.access.get_accessible(organization_id, user_id)
        organization = access.organization
        self._require_income(organization)

        item = self.item_repo.get_by_id_for_update(self.db, item_id)
        if not item or item.organization_id != organization.id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Linha não encontrada",
            )

        fields = data.model_fields_set
        if "name" in fields and data.name is None:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Informe o nome da linha",
            )
        if "amount" in fields and data.amount is None:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Informe um valor maior que zero",
            )

        if data.expected_updated_at is not None:
            expected = self._as_utc(data.expected_updated_at)
            current = self._as_utc(item.updated_at)
            if expected != current:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=(
                        "Esta linha foi alterada por outra pessoa. "
                        "Atualize os dados e tente novamente."
                    ),
                )

        try:
            item = self.item_repo.update(self.db, item, data)
            self.repo.touch(self.db, organization)
            self.db.commit()
            self.db.refresh(item)
        except Exception:
            self.db.rollback()
            raise

        return AdditionalOrganizationItemResponse.model_validate(item)

    def delete_item(
        self,
        organization_id: uuid.UUID,
        item_id: uuid.UUID,
        user_id: uuid.UUID,
    ) -> None:
        access = self.access.get_accessible(organization_id, user_id)
        organization = access.organization
        self._require_income(organization)

        item = self.item_repo.get_by_id(self.db, item_id)
        if not item or item.organization_id != organization.id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Linha não encontrada",
            )

        try:
            self.item_repo.delete(self.db, item)
            self.repo.touch(self.db, organization)
            self.db.commit()
        except Exception:
            self.db.rollback()
            raise
