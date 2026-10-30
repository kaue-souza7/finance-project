"""Executa migrations pendentes. Use em pre-deploy ou manualmente."""

from app.core.migrations import run_migrations

if __name__ == "__main__":
    run_migrations()
