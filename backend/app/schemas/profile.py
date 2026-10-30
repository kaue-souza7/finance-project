from pydantic import BaseModel, EmailStr, Field, field_validator

from app.schemas.password import Password


class AvatarResponse(BaseModel):
    avatar_url: str | None = None
    avatar_public_id: str | None = None


class ProfileResponse(BaseModel):
    avatar_url: str | None = None

    model_config = {"from_attributes": True}


class ProfileUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=255)
    email: EmailStr | None = None


class PasswordChange(BaseModel):
    current_password: str = Field(..., max_length=128)
    new_password: Password
    confirm_new_password: str

    @field_validator("confirm_new_password")
    @classmethod
    def passwords_match(cls, v: str, info) -> str:
        if "new_password" in info.data and v != info.data["new_password"]:
            raise ValueError("Passwords do not match")
        return v
