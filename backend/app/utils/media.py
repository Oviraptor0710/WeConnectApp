import os
import uuid
from fastapi import HTTPException, UploadFile, status
from app.config import settings

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp"}
ALLOWED_FILE_TYPES = {
    "image/jpeg", "image/png", "image/webp", "image/gif",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "text/plain",
    "text/csv",
    "application/zip",
    "application/x-zip-compressed",
    "application/x-rar-compressed",
    "audio/mpeg", "audio/mp4", "audio/wav", "audio/webm",
    "video/mp4", "video/webm", "video/quicktime",
}

def save_upload(file: UploadFile, subfolder: str, max_mb: int = 10) -> str:
    """Lưu file lên disk, trả về URL path."""
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Chỉ chấp nhận định dạng JPG, PNG, WebP",
        )

    content = file.file.read()
    if len(content) > max_mb * 1024 * 1024:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File không được vượt quá {max_mb}MB",
        )

    ext = file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else "jpg"
    filename = f"{uuid.uuid4().hex}.{ext}"
    folder = os.path.join(settings.UPLOAD_DIR, subfolder)
    os.makedirs(folder, exist_ok=True)

    with open(os.path.join(folder, filename), "wb") as f:
        f.write(content)

    return f"/uploads/{subfolder}/{filename}"


def save_chat_file(file: UploadFile, subfolder: str = "chat", max_mb: int = 50) -> str:
    """Lưu file chat lên disk, trả về URL path. Hỗ trợ nhiều định dạng hơn."""
    if file.content_type not in ALLOWED_FILE_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Định dạng file không được hỗ trợ",
        )

    content = file.file.read()
    if len(content) > max_mb * 1024 * 1024:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File không được vượt quá {max_mb}MB",
        )

    ext = file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else "bin"
    filename = f"{uuid.uuid4().hex}.{ext}"
    folder = os.path.join(settings.UPLOAD_DIR, subfolder)
    os.makedirs(folder, exist_ok=True)

    with open(os.path.join(folder, filename), "wb") as f:
        f.write(content)

    return f"/uploads/{subfolder}/{filename}"
