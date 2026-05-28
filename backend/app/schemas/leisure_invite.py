import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class InviteSendRequest(BaseModel):
    email: str = Field(..., max_length=255)


class InviteResponse(BaseModel):
    id: uuid.UUID
    leisure_id: uuid.UUID
    sender_id: uuid.UUID
    receiver_user_id: uuid.UUID
    status: str
    created_at: datetime
    responded_at: datetime | None
    leisure_title: str | None = None
    leisure_date: str | None = None
    sender_name: str | None = None
    sender_email: str | None = None
    receiver_name: str | None = None
    receiver_email: str | None = None

    model_config = {"from_attributes": True}


class LeisureParticipantResponse(BaseModel):
    id: uuid.UUID
    leisure_id: uuid.UUID
    user_id: uuid.UUID
    role: str
    created_at: datetime
    user_name: str | None = None
    user_email: str | None = None

    model_config = {"from_attributes": True}
