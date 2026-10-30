import uuid
from datetime import datetime, timedelta, timezone

from alembic.config import Config
from alembic.script import ScriptDirectory
from sqlalchemy.orm import Session

import app.models  # noqa: F401
from app.core.config import Settings
from app.database.session import Base
from app.models.user import User
from app.repositories.refresh_token_repository import RefreshTokenRepository


def test_all_auth_tables_are_registered_in_metadata():
    table_names = set(Base.metadata.tables)
    assert "refresh_tokens" in table_names
    assert "password_reset_tokens" in table_names


def test_alembic_head_contains_the_auth_migration():
    config = Config("alembic.ini")
    script = ScriptDirectory.from_config(config)
    assert script.get_current_head() == "0016"
    revision = script.get_revision("0016")
    assert revision is not None
    assert revision.down_revision == "0015"


def test_database_url_normalization_for_alembic():
    assert (
        Settings._normalize_database_url("postgres://user:pass@host/db")
        == "postgresql+psycopg://user:pass@host/db"
    )
    assert (
        Settings._normalize_database_url("postgresql://user:pass@host/db")
        == "postgresql://user:pass@host/db"
    )


def test_refresh_token_persistence_and_user_relationship(db_session: Session):
    user = User(
        id=uuid.uuid4(),
        email="token-owner@test.com",
        name="Token Owner",
        hashed_password="hash",
        is_active=True,
        created_at=datetime.now(timezone.utc),
    )
    db_session.add(user)
    db_session.flush()

    RefreshTokenRepository.create(
        db_session,
        user_id=user.id,
        token_hash="a" * 64,
        expires_at=datetime.now(timezone.utc) + timedelta(days=1),
    )
    db_session.commit()

    stored = RefreshTokenRepository.get_active_by_hash(db_session, "a" * 64)
    assert stored is not None
    assert stored.user_id == user.id
    assert stored.user.email == "token-owner@test.com"
