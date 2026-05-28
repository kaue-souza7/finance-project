import uuid

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.leisure_expense import LeisureExpense
from app.repositories.expense_repository import ExpenseRepository
from app.repositories.leisure_expense_repository import LeisureExpenseRepository
from app.repositories.leisure_repository import LeisureRepository
from app.repositories.planning_repository import PlanningRepository
from app.schemas.expense import ExpenseCreate
from app.schemas.leisure_expense import (
    LeisureExpenseCreate,
    LeisureExpenseResponse,
    LeisureExpenseUpdate,
)
from app.schemas.planning import PlanningCreate


class LeisureExpenseService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = LeisureExpenseRepository()
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

    def _to_response(
        self, expense: LeisureExpense
    ) -> LeisureExpenseResponse:
        return LeisureExpenseResponse.model_validate(expense)

    def list_by_leisure(
        self, leisure_id: str, user_id: str
    ) -> list[LeisureExpenseResponse]:
        self._assert_can_access(leisure_id, user_id)
        expenses = self.repo.list_by_leisure(
            self.db, uuid.UUID(leisure_id)
        )
        return [self._to_response(e) for e in expenses]

    def create(
        self, leisure_id: str, user_id: str, data: LeisureExpenseCreate
    ) -> LeisureExpenseResponse:
        lid = self._assert_can_access(leisure_id, user_id)
        uid = uuid.UUID(user_id)

        try:
            expense = self.repo.create(self.db, lid, uid, data)

            if data.add_to_planning:
                event = self.leisure_repo.get_by_id(self.db, lid)
                if event:
                    month = event.date.month
                    year = event.date.year

                    planning = PlanningRepository.get_by_user_and_month(
                        self.db, uid, month, year
                    )
                    if not planning:
                        plan_data = PlanningCreate(
                            month=month,
                            year=year,
                        )
                        planning = PlanningRepository.create(
                            self.db, uid, plan_data
                        )

                    expense_data = ExpenseCreate(
                        planning_id=str(planning.id),
                        category=data.category,
                        description=data.title,
                        amount=data.amount,
                        due_date=event.date,
                        paid=data.paid,
                    )
                    planning_expense = ExpenseRepository.create(
                        self.db, expense_data
                    )

                    expense.planning_expense_id = planning_expense.id

            self.db.commit()
            self.db.refresh(expense)
        except Exception:
            self.db.rollback()
            raise

        return self._to_response(expense)

    def update(
        self, leisure_id: str, expense_id: str, user_id: str, data: LeisureExpenseUpdate
    ) -> LeisureExpenseResponse:
        self._assert_can_access(leisure_id, user_id)
        expense = self.repo.get_by_id(self.db, uuid.UUID(expense_id))
        if not expense or str(expense.leisure_id) != leisure_id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)
        expense = self.repo.update(self.db, expense, data)
        self.db.commit()
        return self._to_response(expense)

    def delete(
        self, leisure_id: str, expense_id: str, user_id: str
    ) -> None:
        self._assert_can_access(leisure_id, user_id)
        expense = self.repo.get_by_id(self.db, uuid.UUID(expense_id))
        if not expense or str(expense.leisure_id) != leisure_id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)

        try:
            if expense.planning_expense_id:
                planning_expense = ExpenseRepository.get_by_id(
                    self.db, expense.planning_expense_id
                )
                if planning_expense:
                    ExpenseRepository.delete(self.db, planning_expense)

            self.repo.delete(self.db, expense)
            self.db.commit()
        except Exception:
            self.db.rollback()
            raise
