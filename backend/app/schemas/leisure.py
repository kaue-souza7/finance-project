import uuid
from datetime import date as date_type, datetime, time
from decimal import Decimal

from pydantic import BaseModel, Field


class LeisureCreate(BaseModel):
    title: str = Field(..., max_length=255)
    description: str | None = Field(default=None)
    date: date_type
    start_time: time | None = Field(default=None)
    end_time: time | None = Field(default=None)
    budget: Decimal | None = Field(default=None, max_digits=12, decimal_places=2)
    status: str = Field(default="planning")
    location_name: str | None = Field(default=None, max_length=255)
    location_address: str | None = Field(default=None, max_length=500)
    latitude: float | None = Field(default=None)
    longitude: float | None = Field(default=None)


class LeisureUpdate(BaseModel):
    title: str | None = Field(default=None, max_length=255)
    description: str | None = Field(default=None)
    date: date_type | None = Field(default=None)
    start_time: time | None = Field(default=None)
    end_time: time | None = Field(default=None)
    budget: Decimal | None = Field(default=None, max_digits=12, decimal_places=2)
    status: str | None = Field(default=None)
    location_name: str | None = Field(default=None, max_length=255)
    location_address: str | None = Field(default=None, max_length=500)
    latitude: float | None = Field(default=None)
    longitude: float | None = Field(default=None)


class LeisureResponse(BaseModel):
    id: uuid.UUID
    owner_id: uuid.UUID
    title: str
    description: str | None
    date: date_type
    start_time: time | None
    end_time: time | None
    budget: Decimal | None
    status: str
    location_name: str | None
    location_address: str | None
    latitude: float | None
    longitude: float | None
    created_at: datetime
    participant_count: int = 0

    model_config = {"from_attributes": True}
