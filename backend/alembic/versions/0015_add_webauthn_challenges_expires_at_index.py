"""add expires_at index to webauthn_challenges

Revision ID: 0015
Revises: 0014
Create Date: 2026-07-02
"""
from typing import Sequence, Union

from alembic import op

revision: str = "0015"
down_revision: Union[str, None] = "0014"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_index(
        "idx_webauthn_challenges_expires_at",
        "webauthn_challenges",
        ["expires_at"],
    )


def downgrade() -> None:
    op.drop_index("idx_webauthn_challenges_expires_at")
