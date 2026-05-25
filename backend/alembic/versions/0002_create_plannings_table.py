"""create plannings table

Revision ID: 0002
Revises: 0001
Create Date: 2026-05-25
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0002"
down_revision: Union[str, None] = "0001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "plannings",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("user_id", sa.UUID(), nullable=False),
        sa.Column("month", sa.Integer(), nullable=False),
        sa.Column("year", sa.Integer(), nullable=False),
        sa.Column("expected_revenue", sa.Numeric(12, 2), nullable=False, server_default=sa.text("0")),
        sa.Column("expected_expenses", sa.Numeric(12, 2), nullable=False, server_default=sa.text("0")),
        sa.Column("planned_investment", sa.Numeric(12, 2), nullable=False, server_default=sa.text("0")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.UniqueConstraint("user_id", "month", "year", name="uq_user_month_year"),
    )
    op.create_index(op.f("ix_plannings_user_id"), "plannings", ["user_id"])


def downgrade() -> None:
    op.drop_index(op.f("ix_plannings_user_id"), table_name="plannings")
    op.drop_table("plannings")
