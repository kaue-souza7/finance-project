import uuid

from sqlalchemy.orm import Session

from app.models.expense import Expense
from app.schemas.expense import ExpenseCreate, ExpenseUpdate


class ExpenseRepository:
    @staticmethod
    def list_by_planning(db: Session, planning_id: uuid.UUID) -> list[Expense]:
        return (
            db.query(Expense)
            .filter(Expense.planning_id == planning_id)
            .order_by(Expense.due_date.asc())
            .all()
        )

    @staticmethod
    def get_by_id(db: Session, expense_id: uuid.UUID) -> Expense | None:
        return db.query(Expense).filter(Expense.id == expense_id).first()

    @staticmethod
    def create(db: Session, data: ExpenseCreate) -> Expense:
        expense = Expense(
            planning_id=uuid.UUID(data.planning_id),
            category_id=uuid.UUID(data.category_id) if data.category_id else None,
            category=data.category,
            description=data.description,
            amount=data.amount,
            recurrence=data.recurrence,
            due_date=data.due_date,
            paid=data.paid,
        )
        db.add(expense)
        db.commit()
        db.refresh(expense)
        return expense

    @staticmethod
    def update(db: Session, expense: Expense, data: ExpenseUpdate) -> Expense:
        update_data = data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(expense, key, value)
        db.commit()
        db.refresh(expense)
        return expense

    @staticmethod
    def delete(db: Session, expense: Expense) -> None:
        db.delete(expense)
        db.commit()

    @staticmethod
    def bulk_create(db: Session, expenses_data: list[dict]) -> list[Expense]:
        expenses = [Expense(**data) for data in expenses_data]
        db.add_all(expenses)
        db.commit()
        for expense in expenses:
            db.refresh(expense)
        return expenses
