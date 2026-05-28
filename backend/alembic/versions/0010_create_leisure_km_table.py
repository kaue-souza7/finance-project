"""create leisure_km_calculations table

Revision ID: 0010
Revises: 0009
Create Date: 2026-05-27
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0010"
down_revision: Union[str, None] = "0009"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "leisure_km_calculations",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("leisure_id", sa.UUID(), nullable=False),
        sa.Column("origin", sa.String(255), nullable=False),
        sa.Column("destination", sa.String(255), nullable=False),
        sa.Column("distance_km", sa.Numeric(10, 2), nullable=False),
        sa.Column("fuel_price", sa.Numeric(8, 2), nullable=False),
        sa.Column("car_consumption", sa.Numeric(8, 2), nullable=False),
        sa.Column("tolls", sa.Numeric(10, 2), nullable=False, server_default="0"),
        sa.Column("total_cost", sa.Numeric(12, 2), nullable=False),
        sa.Column("estimated_time", sa.String(50), nullable=True),
        sa.Column("created_by", sa.UUID(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("leisure_id"),
        sa.ForeignKeyConstraint(
            ["leisure_id"], ["leisure_events.id"], ondelete="CASCADE"
        ),
        sa.ForeignKeyConstraint(
            ["created_by"], ["users.id"], ondelete="CASCADE"
        ),
    )
    op.create_index(
        op.f("ix_leisure_km_calculations_leisure_id"),
        "leisure_km_calculations",
        ["leisure_id"],
    )


def downgrade() -> None:
    op.drop_index(
        op.f("ix_leisure_km_calculations_leisure_id"),
        table_name="leisure_km_calculations",
    )
    op.drop_table("leisure_km_calculations")
