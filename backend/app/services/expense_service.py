import calendar
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
        self.db.commit()
        return self._to_response(expense)

    def update(
        self, expense_id: str, data: ExpenseUpdate, user_id: str
    ) -> ExpenseResponse:
        expense = self.repo.get_by_id(self.db, uuid.UUID(expense_id))
        if not expense:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)
        self._assert_planning_owner(str(expense.planning_id), user_id)
        expense = self.repo.update(self.db, expense, data)
        self.db.commit()
        return self._to_response(expense)

    def delete(self, expense_id: str, user_id: str) -> None:
        expense = self.repo.get_by_id(self.db, uuid.UUID(expense_id))
        if not expense:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)
        self._assert_planning_owner(str(expense.planning_id), user_id)
        self.repo.delete(self.db, expense)
        self.db.commit()

    def copy_from_previous(
        self, user_id: str, target_month: int, target_year: int
    ) -> list[ExpenseResponse]:
        uid = uuid.UUID(user_id)

        prev_month = target_month - 1
        prev_year = target_year
        if prev_month == 0:
            prev_month = 12
            prev_year -= 1

        prev_plan = PlanningRepository.get_by_user_and_month(
            self.db, uid, prev_month, prev_year
        )
        if not prev_plan:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No planning found for the previous month",
            )

        target_plan = PlanningRepository.get_by_user_and_month(
            self.db, uid, target_month, target_year
        )
        if not target_plan:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No planning found for the target month",
            )

        prev_expenses = self.repo.list_by_planning(self.db, prev_plan.id)
        if not prev_expenses:
            return []

        expenses_data = []
        for exp in prev_expenses:
            original_day = exp.due_date.day
            last_day = calendar.monthrange(target_year, target_month)[1]
            new_day = min(original_day, last_day)
            new_due_date = exp.due_date.replace(
                year=target_year, month=target_month, day=new_day
            )
            expenses_data.append({
                "planning_id": target_plan.id,
                "category_id": exp.category_id,
                "category": exp.category,
                "description": exp.description,
                "amount": exp.amount,
                "recurrence": exp.recurrence,
                "due_date": new_due_date,
                "paid": False,
            })

        created = self.repo.bulk_create(self.db, expenses_data)
        self.db.commit()
        return [self._to_response(e) for e in created]
