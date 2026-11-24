import uuid
from datetime import datetime
from decimal import Decimal
from typing import Annotated, Literal

from pydantic import (
    BaseModel,
    Field,
    PlainSerializer,
    field_validator,
    model_validator,
)

AdditionalOrganizationType = Literal["free_text", "additional_income"]
AdditionalOrganizationRole = Literal["owner", "participant"]

Money = Annotated[
    Decimal,
    PlainSerializer(
        lambda value: f"{value:.2f}",
        return_type=str,
        when_used="json",
    ),
]


class AdditionalOrganizationUserBrief(BaseModel):
    id: uuid.UUID
    name: str
    avatar_url: str | None = None

    model_config = {"from_attributes": True}


class AdditionalOrganizationCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    type: AdditionalOrganizationType
    content: str | None = Field(default=None, max_length=20000)
    total_amount: Decimal | None = Field(
        default=None, gt=0, max_digits=12, decimal_places=2
    )
    show_observations: bool = False

    @field_validator("title")
    @classmethod
    def validate_title(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Informe um título")
        return value

    @field_validator("content")
    @classmethod
    def normalize_content(cls, value: str | None) -> str | None:
        if value is None:
            return None
        return value if value.strip() else None

    @model_validator(mode="after")
    def validate_type_fields(self) -> "AdditionalOrganizationCreate":
        if self.type == "free_text":
            if self.total_amount is not None:
                raise ValueError("Texto Livre não aceita valor")
            self.show_observations = False
        else:
            if self.total_amount is None:
                raise ValueError("Informe o valor da receita adicional")
            if self.content is not None:
                raise ValueError("Receita Adicional não aceita texto livre")
        return self


class AdditionalOrganizationUpdate(BaseModel):
    title: str | None = Field(default=None, max_length=255)
    total_amount: Decimal | None = Field(
        default=None, gt=0, max_digits=12, decimal_places=2
    )
    show_observations: bool | None = None

    @field_validator("title")
    @classmethod
    def validate_title(cls, value: str | None) -> str | None:
        if value is None:
            return None
        value = value.strip()
        if not value:
            raise ValueError("Informe um título")
        return value


class AdditionalOrganizationContentUpdate(BaseModel):
    content: str | None = Field(default=None, max_length=20000)
    expected_version: int = Field(..., ge=1)

    @field_validator("content")
    @classmethod
    def normalize_content(cls, value: str | None) -> str | None:
        if value is None:
            return None
        return value if value.strip() else None


class AdditionalOrganizationItemCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    amount: Decimal = Field(..., gt=0, max_digits=12, decimal_places=2)
    observation: str | None = Field(default=None, max_length=500)
    position: int | None = Field(default=None, ge=0)

    @field_validator("name")
    @classmethod
    def validate_name(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Informe o nome da linha")
        return value

    @field_validator("observation")
    @classmethod
    def normalize_observation(cls, value: str | None) -> str | None:
        if value is None:
            return None
        value = value.strip()
        return value or None


class AdditionalOrganizationItemUpdate(BaseModel):
    name: str | None = Field(default=None, max_length=255)
    amount: Decimal | None = Field(
        default=None, gt=0, max_digits=12, decimal_places=2
    )
    observation: str | None = Field(default=None, max_length=500)
    expected_updated_at: datetime | None = None

    @field_validator("name")
    @classmethod
    def validate_name(cls, value: str | None) -> str | None:
        if value is None:
            return None
        value = value.strip()
        if not value:
            raise ValueError("Informe o nome da linha")
        return value

    @field_validator("observation")
    @classmethod
    def normalize_observation(cls, value: str | None) -> str | None:
        if value is None:
            return None
        value = value.strip()
        return value or None


class AdditionalOrganizationItemResponse(BaseModel):
    id: uuid.UUID
    organization_id: uuid.UUID
    name: str
    amount: Money
    observation: str | None
    position: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class AdditionalOrganizationSummaryResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    title: str
    type: AdditionalOrganizationType
    total_amount: Money | None
    content_preview: str | None = None
    show_observations: bool
    content_version: int = 1
    item_count: int = 0
    allocated_amount: Money
    remaining_amount: Money | None
    role: AdditionalOrganizationRole = "owner"
    owner: AdditionalOrganizationUserBrief
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class AdditionalOrganizationDetailResponse(
    AdditionalOrganizationSummaryResponse
):
    content: str | None = None
    items: list[AdditionalOrganizationItemResponse] = Field(default_factory=list)
