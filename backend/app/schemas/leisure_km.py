import uuid
from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, Field


class LeisureKmCreate(BaseModel):
    origin: str = Field(..., max_length=255)
    destination: str = Field(..., max_length=255)
    distance_km: Decimal = Field(..., gt=0, decimal_places=2)
    fuel_price: Decimal = Field(..., gt=0, decimal_places=2)
    car_consumption: Decimal = Field(..., gt=0, decimal_places=2)
    tolls: Decimal = Field(default=0, ge=0, decimal_places=2)
    estimated_time: str | None = Field(default=None, max_length=50)


class LeisureKmResponse(BaseModel):
    id: uuid.UUID
    leisure_id: uuid.UUID
    origin: str
    destination: str
    distance_km: Decimal
    fuel_price: Decimal
    car_consumption: Decimal
    tolls: Decimal
    total_cost: Decimal
    fuel_cost: Decimal = Field(default=Decimal("0"))
    estimated_time: str | None
    created_by: uuid.UUID
    created_at: datetime

    model_config = {"from_attributes": True}
