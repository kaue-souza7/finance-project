import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class InviteSendRequest(BaseModel):
    email: str = Field(..., max_length=255)


class InviteResponse(BaseModel):
    id: uuid.UUID
    sender_id: uuid.UUID
    sender_name: str | None = None
    sender_avatar_url: str | None = None
    status: str
    created_at: datetime
    responded_at: datetime | None = None
    chat_id: uuid.UUID | None = None

    model_config = {"from_attributes": True}
