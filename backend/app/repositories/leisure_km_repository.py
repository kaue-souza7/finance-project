import uuid
from decimal import Decimal

from sqlalchemy.orm import Session

from app.models.leisure_km import LeisureKmCalculation
from app.schemas.leisure_km import LeisureKmCreate


class LeisureKmRepository:
    @staticmethod
    def get_by_leisure(
        db: Session, leisure_id: uuid.UUID
    ) -> LeisureKmCalculation | None:
        return (
            db.query(LeisureKmCalculation)
            .filter(LeisureKmCalculation.leisure_id == leisure_id)
            .first()
        )

    @staticmethod
    def upsert(
        db: Session, leisure_id: uuid.UUID, created_by: uuid.UUID, data: LeisureKmCreate, total_cost: Decimal
    ) -> LeisureKmCalculation:
        existing = (
            db.query(LeisureKmCalculation)
            .filter(LeisureKmCalculation.leisure_id == leisure_id)
            .first()
        )

        if existing:
            existing.origin = data.origin
            existing.destination = data.destination
            existing.distance_km = data.distance_km
            existing.fuel_price = data.fuel_price
            existing.car_consumption = data.car_consumption
            existing.tolls = data.tolls
            existing.total_cost = total_cost
            existing.estimated_time = data.estimated_time
            db.flush()
            db.refresh(existing)
            return existing

        km_calc = LeisureKmCalculation(
            leisure_id=leisure_id,
            created_by=created_by,
            origin=data.origin,
            destination=data.destination,
            distance_km=data.distance_km,
            fuel_price=data.fuel_price,
            car_consumption=data.car_consumption,
            tolls=data.tolls,
            total_cost=total_cost,
            estimated_time=data.estimated_time,
        )
        db.add(km_calc)
        db.flush()
        db.refresh(km_calc)
        return km_calc

    @staticmethod
    def delete(db: Session, km_calc: LeisureKmCalculation) -> None:
        db.delete(km_calc)
        db.flush()
