import logging

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.cloudinary import configure_cloudinary
from app.core.config import settings

from app.api.v1.auth import router as auth_router

logger = logging.getLogger(__name__)
from app.api.v1.health import router as health_router
from app.api.v1.categories import router as categories_router
from app.api.v1.expenses import router as expenses_router
from app.api.v1.investments import router as investments_router
from app.api.v1.plannings import router as plannings_router
from app.api.v1.profile import router as profile_router
from app.api.v1.leisure import router as leisure_router
from app.api.v1.leisure_expenses import router as leisure_expenses_router
from app.api.v1.leisure_invites import router as leisure_invites_router
from app.api.v1.leisure_km import router as leisure_km_router
from app.api.v1.chat_invites import router as chat_invites_router
from app.api.v1.chats import router as chats_router
from app.api.v1.chat_messages import router as chat_messages_router
from app.api.v1.shopping_list import router as shopping_list_router
from app.api.v1.shopping_list_invites import (
    router as shopping_list_invites_router,
)
from app.api.v1.shopping_list_shares import (
    router as shopping_list_shares_router,
)
from app.api.v1.users import router as users_router
from app.api.v1.quotes import router as quotes_router
from app.api.v1.webauthn import router as webauthn_router


def create_app() -> FastAPI:
    app = FastAPI(title="Finance Project API", version="0.1.0")

    logging.basicConfig(level=logging.INFO)
    logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)

    configure_cloudinary()

    @app.exception_handler(Exception)
    async def unhandled_exception_handler(request: Request, exc: Exception):
        logger.exception(
            "Erro nao tratado: %s %s", request.method, request.url.path
        )
        return JSONResponse(
            status_code=500,
            content={"detail": "Erro interno do servidor"},
        )

    @app.on_event("startup")
    def on_startup():
        try:
            from app.database.session import warm_up_pool

            warm_up_pool()
        except Exception:
            logger.warning("Pool nao aquecido no startup")

        try:
            from app.core.scheduler import init_scheduler

            init_scheduler()
        except Exception:
            logger.exception("Falha ao iniciar scheduler de limpeza")

    @app.on_event("shutdown")
    def on_shutdown():
        try:
            from app.core.scheduler import shutdown_scheduler

            shutdown_scheduler()
        except Exception:
            logger.exception("Falha ao finalizar scheduler")

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(health_router)
    app.include_router(auth_router, prefix="/api/v1")
    app.include_router(plannings_router, prefix="/api/v1")
    app.include_router(expenses_router, prefix="/api/v1")
    app.include_router(categories_router, prefix="/api/v1")
    app.include_router(investments_router, prefix="/api/v1")
    app.include_router(profile_router, prefix="/api/v1")
    app.include_router(leisure_invites_router, prefix="/api/v1")
    app.include_router(leisure_router, prefix="/api/v1")
    app.include_router(leisure_expenses_router, prefix="/api/v1")
    app.include_router(leisure_km_router, prefix="/api/v1")
    app.include_router(chat_invites_router, prefix="/api/v1")
    app.include_router(chats_router, prefix="/api/v1")
    app.include_router(chat_messages_router, prefix="/api/v1")
    app.include_router(shopping_list_router, prefix="/api/v1")
    app.include_router(shopping_list_invites_router, prefix="/api/v1")
    app.include_router(shopping_list_shares_router, prefix="/api/v1")
    app.include_router(users_router, prefix="/api/v1")
    app.include_router(webauthn_router, prefix="/api/v1")
    app.include_router(quotes_router)

    return app


app = create_app()
