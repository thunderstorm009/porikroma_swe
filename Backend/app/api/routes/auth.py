from fastapi import APIRouter, Depends

from app.core.security import AuthenticatedUser, get_current_profile, get_current_user
from app.models import Profile
from app.schemas import ProfileRead

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.get("/me", summary="Validate the Supabase session")
def session(current_user: AuthenticatedUser = Depends(get_current_user), profile: Profile = Depends(get_current_profile)):
    return {"data": {"user_id": current_user.id, "profile": ProfileRead.model_validate(profile)}}


@router.post("/logout", summary="Acknowledge logout")
def logout():
    return {"data": {"logged_out": True, "message": "Sign out is completed by the Supabase client"}}
