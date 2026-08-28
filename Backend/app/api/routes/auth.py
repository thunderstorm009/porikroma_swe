from fastapi import APIRouter, Depends
from pydantic import BaseModel
import os
import httpx

from app.core.security import AuthenticatedUser, get_current_profile, get_current_user
from app.models import Profile
from app.schemas import ProfileRead

router = APIRouter(prefix="/auth", tags=["Auth"])


class AutoConfirmRequest(BaseModel):
    email: str


@router.get("/me", summary="Validate the Supabase session")
def session(current_user: AuthenticatedUser = Depends(get_current_user), profile: Profile = Depends(get_current_profile)):
    return {"data": {"user_id": current_user.id, "profile": ProfileRead.model_validate(profile)}}


@router.post("/logout", summary="Acknowledge logout")
def logout():
    return {"data": {"logged_out": True, "message": "Sign out is completed by the Supabase client"}}


@router.post("/auto-confirm", summary="Auto confirm user email in development")
def auto_confirm(payload: AutoConfirmRequest):
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_SECRET_KEY") or os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    if not url or not key:
        return {"data": {"success": False, "message": "Supabase admin key not configured"}}
    
    headers = {"Authorization": f"Bearer {key}", "apikey": key}
    resp = httpx.get(f"{url}/auth/v1/admin/users", headers=headers)
    if resp.status_code == 200:
        users = resp.json().get("users", [])
        for u in users:
            if u.get("email") == payload.email:
                httpx.put(f"{url}/auth/v1/admin/users/{u['id']}", headers=headers, json={"email_confirm": True})
                return {"data": {"success": True, "message": "User email auto-confirmed"}}
    return {"data": {"success": False, "message": "User auto-confirmation step skipped"}}
