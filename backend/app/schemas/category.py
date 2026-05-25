import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class CategoryCreate(BaseModel):
    name: str = Field(..., max_length=100)
    color: str = Field(..., pattern=r"^#[0-9a-fA-F]{6}$")
    icon: str = Field(..., max_length=50)


class CategoryUpdate(BaseModel):
    name: str | None = Field(default=None, max_length=100)
    color: str | None = Field(default=None, pattern=r"^#[0-9a-fA-F]{6}$")
    icon: str | None = Field(default=None, max_length=50)


class CategoryResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    name: str
    color: str
    icon: str
    created_at: datetime

    model_config = {"from_attributes": True}
