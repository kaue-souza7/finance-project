import uuid
from decimal import Decimal

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.repositories.leisure_km_repository import LeisureKmRepository
from app.repositories.leisure_repository import LeisureRepository
from app.schemas.leisure_km import LeisureKmCreate, LeisureKmResponse


class LeisureKmService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = LeisureKmRepository()
        self.leisure_repo = LeisureRepository()

    def _assert_can_access(
        self, leisure_id: str, user_id: str
    ) -> uuid.UUID:
        lid = uuid.UUID(leisure_id)
        uid = uuid.UUID(user_id)
        if not LeisureRepository.is_owner_or_participant(self.db, lid, uid):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Leisure event not found",
            )
        return lid

    def _to_response(self, km_calc) -> LeisureKmResponse:
        resp = LeisureKmResponse.model_validate(km_calc)
        fuel_cost = (
            km_calc.distance_km / km_calc.car_consumption * km_calc.fuel_price
        )
        resp.total_cost = fuel_cost + km_calc.tolls
        resp.fuel_cost = fuel_cost
        return resp

    def get_by_leisure(
        self, leisure_id: str, user_id: str
    ) -> LeisureKmResponse | None:
        lid = self._assert_can_access(leisure_id, user_id)
        km_calc = self.repo.get_by_leisure(self.db, lid)
        if not km_calc:
            return None
        return self._to_response(km_calc)

    def upsert(
        self, leisure_id: str, user_id: str, data: LeisureKmCreate
    ) -> LeisureKmResponse:
        lid = self._assert_can_access(leisure_id, user_id)
        uid = uuid.UUID(user_id)

        fuel_cost = data.distance_km / data.car_consumption * data.fuel_price
        total_cost = fuel_cost + data.tolls

        km_calc = self.repo.upsert(self.db, lid, uid, data, total_cost)
        self.db.commit()
        return self._to_response(km_calc)

    def delete(self, leisure_id: str, user_id: str) -> None:
        lid = self._assert_can_access(leisure_id, user_id)
        km_calc = self.repo.get_by_leisure(self.db, lid)
        if not km_calc:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)
        self.repo.delete(self.db, km_calc)
        self.db.commit()
