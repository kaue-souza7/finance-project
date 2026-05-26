from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import create_access_token, hash_password, verify_password
from app.repositories.user_repository import UserRepository
from app.schemas.auth import LoginRequest, TokenResponse, UserCreate, UserResponse


class AuthService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = UserRepository()

    def register(self, data: UserCreate) -> TokenResponse:
        existing = self.repo.get_by_email(self.db, data.email)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Email already registered",
            )

        hashed = hash_password(data.password)
        user = self.repo.create(self.db, data, hashed)
        token = create_access_token(data={"sub": str(user.id)})
        return TokenResponse(access_token=token)

    def login(self, data: LoginRequest) -> str:
        user = self.repo.get_by_email(self.db, data.email)
        if not user or not verify_password(data.password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password",
            )

        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Inactive user",
            )

        return create_access_token(data={"sub": str(user.id)})

    def get_current_user(self, user_id: str) -> UserResponse:
        user = self.repo.get_by_id(self.db, user_id)
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)
        return UserResponse.model_validate(user)
