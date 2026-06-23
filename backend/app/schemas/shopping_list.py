import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class UserBrief(BaseModel):
    id: uuid.UUID
    name: str
    email: str

    model_config = {"from_attributes": True}


class ShoppingListCreate(BaseModel):
    title: str = Field(..., max_length=255)
    color: str = Field(..., pattern=r"^#[0-9a-fA-F]{6}$")
    icon: str = Field(..., max_length=50)


class ShoppingListUpdate(BaseModel):
    title: str | None = Field(default=None, max_length=255)
    color: str | None = Field(default=None, pattern=r"^#[0-9a-fA-F]{6}$")
    icon: str | None = Field(default=None, max_length=50)


class ShoppingListItemCreate(BaseModel):
    name: str = Field(..., max_length=255)
    quantity: str | None = Field(default=None, max_length=50)
    order: int = 0


class ShoppingListItemUpdate(BaseModel):
    name: str | None = Field(default=None, max_length=255)
    quantity: str | None = Field(default=None, max_length=50)
    order: int | None = None


class ShoppingListItemToggle(BaseModel):
    checked: bool


class ShoppingListItemResponse(BaseModel):
    id: uuid.UUID
    shopping_list_id: uuid.UUID
    name: str
    quantity: str | None
    checked: bool
    order: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ShoppingListResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    title: str
    color: str
    icon: str
    completed_at: datetime | None
    item_count: int = 0
    checked_count: int = 0
    role: str = "owner"
    shared_by: UserBrief | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ShoppingListDetailResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    title: str
    color: str
    icon: str
    completed_at: datetime | None
    item_count: int = 0
    checked_count: int = 0
    items: list[ShoppingListItemResponse]
    role: str = "owner"
    shared_by: UserBrief | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class InviteSendRequest(BaseModel):
    user_email: str = Field(..., max_length=255)
    role: str = Field(..., pattern=r"^(editor|viewer)$")


class ShoppingListInviteResponse(BaseModel):
    id: uuid.UUID
    shopping_list_id: uuid.UUID
    sender_id: uuid.UUID
    receiver_user_id: uuid.UUID
    role: str
    status: str
    created_at: datetime
    responded_at: datetime | None
    shopping_list_title: str | None = None
    sender_name: str | None = None
    sender_email: str | None = None
    receiver_name: str | None = None
    receiver_email: str | None = None

    model_config = {"from_attributes": True}


class ShareUpdateRequest(BaseModel):
    role: str = Field(..., pattern=r"^(editor|viewer)$")


class ShoppingListShareResponse(BaseModel):
    id: uuid.UUID
    shopping_list_id: uuid.UUID
    user_id: uuid.UUID
    role: str
    created_at: datetime
    created_by: uuid.UUID
    last_seen_at: datetime | None = None
    user_name: str | None = None
    user_email: str | None = None

    model_config = {"from_attributes": True}


class UserSearchResponse(BaseModel):
    id: uuid.UUID
    name: str
    email: str
    avatar_url: str | None = None

    model_config = {"from_attributes": True}
