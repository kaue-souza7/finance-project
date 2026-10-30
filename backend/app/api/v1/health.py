import logging

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.api.deps import get_db

logger = logging.getLogger(__name__)

router = APIRouter(tags=["health"])


def _check_database(db: Session) -> dict[str, str]:
    try:
        db.execute(text("SELECT 1"))
    except Exception:
        logger.exception("Health check: banco de dados indisponível")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Banco de dados indisponível",
        ) from None
    return {"status": "ok", "database": "ok"}


@router.get("/health")
def health_check(db: Session = Depends(get_db)):
    """Readiness: usado pelo Render para decidir se a instância pode receber tráfego."""
    return _check_database(db)


@router.get("/health/ready")
def readiness_check(db: Session = Depends(get_db)):
    return _check_database(db)


@router.get("/health/live")
def liveness_check():
    """Liveness: verifica apenas se o processo HTTP está de pé."""
    return {"status": "ok"}


@router.get("/health/diagnostics")
def diagnostics(db: Session = Depends(get_db)):
    """Diagnóstico seguro: sem PII, sem credenciais e sem tokens."""
    _check_database(db)
    revision = None
    users_count = 0
    try:
        revision = db.execute(
            text("SELECT version_num FROM alembic_version LIMIT 1")
        ).scalar()
    except Exception:
        logger.warning("Diagnóstico: alembic_version indisponível")
    try:
        users_count = int(
            db.execute(text("SELECT count(*) FROM users")).scalar() or 0
        )
    except Exception:
        logger.warning("Diagnóstico: tabela users indisponível")
    return {
        "status": "ok",
        "database": "ok",
        "alembic_revision": revision,
        "has_users": users_count > 0,
        "users_count": users_count,
    }
