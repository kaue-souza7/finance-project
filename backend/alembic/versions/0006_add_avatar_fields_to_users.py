"""add avatar fields to users

Revision ID: 0006
Revises: 0005
Create Date: 2026-05-26
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0006"
down_revision: Union[str, None] = "0005"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column("avatar_url", sa.String(512), nullable=True),
    )
    op.add_column(
        "users",
        sa.Column("avatar_public_id", sa.String(255), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("users", "avatar_public_id")
    op.drop_column("users", "avatar_url")
