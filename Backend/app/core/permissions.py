"""Application authorization dependencies.

Supabase Auth proves identity. These dependencies enforce Porikroma's
application roles and provider verification state on top of that identity.
"""

from __future__ import annotations

from typing import Callable

from fastapi import Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import get_current_profile
from app.db.database import get_db
from app.models import Profile, ProviderProfile, Role, UserRole


def role_names(db: Session, user_id) -> set[str]:
    rows = db.scalars(
        select(Role.name)
        .join(UserRole, UserRole.role_id == Role.id)
        .where(UserRole.user_id == user_id, UserRole.revoked_at.is_(None))
    ).all()
    return set(rows)


def has_any_role(db: Session, user_id, roles: set[str]) -> bool:
    return bool(role_names(db, user_id) & roles)


def require_roles(*required_roles: str) -> Callable:
    required = set(required_roles)

    def dependency(profile: Profile = Depends(get_current_profile), db: Session = Depends(get_db)) -> Profile:
        if profile.account_status != "active":
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="This account is not active")
        if not has_any_role(db, profile.id, required):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions")
        return profile

    return dependency


def require_approved_provider(profile: Profile = Depends(get_current_profile), db: Session = Depends(get_db)) -> Profile:
    if profile.account_status != "active":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="This account is not active")
    if not has_any_role(db, profile.id, {"provider", "platform_admin"}):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Provider access is required")
    provider = db.scalar(select(ProviderProfile).where(ProviderProfile.user_id == profile.id))
    if profile.provider_profile is None or provider.verification_status != "approved":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Provider approval is required")
    return profile


def ensure_role(db: Session, user_id, role_name: str, granted_by=None) -> UserRole:
    role = db.scalar(select(Role).where(Role.name == role_name))
    if role is None:
        role = Role(name=role_name, description=f"Porikroma {role_name} role")
        db.add(role)
        db.flush()
    assignment = db.scalar(select(UserRole).where(UserRole.user_id == user_id, UserRole.role_id == role.id))
    if assignment is None:
        assignment = UserRole(user_id=user_id, role_id=role.id, granted_by=granted_by)
        db.add(assignment)
    elif assignment.revoked_at is not None:
        assignment.revoked_at = None
        assignment.granted_by = granted_by
    return assignment


def revoke_role(db: Session, user_id, role_name: str) -> bool:
    assignment = db.scalar(
        select(UserRole)
        .join(Role, Role.id == UserRole.role_id)
        .where(UserRole.user_id == user_id, Role.name == role_name, UserRole.revoked_at.is_(None))
    )
    if assignment is None:
        return False
    from datetime import datetime, timezone

    assignment.revoked_at = datetime.now(timezone.utc)
    return True
