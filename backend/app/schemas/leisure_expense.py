import uuid
from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, Field


class LeisureExpenseCreate(BaseModel):
    title: str = Field(..., max_length=255)
    category: str = Field(..., max_length=100)
    amount: Decimal = Field(..., gt=0, decimal_places=2)
    description: str | None = Field(default=None)
    paid: bool = False
    add_to_planning: bool = False


class LeisureExpenseUpdate(BaseModel):
    title: str | None = Field(default=None, max_length=255)
    category: str | None = Field(default=None, max_length=100)
    amount: Decimal | None = Field(default=None, gt=0, decimal_places=2)
    description: str | None = Field(default=None)
    paid: bool | None = None


class LeisureExpenseResponse(BaseModel):
    id: uuid.UUID
    leisure_id: uuid.UUID
    title: str
    category: str
    amount: Decimal
    description: str | None
    paid: bool
    add_to_planning: bool
    planning_expense_id: uuid.UUID | None
    created_by: uuid.UUID
    created_at: datetime

    model_config = {"from_attributes": True}
