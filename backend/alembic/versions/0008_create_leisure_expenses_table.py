"""create leisure_expenses table

Revision ID: 0008
Revises: 0007
Create Date: 2026-05-27
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0008"
down_revision: Union[str, None] = "0007"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "leisure_expenses",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("leisure_id", sa.UUID(), nullable=False),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("category", sa.String(100), nullable=False),
        sa.Column("amount", sa.Numeric(12, 2), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("paid", sa.Boolean(), nullable=False),
        sa.Column("add_to_planning", sa.Boolean(), nullable=False),
        sa.Column("planning_expense_id", sa.UUID(), nullable=True),
        sa.Column("created_by", sa.UUID(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(
            ["leisure_id"], ["leisure_events.id"], ondelete="CASCADE"
        ),
        sa.ForeignKeyConstraint(
            ["planning_expense_id"], ["expenses.id"], ondelete="SET NULL"
        ),
        sa.ForeignKeyConstraint(
            ["created_by"], ["users.id"], ondelete="CASCADE"
        ),
    )
    op.create_index(
        op.f("ix_leisure_expenses_leisure_id"),
        "leisure_expenses",
        ["leisure_id"],
    )


def downgrade() -> None:
    op.drop_index(
        op.f("ix_leisure_expenses_leisure_id"), table_name="leisure_expenses"
    )
    op.drop_table("leisure_expenses")
