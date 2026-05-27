from fastapi import HTTPException, status, UploadFile
from sqlalchemy.orm import Session

from app.core.security import hash_password, verify_password
from app.repositories.user_repository import UserRepository
from app.schemas.auth import UserResponse
from app.schemas.profile import AvatarResponse, PasswordChange, ProfileUpdate
from app.services.upload_service import UploadService
from app.utils.file_validator import validate_image


class ProfileService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = UserRepository()

    def get_profile(self, user_id: str) -> UserResponse:
        user = self.repo.get_by_id(self.db, user_id)
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)
        return UserResponse.model_validate(user)

    def update_profile(self, user_id: str, data: ProfileUpdate) -> UserResponse:
        user = self.repo.get_by_id(self.db, user_id)
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)

        updates = {}

        if data.name is not None:
            if len(data.name.strip()) < 2:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail="Name must have at least 2 characters",
                )
            updates["name"] = data.name.strip()

        if data.email is not None:
            existing = self.repo.get_by_email(self.db, data.email)
            if existing and existing.id != user.id:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Email already in use",
                )
            updates["email"] = data.email

        if not updates:
            return UserResponse.model_validate(user)

        updated = self.repo.update(self.db, user.id, **updates)
        return UserResponse.model_validate(updated)

    def change_password(self, user_id: str, data: PasswordChange) -> None:
        user = self.repo.get_by_id(self.db, user_id)
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)

        if not verify_password(data.current_password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Current password is incorrect",
            )

        if verify_password(data.new_password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="New password must be different from current password",
            )

        self.repo.update(
            self.db, user.id, hashed_password=hash_password(data.new_password)
        )

    def upload_avatar(self, user_id: str, file: UploadFile) -> AvatarResponse:
        user = self.repo.get_by_id(self.db, user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found",
            )

        mime_type = validate_image(file)

        file_bytes = file.file.read()

        if user.avatar_public_id:
            UploadService.delete_avatar(user.avatar_public_id)

        result = UploadService.validate_and_upload(
            file_bytes=file_bytes,
            user_id=str(user.id),
            mime_type=mime_type,
        )

        updated = self.repo.update_avatar(
            self.db,
            user.id,
            result["avatar_url"],
            result["avatar_public_id"],
        )

        return AvatarResponse(
            avatar_url=updated.avatar_url,
            avatar_public_id=updated.avatar_public_id,
        )

    def delete_avatar(self, user_id: str) -> AvatarResponse:
        user = self.repo.get_by_id(self.db, user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found",
            )

        if user.avatar_public_id:
            UploadService.delete_avatar(user.avatar_public_id)

        updated = self.repo.remove_avatar(self.db, user.id)

        return AvatarResponse(
            avatar_url=updated.avatar_url,
            avatar_public_id=updated.avatar_public_id,
        )
