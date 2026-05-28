import logging

from sqlalchemy import create_engine, text
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from app.core.config import settings

logger = logging.getLogger(__name__)

engine = create_engine(
    settings.database_url_normalized,
    pool_size=3,
    max_overflow=2,
    pool_timeout=10,
    pool_recycle=300,
    pool_pre_ping=True,
    connect_args={"connect_timeout": 10},
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def warm_up_pool():
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        logger.info("Pool aquecido — conexao com PostgreSQL estabelecida")
    except Exception:
        logger.warning("Pool nao pode ser aquecido agora — conexao sera lazy")


class Base(DeclarativeBase):
    pass
