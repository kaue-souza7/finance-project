import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class MessageSend(BaseModel):
    content: str = Field(..., min_length=1, max_length=2000)


class MessageResponse(BaseModel):
    id: uuid.UUID
    chat_id: uuid.UUID
    sender_id: uuid.UUID
    content: str
    created_at: datetime

    model_config = {"from_attributes": True}


class MessagePageResponse(BaseModel):
    messages: list[MessageResponse]
    next_cursor: str | None = None
    has_more: bool = False
