import cloudinary.uploader
import cloudinary.utils

from app.utils.file_validator import (
    get_extension,
    sanitize_filename,
    validate_image,
)


class UploadService:

    AVATAR_FOLDER = "avatars"
    ALLOWED_FORMATS = ["jpg", "jpeg", "png", "webp"]

    @staticmethod
    def upload_avatar(file_content: bytes, user_id: str, mime_type: str) -> dict:
        public_id = sanitize_filename(user_id)

        result = cloudinary.uploader.upload(
            file_content,
            public_id=public_id,
            folder=UploadService.AVATAR_FOLDER,
            resource_type="image",
            overwrite=False,
            format="webp",
            transformation=[
                {"width": 256, "height": 256, "crop": "fill", "gravity": "face"},
                {"quality": "auto", "fetch_format": "auto"},
            ],
        )

        return {
            "avatar_url": result["secure_url"],
            "avatar_public_id": result["public_id"],
        }

    @staticmethod
    def delete_avatar(public_id: str) -> None:
        try:
            cloudinary.uploader.destroy(public_id, resource_type="image")
        except Exception:
            pass

    @staticmethod
    def validate_and_upload(file_bytes: bytes, user_id: str, mime_type: str) -> dict:
        return UploadService.upload_avatar(file_bytes, user_id, mime_type)

    @staticmethod
    def get_default_avatar_url() -> str:
        return ""
