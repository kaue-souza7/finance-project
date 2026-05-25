import uuid

from sqlalchemy.orm import Session

from app.models.planning import Planning
from app.schemas.planning import PlanningCreate, PlanningUpdate


class PlanningRepository:
    @staticmethod
    def get_by_id(db: Session, planning_id: uuid.UUID) -> Planning | None:
        return db.query(Planning).filter(Planning.id == planning_id).first()

    @staticmethod
    def get_by_user_and_month(
        db: Session, user_id: uuid.UUID, month: int, year: int
    ) -> Planning | None:
        return (
            db.query(Planning)
            .filter(
                Planning.user_id == user_id,
                Planning.month == month,
                Planning.year == year,
            )
            .first()
        )

    @staticmethod
    def list_by_user(db: Session, user_id: uuid.UUID) -> list[Planning]:
        return (
            db.query(Planning)
            .filter(Planning.user_id == user_id)
            .order_by(Planning.year.desc(), Planning.month.desc())
            .all()
        )

    @staticmethod
    def create(db: Session, user_id: uuid.UUID, data: PlanningCreate) -> Planning:
        plan = Planning(
            user_id=user_id,
            month=data.month,
            year=data.year,
            expected_revenue=data.expected_revenue,
            expected_expenses=data.expected_expenses,
            planned_investment=data.planned_investment,
        )
        db.add(plan)
        db.commit()
        db.refresh(plan)
        return plan

    @staticmethod
    def update(db: Session, plan: Planning, data: PlanningUpdate) -> Planning:
        update_data = data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(plan, key, value)
        db.commit()
        db.refresh(plan)
        return plan

    @staticmethod
    def delete(db: Session, plan: Planning) -> None:
        db.delete(plan)
        db.commit()
