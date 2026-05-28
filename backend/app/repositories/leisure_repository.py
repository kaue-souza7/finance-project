import uuid

from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.models.leisure import LeisureEvent
from app.models.leisure_participant import LeisureParticipant
from app.schemas.leisure import LeisureCreate, LeisureUpdate


class LeisureRepository:
    @staticmethod
    def get_by_id(db: Session, event_id: uuid.UUID) -> LeisureEvent | None:
        return db.query(LeisureEvent).filter(LeisureEvent.id == event_id).first()

    @staticmethod
    def count_all_participants(
        db: Session, leisure_id: uuid.UUID
    ) -> int:
        participant_count = (
            db.query(LeisureParticipant)
            .filter(LeisureParticipant.leisure_id == leisure_id)
            .count()
        )
        return 1 + participant_count

    @staticmethod
    def is_owner_or_participant(
        db: Session, leisure_id: uuid.UUID, user_id: uuid.UUID
    ) -> bool:
        event = db.query(LeisureEvent).filter(LeisureEvent.id == leisure_id).first()
        if not event:
            return False
        if event.owner_id == user_id:
            return True
        return (
            db.query(LeisureParticipant)
            .filter(
                LeisureParticipant.leisure_id == leisure_id,
                LeisureParticipant.user_id == user_id,
            )
            .first()
            is not None
        )

    @staticmethod
    def get_all_by_user(db: Session, user_id: uuid.UUID) -> list[LeisureEvent]:
        return (
            db.query(LeisureEvent)
            .filter(
                or_(
                    LeisureEvent.owner_id == user_id,
                    db.query(LeisureParticipant)
                    .filter(
                        LeisureParticipant.leisure_id == LeisureEvent.id,
                        LeisureParticipant.user_id == user_id,
                    )
                    .exists(),
                )
            )
            .order_by(LeisureEvent.date.desc())
            .all()
        )

    @staticmethod
    def create(
        db: Session, owner_id: uuid.UUID, data: LeisureCreate
    ) -> LeisureEvent:
        event = LeisureEvent(
            owner_id=owner_id,
            title=data.title,
            description=data.description,
            date=data.date,
            start_time=data.start_time,
            end_time=data.end_time,
            budget=data.budget,
            status=data.status,
            location_name=data.location_name,
            location_address=data.location_address,
            latitude=data.latitude,
            longitude=data.longitude,
        )
        db.add(event)
        db.commit()
        db.refresh(event)
        return event

    @staticmethod
    def update(
        db: Session, event: LeisureEvent, data: LeisureUpdate
    ) -> LeisureEvent:
        update_data = data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(event, key, value)
        db.commit()
        db.refresh(event)
        return event

    @staticmethod
    def delete(db: Session, event: LeisureEvent) -> None:
        db.delete(event)
        db.commit()
