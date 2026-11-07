from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.permissions import role_names
from app.core.security import AuthenticatedUser, get_current_profile, get_current_user
from app.db.database import get_db
from app.models import ForumAnswer, ForumQuestion, Profile, ProviderProfile
from app.schemas import MyAccessRead, ProfileRead, ProfileUpdate, ProviderProfileRead

router = APIRouter(prefix="/users", tags=["Users"])
ROLE_PRIORITY = ("platform_admin", "provider", "tour_planner", "traveler")


def contribution_count(db: Session, user_id) -> int:
    questions = db.scalar(select(func.count(ForumQuestion.id)).where(ForumQuestion.author_id == user_id)) or 0
    answers = db.scalar(select(func.count(ForumAnswer.id)).where(ForumAnswer.author_id == user_id)) or 0
    return questions + answers


def profile_payload(db: Session, profile: Profile, roles: set[str], email: str | None = None) -> ProfileRead:
    role = next((item for item in ROLE_PRIORITY if item in roles), "traveler")
    return ProfileRead.model_validate(profile).model_copy(update={
        "email": email,
        "role": role,
        "contribution_count": contribution_count(db, profile.id),
    })


@router.get("/me", summary="Get the authenticated profile")
def get_me(current_user: AuthenticatedUser = Depends(get_current_user), profile: Profile = Depends(get_current_profile), db: Session = Depends(get_db)):
    roles = role_names(db, profile.id)
    payload = profile_payload(db, profile, roles, current_user.claims.get("email")).model_dump()
    payload["roles"] = sorted(roles)
    return {"data": payload}


@router.patch("/me", summary="Update the authenticated profile")
def update_me(payload: ProfileUpdate, current_user: AuthenticatedUser = Depends(get_current_user), profile: Profile = Depends(get_current_profile), db: Session = Depends(get_db)):
    values = payload.model_dump(exclude_unset=True)
    if "username" in values and values["username"] is not None:
        values["username"] = values["username"].strip()
        taken = db.scalar(select(Profile.id).where(Profile.username == values["username"], Profile.id != profile.id))
        if taken:
            raise HTTPException(status_code=409, detail="That username is already taken")
    for key, value in values.items():
        setattr(profile, key, value)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=409, detail="That username is already taken") from exc
    db.refresh(profile)
    roles = role_names(db, profile.id)
    data = profile_payload(db, profile, roles, current_user.claims.get("email")).model_dump()
    data["roles"] = sorted(roles)
    return {"data": data}


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
