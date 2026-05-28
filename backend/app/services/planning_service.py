import uuid

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.repositories.planning_repository import PlanningRepository
from app.schemas.planning import (
    PlanningCreate,
    PlanningResponse,
    PlanningUpdate,
)


class PlanningService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = PlanningRepository()

    def _to_response(self, plan) -> PlanningResponse:
        remaining = (
            plan.expected_revenue
            - plan.expected_expenses
            - plan.planned_investment
        )
        return PlanningResponse(
            id=plan.id,
            user_id=plan.user_id,
            month=plan.month,
            year=plan.year,
            expected_revenue=plan.expected_revenue,
            expected_expenses=plan.expected_expenses,
            planned_investment=plan.planned_investment,
            remaining_balance=remaining,
            created_at=plan.created_at,
            updated_at=plan.updated_at,
        )

    def create(self, user_id: str, data: PlanningCreate) -> PlanningResponse:
        uid = uuid.UUID(user_id)
        existing = self.repo.get_by_user_and_month(self.db, uid, data.month, data.year)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Planning already exists for this month and year",
            )
        plan = self.repo.create(self.db, uid, data)
        self.db.commit()
        return self._to_response(plan)

    def list_by_user(self, user_id: str) -> list[PlanningResponse]:
        uid = uuid.UUID(user_id)
        plans = self.repo.list_by_user(self.db, uid)
        return [self._to_response(p) for p in plans]

    def get_by_id(self, planning_id: str, user_id: str) -> PlanningResponse:
        plan = self.repo.get_by_id(self.db, uuid.UUID(planning_id))
        if not plan or str(plan.user_id) != user_id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)
        return self._to_response(plan)

    def get_by_month(
        self, user_id: str, month: int, year: int
    ) -> PlanningResponse | None:
        uid = uuid.UUID(user_id)
        plan = self.repo.get_by_user_and_month(self.db, uid, month, year)
        if not plan:
            return None
        return self._to_response(plan)

    def copy_from_previous(
        self, user_id: str, target_month: int, target_year: int
    ) -> PlanningResponse:
        uid = uuid.UUID(user_id)

        prev_month = target_month - 1
        prev_year = target_year
        if prev_month == 0:
            prev_month = 12
            prev_year -= 1

        prev = self.repo.get_by_user_and_month(self.db, uid, prev_month, prev_year)
        if not prev:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No planning found for the previous month",
            )

        existing = self.repo.get_by_user_and_month(
            self.db, uid, target_month, target_year
        )
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="A planning already exists for this month",
            )

        data = PlanningCreate(
            month=target_month,
            year=target_year,
            expected_revenue=prev.expected_revenue,
            expected_expenses=prev.expected_expenses,
            planned_investment=prev.planned_investment,
        )
        plan = self.repo.create(self.db, uid, data)
        self.db.commit()
        return self._to_response(plan)

    def update(
        self, planning_id: str, user_id: str, data: PlanningUpdate
    ) -> PlanningResponse:
        plan = self.repo.get_by_id(self.db, uuid.UUID(planning_id))
        if not plan or str(plan.user_id) != user_id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)
        plan = self.repo.update(self.db, plan, data)
        self.db.commit()
        return self._to_response(plan)

    def delete(self, planning_id: str, user_id: str) -> None:
        plan = self.repo.get_by_id(self.db, uuid.UUID(planning_id))
        if not plan or str(plan.user_id) != user_id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)
        self.repo.delete(self.db, plan)
        self.db.commit()
