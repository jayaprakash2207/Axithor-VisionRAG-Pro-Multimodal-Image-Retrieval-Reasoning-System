import base64
import os
import uuid
from datetime import datetime
from typing import Tuple

from fastapi import HTTPException, UploadFile
from PIL import Image
from starlette.concurrency import run_in_threadpool

from .config import settings

ALLOWED_FORMATS = {"PNG", "JPEG", "JPG", "WEBP"}
ALLOWED_EXTENSIONS = {".png", ".jpg", ".jpeg", ".webp"}
ALLOWED_CONTENT_TYPES = {"image/png", "image/jpeg", "image/webp"}


def ensure_upload_dir() -> None:
    os.makedirs(settings.upload_dir, exist_ok=True)


def validate_image(file: UploadFile) -> None:
    if not file.filename:
        raise HTTPException(status_code=422, detail="Missing filename")

    extension = os.path.splitext(file.filename)[1].lower()
    if extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=415, detail="Unsupported image type")

    if file.content_type and file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(status_code=415, detail="Unsupported image content type")

    max_bytes = settings.max_upload_mb * 1024 * 1024
    if file.size is not None and file.size > max_bytes:
        raise HTTPException(status_code=413, detail="Image too large")


async def save_upload(file: UploadFile) -> Tuple[str, str]:
    ensure_upload_dir()
    extension = os.path.splitext(file.filename)[1].lower()
    if extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=415, detail="Unsupported image type")

    contents = await file.read()
    max_bytes = settings.max_upload_mb * 1024 * 1024
    if len(contents) > max_bytes:
        raise HTTPException(status_code=413, detail="Image too large")

    unique_name = f"{uuid.uuid4().hex}{extension}"
    file_path = os.path.join(settings.upload_dir, unique_name)

    def _write_file() -> None:
        with open(file_path, "wb") as out_file:
            out_file.write(contents)

    await run_in_threadpool(_write_file)

    return file_path, unique_name


def load_image(file_path: str) -> Image.Image:
    try:
        with Image.open(file_path) as img:
            image_format = img.format
            image = img.convert("RGB")
    except Exception as exc:
        raise HTTPException(status_code=400, detail="Invalid image") from exc

    if image_format and image_format.upper() not in ALLOWED_FORMATS:
        raise HTTPException(status_code=400, detail="Unsupported image format")

    return image


def image_to_base64(file_path: str) -> str:
    with open(file_path, "rb") as img_file:
        return base64.b64encode(img_file.read()).decode("utf-8")


def now_iso() -> str:
    return datetime.utcnow().isoformat() + "Z"
