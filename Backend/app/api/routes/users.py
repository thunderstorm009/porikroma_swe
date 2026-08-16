from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from sqlalchemy import select

from app.core.permissions import role_names
from app.core.security import AuthenticatedUser, get_current_profile, get_current_user
from app.db.database import get_db
from app.models import Profile, ProviderProfile
from app.schemas import MyAccessRead, ProfileRead, ProfileUpdate, ProviderProfileRead

router = APIRouter(prefix="/users", tags=["Users"])


def profile_payload(profile: Profile, roles: set[str], email: str | None = None):
    role = next((item for item in ("platform_admin", "provider", "tour_planner", "traveler") if item in roles), "traveler")
    contribution_count = len(profile.forum_questions) + len(profile.forum_answers)
    return ProfileRead.model_validate(profile).model_copy(update={
        "email": email,
        "role": role,
        "contribution_count": contribution_count,
    })


@router.get("/me", summary="Get the authenticated profile")
def get_me(current_user: AuthenticatedUser = Depends(get_current_user), profile: Profile = Depends(get_current_profile), db: Session = Depends(get_db)):
    roles = role_names(db, profile.id)
    payload = profile_payload(profile, roles, current_user.claims.get("email")).model_dump()
    payload["roles"] = sorted(roles)
    return {"data": payload}


@router.patch("/me", summary="Update the authenticated profile")
def update_me(payload: ProfileUpdate, profile: Profile = Depends(get_current_profile), db: Session = Depends(get_db)):
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(profile, key, value)
    db.commit()
    db.refresh(profile)
    return {"data": profile_payload(profile, role_names(db, profile.id))}


@router.get("/me/access", summary="Get the authenticated user's roles and provider access")
def get_my_access(profile: Profile = Depends(get_current_profile), db: Session = Depends(get_db)):
    provider = db.scalar(select(ProviderProfile).where(ProviderProfile.user_id == profile.id))
    return {
        "data": MyAccessRead(
            profile=ProfileRead.model_validate(profile),
            roles=sorted(role_names(db, profile.id)),
            provider=ProviderProfileRead.model_validate(provider) if provider else None,
        )
    }
