import uuid
from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, Field


class PlanningCreate(BaseModel):
    month: int = Field(..., ge=1, le=12)
    year: int = Field(..., ge=2020, le=2100)
    expected_revenue: Decimal = Field(default=0, ge=0, decimal_places=2)
    expected_expenses: Decimal = Field(default=0, ge=0, decimal_places=2)
    planned_investment: Decimal = Field(default=0, ge=0, decimal_places=2)


class PlanningUpdate(BaseModel):
    expected_revenue: Decimal | None = Field(default=None, ge=0, decimal_places=2)
    expected_expenses: Decimal | None = Field(default=None, ge=0, decimal_places=2)
    planned_investment: Decimal | None = Field(default=None, ge=0, decimal_places=2)


class PlanningResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    month: int
    year: int
    expected_revenue: Decimal
    expected_expenses: Decimal
    planned_investment: Decimal
    remaining_balance: Decimal
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
