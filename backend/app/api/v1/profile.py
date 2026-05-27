from fastapi import APIRouter, Depends, UploadFile, File
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.schemas.auth import UserResponse
from app.schemas.profile import AvatarResponse, PasswordChange, ProfileUpdate
from app.services.profile_service import ProfileService

router = APIRouter(prefix="/profile", tags=["profile"])


@router.get("", response_model=UserResponse)
def get_profile(
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = ProfileService(db)
    return service.get_profile(str(current_user.id))


@router.put("", response_model=UserResponse)
def update_profile(
    data: ProfileUpdate,
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = ProfileService(db)
    return service.update_profile(str(current_user.id), data)


@router.post("/change-password", status_code=204)
def change_password(
    data: PasswordChange,
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = ProfileService(db)
    service.change_password(str(current_user.id), data)


@router.post("/avatar", response_model=AvatarResponse, status_code=201)
def upload_avatar(
    file: UploadFile = File(...),
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = ProfileService(db)
    return service.upload_avatar(str(current_user.id), file)


@router.delete("/avatar", response_model=AvatarResponse)
def remove_avatar(
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = ProfileService(db)
    return service.delete_avatar(str(current_user.id))
