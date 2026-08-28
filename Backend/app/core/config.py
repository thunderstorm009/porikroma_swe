"""Application configuration loaded from environment variables only."""

from __future__ import annotations

import os
from dataclasses import dataclass
from functools import lru_cache

from dotenv import load_dotenv

load_dotenv()


def _csv(value: str | None, default: str = "") -> list[str]:
    raw = value if value is not None else default
    return [item.strip() for item in raw.split(",") if item.strip()]


@dataclass(frozen=True)
class Settings:
    database_url: str
    supabase_url: str | None
    supabase_publishable_key: str | None
    supabase_secret_key: str | None
    supabase_jwks_url: str | None
    supabase_jwt_secret: str | None
    openai_api_key: str | None
    groq_api_key: str | None
    groq_model: str
    google_maps_api_key: str | None
    google_places_api_key: str | None
    openweather_api_key: str | None
    cloudinary_cloud_name: str | None
    cloudinary_api_key: str | None
    cloudinary_api_secret: str | None
    cors_origins: list[str]
    ai_provider: str
    environment: str


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        raise RuntimeError("DATABASE_URL is not configured")

    return Settings(
        database_url=database_url,
        supabase_url=os.getenv("SUPABASE_URL"),
        supabase_publishable_key=os.getenv("SUPABASE_PUBLISHABLE_KEY"),
        supabase_secret_key=os.getenv("SUPABASE_SECRET_KEY"),
        supabase_jwks_url=os.getenv("SUPABASE_JWKS_URL"),
        supabase_jwt_secret=os.getenv("SUPABASE_JWT_SECRET"),
        openai_api_key=os.getenv("OPENAI_API_KEY"),
        groq_api_key=os.getenv("GROQ_API_KEY"),
        groq_model=os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile"),
        google_maps_api_key=os.getenv("GOOGLE_MAPS_API_KEY"),
        google_places_api_key=os.getenv("GOOGLE_PLACES_API_KEY"),
        openweather_api_key=os.getenv("OPENWEATHER_API_KEY"),
        cloudinary_cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
        cloudinary_api_key=os.getenv("CLOUDINARY_API_KEY"),
        cloudinary_api_secret=os.getenv("CLOUDINARY_API_SECRET"),
        cors_origins=_csv(os.getenv("CORS_ORIGINS"), "http://localhost:5173"),
        ai_provider=os.getenv("AI_PROVIDER", "mock").lower(),
        environment=os.getenv("ENVIRONMENT", "development").lower(),
    )
