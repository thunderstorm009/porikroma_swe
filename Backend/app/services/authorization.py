from __future__ import annotations
"""Shared ownership and membership checks for protected trip resources."""

from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Profile, Trip, TripMember


def get_trip(db: Session, trip_id: UUID) -> Trip:
    trip = db.get(Trip, trip_id)
    if not trip:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trip not found")
    return trip


def membership(db: Session, trip_id: UUID, user_id: UUID) -> TripMember | None:
    return db.scalar(select(TripMember).where(TripMember.trip_id == trip_id, TripMember.user_id == user_id))


def require_trip_access(db: Session, trip_id: UUID, user_id: UUID, write: bool = False) -> tuple[Trip, TripMember | None]:
    """Read access (write=False): members, or anyone for a public trip.

    Admin access (write=True): trip owner/admin only.
    Use ``require_trip_member`` for content that any member may add.
    """
    trip = get_trip(db, trip_id)
    member = membership(db, trip_id, user_id)
    if not member:
        if not write and trip.visibility == "public":
            return trip, None
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You are not a member of this trip")
    if write and member.role not in {"owner", "admin"}:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Trip admin access required")
    return trip, member


def require_trip_member(db: Session, trip_id: UUID, user_id: UUID) -> tuple[Trip, TripMember]:
    """Any member of the trip (owner, admin or member). Public visibility is not enough."""
    trip = get_trip(db, trip_id)
    member = membership(db, trip_id, user_id)
    if not member:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You are not a member of this trip")
    return trip, member


def require_trip_owner(db: Session, trip_id: UUID, user_id: UUID) -> Trip:
    trip = get_trip(db, trip_id)
    if trip.owner_id != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Trip owner access required")
    return trip


def require_profile(profile: Profile | None, user_id: UUID) -> Profile:
    if not profile or profile.id != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Resource ownership required")
    return profile


def ensure_exists(db: Session, model, row_id: UUID | None, label: str) -> None:
    """Turn a dangling foreign key into a 422 instead of a database error."""
    if row_id is not None and db.get(model, row_id) is None:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=f"{label} not found")
