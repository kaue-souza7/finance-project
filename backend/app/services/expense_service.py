import uuid

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.expense import Expense
from app.repositories.expense_repository import ExpenseRepository
from app.repositories.planning_repository import PlanningRepository
from app.schemas.expense import ExpenseCreate, ExpenseResponse, ExpenseUpdate


class ExpenseService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = ExpenseRepository()

    def _assert_planning_owner(
        self, planning_id: str, user_id: str
    ) -> uuid.UUID:
        pid = uuid.UUID(planning_id)
        plan = PlanningRepository.get_by_id(self.db, pid)
        if not plan or str(plan.user_id) != user_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Planning not found",
            )
        return pid

    def _to_response(self, expense: Expense) -> ExpenseResponse:
        resp = ExpenseResponse.model_validate(expense)
        if cat := getattr(expense, "category_rel", None):
            resp.category_name = cat.name
            resp.category_color = cat.color
            resp.category_icon = cat.icon
        return resp

    def list_by_planning(
        self, planning_id: str, user_id: str
    ) -> list[ExpenseResponse]:
        pid = self._assert_planning_owner(planning_id, user_id)
        expenses = self.repo.list_by_planning(self.db, pid)
        return [self._to_response(e) for e in expenses]

    def create(self, data: ExpenseCreate, user_id: str) -> ExpenseResponse:
        self._assert_planning_owner(data.planning_id, user_id)
        expense = self.repo.create(self.db, data)
        return self._to_response(expense)

    def update(
        self, expense_id: str, data: ExpenseUpdate, user_id: str
    ) -> ExpenseResponse:
        expense = self.repo.get_by_id(self.db, uuid.UUID(expense_id))
        if not expense:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)
        self._assert_planning_owner(str(expense.planning_id), user_id)
        expense = self.repo.update(self.db, expense, data)
        return self._to_response(expense)

    def delete(self, expense_id: str, user_id: str) -> None:
        expense = self.repo.get_by_id(self.db, uuid.UUID(expense_id))
        if not expense:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)
        self._assert_planning_owner(str(expense.planning_id), user_id)
        self.repo.delete(self.db, expense)
