import uuid

from sqlalchemy.orm import Session

from app.models.leisure_expense import LeisureExpense
from app.schemas.leisure_expense import LeisureExpenseCreate, LeisureExpenseUpdate


class LeisureExpenseRepository:
    @staticmethod
    def list_by_leisure(
        db: Session, leisure_id: uuid.UUID
    ) -> list[LeisureExpense]:
        return (
            db.query(LeisureExpense)
            .filter(LeisureExpense.leisure_id == leisure_id)
            .order_by(LeisureExpense.created_at.desc())
            .all()
        )

    @staticmethod
    def get_by_id(
        db: Session, expense_id: uuid.UUID
    ) -> LeisureExpense | None:
        return (
            db.query(LeisureExpense)
            .filter(LeisureExpense.id == expense_id)
            .first()
        )

    @staticmethod
    def create(
        db: Session, leisure_id: uuid.UUID, created_by: uuid.UUID, data: LeisureExpenseCreate
    ) -> LeisureExpense:
        expense = LeisureExpense(
            leisure_id=leisure_id,
            created_by=created_by,
            title=data.title,
            category=data.category,
            amount=data.amount,
            description=data.description,
            paid=data.paid,
            add_to_planning=data.add_to_planning,
        )
        db.add(expense)
        db.flush()
        db.refresh(expense)
        return expense

    @staticmethod
    def update(
        db: Session, expense: LeisureExpense, data: LeisureExpenseUpdate
    ) -> LeisureExpense:
        update_data = data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(expense, key, value)
        db.flush()
        db.refresh(expense)
        return expense

    @staticmethod
    def delete(db: Session, expense: LeisureExpense) -> None:
        db.delete(expense)
        db.flush()
