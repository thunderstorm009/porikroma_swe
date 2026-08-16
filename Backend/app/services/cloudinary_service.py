"""Cloudinary configuration boundary for future signed uploads."""

from app.core.config import get_settings


def is_configured() -> bool:
    settings = get_settings()
    return bool(settings.cloudinary_cloud_name and settings.cloudinary_api_key and settings.cloudinary_api_secret)
