import uuid
from pathlib import Path

from fastapi import UploadFile

MAX_FILE_SIZE = 5 * 1024 * 1024

ALLOWED_MIME_TYPES = {
    "image/jpeg",
    "image/png",
    "image/webp",
}

MAGIC_BYTES: dict[str, bytes] = {
    "image/jpeg": b"\xff\xd8\xff",
    "image/png": b"\x89PNG\r\n\x1a\n",
    "image/webp": b"RIFF",
}


def validate_file_size(file: UploadFile) -> None:
    file.file.seek(0, 2)
    size = file.file.tell()
    file.file.seek(0)

    if size > MAX_FILE_SIZE:
        raise ValueError(
            f"File too large. Maximum size is {MAX_FILE_SIZE // (1024 * 1024)}MB."
        )


def validate_mime_type(content_type: str | None) -> str:
    if content_type not in ALLOWED_MIME_TYPES:
        raise ValueError(
            f"Invalid file type '{content_type}'. Allowed: {', '.join(ALLOWED_MIME_TYPES)}"
        )
    return content_type


def validate_magic_bytes(file: UploadFile) -> str:
    header = file.file.read(16)
    file.file.seek(0)

    for mime_type, magic in MAGIC_BYTES.items():
        if header.startswith(magic):
            return mime_type

    raise ValueError("File content does not match any allowed image format")


def validate_image(file: UploadFile) -> str:
    validate_file_size(file)

    mime_type = validate_mime_type(file.content_type)

    detected_type = validate_magic_bytes(file)

    if mime_type != detected_type:
        raise ValueError(
            f"MIME type '{mime_type}' does not match actual file content '{detected_type}'"
        )

    return detected_type


def sanitize_filename(user_id: str) -> str:
    unique_id = uuid.uuid4().hex[:12]
    return f"user_{user_id[:8]}_{unique_id}"


def get_extension(mime_type: str) -> str:
    return {
        "image/jpeg": ".jpg",
        "image/png": ".png",
        "image/webp": ".webp",
    }[mime_type]
