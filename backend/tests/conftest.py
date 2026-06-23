import uuid
from datetime import datetime, timezone

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import String, TypeDecorator, create_engine
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Session, sessionmaker

from app.core.security import create_access_token, hash_password
from app.database.session import Base
from app.main import create_app
from app.models import (  # noqa: ensure all models are registered
    ShoppingListInvite, ShoppingListShare, User,
)

# ── Make PostgreSQL UUID type work with SQLite ──────────────────────────
_PG_UUID_result_processor = PG_UUID.result_processor


def _sqlite_uuid_result_processor(self, dialect, coltype):
    if dialect.name == "sqlite":
        def process(value):
            if value is not None:
                return uuid.UUID(value)
            return None
        return process
    return _PG_UUID_result_processor(self, dialect, coltype)


PG_UUID.result_processor = _sqlite_uuid_result_processor

_PG_UUID_bind_processor = PG_UUID.bind_processor


def _sqlite_uuid_bind_processor(self, dialect):
    if dialect.name == "sqlite":
        def process(value):
            if value is not None:
                return str(value)
            return None
        return process
    return _PG_UUID_bind_processor(self, dialect)


PG_UUID.bind_processor = _sqlite_uuid_bind_processor
# ─────────────────────────────────────────────────────────────────────────


@pytest.fixture(scope="session")
def app() -> FastAPI:
    return create_app()


@pytest.fixture
def db_session(tmp_path):
    db_path = tmp_path / "test.db"
    engine = create_engine(
        f"sqlite:///{db_path}",
        echo=False,
        connect_args={"check_same_thread": False},
    )
    Base.metadata.create_all(bind=engine)
    TestSession = sessionmaker(bind=engine)
    session = TestSession()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture
def client(app, db_session):
    def override_get_db():
        yield db_session

    from app.api.deps import get_db

    app.dependency_overrides[get_db] = override_get_db

    with TestClient(app) as c:
        yield c

    app.dependency_overrides.clear()


@pytest.fixture
def owner(db_session) -> User:
    user = User(
        id=uuid.uuid4(),
        email="owner@test.com",
        name="Owner User",
        hashed_password=hash_password("test123"),
        is_active=True,
        created_at=datetime.now(timezone.utc),
    )
    db_session.add(user)
    db_session.commit()
    return user


@pytest.fixture
def other_user(db_session) -> User:
    user = User(
        id=uuid.uuid4(),
        email="other@test.com",
        name="Other User",
        hashed_password=hash_password("test123"),
        is_active=True,
        created_at=datetime.now(timezone.utc),
    )
    db_session.add(user)
    db_session.commit()
    return user


@pytest.fixture
def third_user(db_session) -> User:
    user = User(
        id=uuid.uuid4(),
        email="third@test.com",
        name="Third User",
        hashed_password=hash_password("test123"),
        is_active=True,
        created_at=datetime.now(timezone.utc),
    )
    db_session.add(user)
    db_session.commit()
    return user


@pytest.fixture
def owner_headers(owner):
    token = create_access_token({"sub": str(owner.id)})
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def other_headers(other_user):
    token = create_access_token({"sub": str(other_user.id)})
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def third_headers(third_user):
    token = create_access_token({"sub": str(third_user.id)})
    return {"Authorization": f"Bearer {token}"}
