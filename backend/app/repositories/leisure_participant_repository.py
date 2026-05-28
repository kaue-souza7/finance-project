import uuid

from sqlalchemy.orm import Session

from app.models.leisure_participant import LeisureParticipant


class LeisureParticipantRepository:
    @staticmethod
    def list_by_leisure(
        db: Session, leisure_id: uuid.UUID
    ) -> list[LeisureParticipant]:
        return (
            db.query(LeisureParticipant)
            .filter(LeisureParticipant.leisure_id == leisure_id)
            .order_by(LeisureParticipant.created_at.asc())
            .all()
        )

    @staticmethod
    def get_by_leisure_and_user(
        db: Session, leisure_id: uuid.UUID, user_id: uuid.UUID
    ) -> LeisureParticipant | None:
        return (
            db.query(LeisureParticipant)
            .filter(
                LeisureParticipant.leisure_id == leisure_id,
                LeisureParticipant.user_id == user_id,
            )
            .first()
        )

    @staticmethod
    def create(
        db: Session, leisure_id: uuid.UUID, user_id: uuid.UUID, role: str = "participant"
    ) -> LeisureParticipant:
        participant = LeisureParticipant(
            leisure_id=leisure_id,
            user_id=user_id,
            role=role,
        )
        db.add(participant)
        db.flush()
        return participant

    @staticmethod
    def delete(db: Session, participant: LeisureParticipant) -> None:
        db.delete(participant)
        db.commit()
