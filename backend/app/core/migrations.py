import logging
from pathlib import Path

from alembic import command
from alembic.config import Config
from alembic.runtime.migration import MigrationContext
from alembic.script import ScriptDirectory
from sqlalchemy import text

from app.core.config import settings
from app.database.session import engine

logger = logging.getLogger(__name__)

BACKEND_DIR = Path(__file__).resolve().parents[2]
MIGRATION_LOCK_ID = 738291645


def _alembic_config() -> Config:
    config = Config(str(BACKEND_DIR / "alembic.ini"))
    config.set_main_option("script_location", str(BACKEND_DIR / "alembic"))
    config.set_main_option("prepend_sys_path", str(BACKEND_DIR))
    config.set_main_option(
        "sqlalchemy.url", settings.migration_database_url.replace("%", "%%")
    )
    return config


def _current_revision(connection) -> str | None:
    return MigrationContext.configure(connection).get_current_revision()


def _head_revision(config: Config) -> str | None:
    return ScriptDirectory.from_config(config).get_current_head()


def run_migrations() -> None:
    """Aplica as migrations pendentes de forma serializada entre instâncias."""
    config = _alembic_config()
    head = _head_revision(config)

    with engine.connect() as connection:
        current = _current_revision(connection)
        if current == head:
            logger.info("Banco já está na revisão %s; migrations ignoradas", head)
            return

        is_postgres = engine.dialect.name == "postgresql"
        if is_postgres:
            connection.execute(
                text("SELECT pg_advisory_lock(:key)"),
                {"key": MIGRATION_LOCK_ID},
            )

        try:
            # Outra instância pode ter aplicado enquanto esperávamos o lock.
            current = _current_revision(connection)
            if current == head:
                logger.info("Migrations aplicadas por outra instância (%s)", head)
                return

            logger.info(
                "Aplicando migrations: revisão atual %s -> head %s",
                current,
                head,
            )
            command.upgrade(config, "head")
            logger.info("Migrations aplicadas com sucesso até %s", head)
        finally:
            if is_postgres:
                connection.execute(
                    text("SELECT pg_advisory_unlock(:key)"),
                    {"key": MIGRATION_LOCK_ID},
                )
