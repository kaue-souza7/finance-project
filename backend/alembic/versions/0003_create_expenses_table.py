"""create expenses table

Revision ID: 0003
Revises: 0002
Create Date: 2026-05-25
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0003"
down_revision: Union[str, None] = "0002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "expenses",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("planning_id", sa.UUID(), nullable=False),
        sa.Column("category", sa.String(100), nullable=False),
        sa.Column("description", sa.String(255), nullable=False),
        sa.Column("amount", sa.Numeric(12, 2), nullable=False),
        sa.Column("recurrence", sa.String(20), nullable=False, server_default=sa.text("'once'")),
        sa.Column("due_date", sa.Date(), nullable=False),
        sa.Column("paid", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(
            ["planning_id"], ["plannings.id"], ondelete="CASCADE"
        ),
    )
    op.create_index(
        op.f("ix_expenses_planning_id"), "expenses", ["planning_id"]
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_expenses_planning_id"), table_name="expenses")
    op.drop_table("expenses")
