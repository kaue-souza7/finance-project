import cloudinary as cloudinary_lib

from app.core.config import settings


def configure_cloudinary() -> None:
    cloudinary_lib.config(
        cloud_name=settings.CLOUDINARY_CLOUD_NAME,
        api_key=settings.CLOUDINARY_API_KEY,
        api_secret=settings.CLOUDINARY_API_SECRET,
        secure=True,
    )
