import uuid
from datetime import datetime, timezone
from decimal import Decimal

from sqlalchemy import DateTime, ForeignKey, Numeric, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.session import Base


class LeisureKmCalculation(Base):
    __tablename__ = "leisure_km_calculations"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    leisure_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("leisure_events.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True,
    )
    origin: Mapped[str] = mapped_column(String(255), nullable=False)
    destination: Mapped[str] = mapped_column(String(255), nullable=False)
    distance_km: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    fuel_price: Mapped[Decimal] = mapped_column(Numeric(8, 2), nullable=False)
    car_consumption: Mapped[Decimal] = mapped_column(Numeric(8, 2), nullable=False)
    tolls: Mapped[Decimal] = mapped_column(
        Numeric(10, 2), nullable=False, default=0
    )
    total_cost: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    estimated_time: Mapped[str | None] = mapped_column(String(50), nullable=True)
    created_by: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    leisure = relationship("LeisureEvent", backref="km_calculation", uselist=False)
    creator = relationship("User")
