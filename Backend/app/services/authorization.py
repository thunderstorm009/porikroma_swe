"""Shared ownership and membership checks for protected trip resources."""

from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Profile, Trip, TripMember


def get_trip(db: Session, trip_id: UUID) -> Trip:
    trip = db.scalar(select(Trip).where(Trip.id == trip_id))
    if not trip:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trip not found")
    return trip


def membership(db: Session, trip_id: UUID, user_id: UUID) -> TripMember | None:
    return db.scalar(select(TripMember).where(TripMember.trip_id == trip_id, TripMember.user_id == user_id))


def require_trip_access(db: Session, trip_id: UUID, user_id: UUID, write: bool = False) -> tuple[Trip, TripMember]:
    trip = get_trip(db, trip_id)
    member = membership(db, trip_id, user_id)
    if not member:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You are not a member of this trip")
    if write and member.role not in {"owner", "admin"}:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Trip admin access required")
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
