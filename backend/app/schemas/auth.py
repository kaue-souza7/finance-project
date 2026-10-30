import uuid
from datetime import datetime

from pydantic import BaseModel, EmailStr, Field, model_validator

from app.schemas.password import Password


class UserCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    email: EmailStr
    password: Password


class UserResponse(BaseModel):
    id: uuid.UUID
    email: str
    name: str
    is_active: bool
    avatar_url: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., max_length=128)


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int


class RefreshRequest(BaseModel):
    refresh_token: str = Field(..., min_length=16, max_length=512)


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str = Field(..., min_length=16, max_length=512)
    new_password: Password
    confirm_new_password: str

    @model_validator(mode="after")
    def validate_confirmation(self) -> "ResetPasswordRequest":
        if self.new_password != self.confirm_new_password:
            raise ValueError("As senhas não conferem")
        return self
