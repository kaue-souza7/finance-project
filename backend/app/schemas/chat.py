import uuid
from datetime import datetime

from pydantic import BaseModel


class ChatParticipantResponse(BaseModel):
    user_id: uuid.UUID
    name: str
    avatar_url: str | None = None


class ChatResponse(BaseModel):
    id: uuid.UUID
    participant: ChatParticipantResponse | None = None
    last_message: str | None = None
    last_interaction_at: datetime | None = None
    created_at: datetime
