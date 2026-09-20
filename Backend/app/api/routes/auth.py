from __future__ import annotations
import logging

import httpx
from fastapi import APIRouter, Depends, Request
from pydantic import BaseModel

from app.core.config import get_settings
from app.core.security import AuthenticatedUser, get_current_profile, get_current_user
from app.models import Profile
from app.schemas import ProfileRead
from app.services.rate_limit import InMemoryRateLimiter

router = APIRouter(prefix="/auth", tags=["Auth"])
logger = logging.getLogger("porikroma.auth")

_auto_confirm_limiter = InMemoryRateLimiter(limit=5, window_seconds=60)


class AutoConfirmRequest(BaseModel):
    email: str


@router.get("/me", summary="Validate the Supabase session")
def session(current_user: AuthenticatedUser = Depends(get_current_user), profile: Profile = Depends(get_current_profile)):
    return {"data": {"user_id": current_user.id, "profile": ProfileRead.model_validate(profile)}}


@router.post("/logout", summary="Acknowledge logout")
def logout():
    return {"data": {"logged_out": True, "message": "Sign out is completed by the Supabase client"}}


@router.post("/auto-confirm", summary="Auto confirm user email (development only)")
def auto_confirm(payload: AutoConfirmRequest, request: Request):
    """Bypasses Supabase email confirmation so local/dev signups don't need a real inbox.

    Disabled outside development: it otherwise lets any anonymous caller use the
    Supabase service-role key to force-confirm an arbitrary account's email.
    """
    settings = get_settings()
    if settings.environment == "production":
        return {"data": {"success": False, "message": "Auto-confirmation is disabled in production"}}

    key = request.client.host if request.client else "unknown"
    if not _auto_confirm_limiter.allow(key):
        return {"data": {"success": False, "message": "Too many auto-confirm attempts"}}

    if not settings.supabase_url or not settings.supabase_secret_key:
        return {"data": {"success": False, "message": "Supabase admin key not configured"}}

    headers = {"Authorization": f"Bearer {settings.supabase_secret_key}", "apikey": settings.supabase_secret_key}
    try:
        resp = httpx.get(f"{settings.supabase_url}/auth/v1/admin/users", headers=headers, timeout=10)
        resp.raise_for_status()
        for u in resp.json().get("users", []):
            if u.get("email") == payload.email:
                httpx.put(
                    f"{settings.supabase_url}/auth/v1/admin/users/{u['id']}",
                    headers=headers,
                    json={"email_confirm": True},
                    timeout=10,
                )
                return {"data": {"success": True, "message": "User email auto-confirmed"}}
    except httpx.HTTPError:
        logger.warning("Auto-confirm request to Supabase failed", exc_info=True)
    return {"data": {"success": False, "message": "User auto-confirmation step skipped"}}
