import uuid
from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, Field


class ExpenseCreate(BaseModel):
    planning_id: str
    category_id: str | None = None
    category: str = Field(..., max_length=100)
    description: str = Field(..., max_length=255)
    amount: Decimal = Field(..., gt=0, decimal_places=2)
    recurrence: str = Field(default="once", pattern=r"^(once|monthly|yearly)$")
    due_date: date
    paid: bool = False


class ExpenseUpdate(BaseModel):
    category_id: str | None = None
    category: str | None = Field(default=None, max_length=100)
    description: str | None = Field(default=None, max_length=255)
    amount: Decimal | None = Field(default=None, gt=0, decimal_places=2)
    recurrence: str | None = Field(
        default=None, pattern=r"^(once|monthly|yearly)$"
    )
    due_date: date | None = None
    paid: bool | None = None


class ExpenseResponse(BaseModel):
    id: uuid.UUID
    planning_id: uuid.UUID
    category_id: uuid.UUID | None = None
    category: str
    category_name: str | None = None
    category_color: str | None = None
    category_icon: str | None = None
    description: str
    amount: Decimal
    recurrence: str
    due_date: date
    paid: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
