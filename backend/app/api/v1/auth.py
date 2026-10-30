from fastapi import APIRouter, BackgroundTasks, Depends, Request, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.core.config import settings
from app.core.rate_limit import limiter, rate_limit_key
from app.schemas.auth import (
    ForgotPasswordRequest,
    LoginRequest,
    RefreshRequest,
    ResetPasswordRequest,
    TokenResponse,
    UserCreate,
    UserResponse,
)
from app.services.auth_service import AuthService
from app.services.email_service import send_password_reset_email

router = APIRouter(prefix="/auth", tags=["auth"])


def _client_info(request: Request) -> tuple[str | None, str | None]:
    user_agent = request.headers.get("user-agent")
    return user_agent, rate_limit_key(request)


@router.post("/register", response_model=TokenResponse, status_code=201)
@limiter.limit("10/hour")
def register(
    request: Request,
    data: UserCreate,
    db: Session = Depends(get_db),
):
    service = AuthService(db)
    user_agent, ip_address = _client_info(request)
    return service.register(data, user_agent, ip_address)


@router.post("/login", response_model=TokenResponse)
@limiter.limit("10/minute")
def login(
    request: Request,
    data: LoginRequest,
    db: Session = Depends(get_db),
):
    service = AuthService(db)
    user_agent, ip_address = _client_info(request)
    return service.login(data, user_agent, ip_address)


@router.post("/refresh", response_model=TokenResponse)
@limiter.limit("60/minute")
def refresh(
    request: Request,
    data: RefreshRequest,
    db: Session = Depends(get_db),
):
    service = AuthService(db)
    user_agent, ip_address = _client_info(request)
    return service.refresh(data.refresh_token, user_agent, ip_address)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
@limiter.limit("30/minute")
def logout(
    request: Request,
    data: RefreshRequest,
    db: Session = Depends(get_db),
):
    service = AuthService(db)
    service.logout(data.refresh_token)


@router.post("/forgot-password", status_code=status.HTTP_202_ACCEPTED)
@limiter.limit("5/hour")
def forgot_password(
    request: Request,
    data: ForgotPasswordRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    service = AuthService(db)
    result = service.request_password_reset(str(data.email))
    if result:
        email, token = result
        reset_link = f"{settings.FRONTEND_URL}/reset-password?token={token}"
        background_tasks.add_task(send_password_reset_email, email, reset_link)
    return {
        "message": "Se o e-mail existir, enviaremos um link de recuperação."
    }


@router.post("/reset-password", status_code=status.HTTP_204_NO_CONTENT)
@limiter.limit("10/hour")
def reset_password(
    request: Request,
    data: ResetPasswordRequest,
    db: Session = Depends(get_db),
):
    service = AuthService(db)
    service.reset_password(data)


@router.get("/me", response_model=UserResponse)
def me(current_user: UserResponse = Depends(get_current_user)):
    return current_user
