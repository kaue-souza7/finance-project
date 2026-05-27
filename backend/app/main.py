from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.cloudinary import configure_cloudinary
from app.core.config import settings
from app.api.v1.auth import router as auth_router
from app.api.v1.health import router as health_router
from app.api.v1.categories import router as categories_router
from app.api.v1.expenses import router as expenses_router
from app.api.v1.investments import router as investments_router
from app.api.v1.plannings import router as plannings_router
from app.api.v1.profile import router as profile_router


def create_app() -> FastAPI:
    app = FastAPI(title="Finance Project API", version="0.1.0")

    configure_cloudinary()

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

    return app


app = create_app()
