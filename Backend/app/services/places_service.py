"""Google Places boundary; database seed data remains the initial provider."""

from app.core.config import get_settings


def is_configured() -> bool:
    settings = get_settings()
    return bool(settings.google_places_api_key or settings.google_maps_api_key)
