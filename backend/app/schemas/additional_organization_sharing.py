import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, EmailStr, Field

from app.schemas.additional_organization import (
    AdditionalOrganizationRole,
    AdditionalOrganizationType,
)

AdditionalOrganizationInviteStatus = Literal[
    "pending", "accepted", "declined", "cancelled", "expired"
]
AdditionalOrganizationEmailStatus = Literal[
    "queued", "sent", "failed", "unavailable"
]


class AdditionalOrganizationInviteCreate(BaseModel):
    email: EmailStr = Field(..., max_length=255)


class AdditionalOrganizationInviteResolve(BaseModel):
    token: str = Field(..., min_length=16, max_length=512)


class AdditionalOrganizationParticipantResponse(BaseModel):
    membership_id: uuid.UUID | None = None
    user_id: uuid.UUID
    name: str
    email: str
    avatar_url: str | None = None
    role: AdditionalOrganizationRole
    joined_at: datetime | None = None


class AdditionalOrganizationInviteResponse(BaseModel):
    id: uuid.UUID
    organization_id: uuid.UUID
    organization_title: str
    sender_id: uuid.UUID
    sender_name: str
    sender_email: str
    invited_email: str
    receiver_user_id: uuid.UUID | None = None
    status: AdditionalOrganizationInviteStatus
    email_status: AdditionalOrganizationEmailStatus
    created_at: datetime
    expires_at: datetime
    last_sent_at: datetime
    responded_at: datetime | None = None


class AdditionalOrganizationInvitePreviewResponse(BaseModel):
    invite_id: uuid.UUID
    organization_id: uuid.UUID
    title: str
    type: AdditionalOrganizationType
    owner_name: str
    expires_at: datetime
    status: AdditionalOrganizationInviteStatus
