from __future__ import annotations

from datetime import date
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import AuthenticatedUser, get_current_user
from app.db.database import get_db
from app.models import EmergencyLocation, Notification
from app.schemas import NotificationRead
from app.services.emergency_service import distance_km
from app.services.weather_service import ExternalServiceError, forecast

emergency_router = APIRouter(prefix="/emergency", tags=["Emergency"])
weather_router = APIRouter(prefix="/weather", tags=["Weather"])
notifications_router = APIRouter(prefix="/notifications", tags=["Notifications"])


@emergency_router.get("/nearby", summary="Find nearby emergency locations")
def nearby_emergency(latitude: float = Query(..., ge=-90, le=90), longitude: float = Query(..., ge=-180, le=180), category: str | None = Query(None), radius: float = Query(25, gt=0, le=200), db: Session = Depends(get_db)):
    rows = db.scalars(select(EmergencyLocation)).all()
    selected = []
    for row in rows:
        if category and category.lower() not in {row.category.lower(), row.category.replace("_", " ").lower()}:
            continue
        distance = distance_km(latitude, longitude, float(row.latitude), float(row.longitude))
        if distance <= radius:
            selected.append({"id": row.id, "name": row.name, "category": row.category, "address": row.address, "latitude": row.latitude, "longitude": row.longitude, "phone": row.phone, "is_open": row.is_open, "distance_km": round(distance, 2), "informational": True})
    selected.sort(key=lambda item: item["distance_km"])
    return {"data": selected}


@weather_router.get("", summary="Get weather for coordinates")
def weather(latitude: float = Query(..., ge=-90, le=90), longitude: float = Query(..., ge=-180, le=180), requested_date: date | None = Query(None, alias="date")):
    try:
        return {"data": forecast(latitude, longitude, requested_date)}
    except ExternalServiceError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc


@notifications_router.get("", summary="List authenticated notifications")
def list_notifications(page: int = Query(1, ge=1), limit: int = Query(20, ge=1, le=100), current_user: AuthenticatedUser = Depends(get_current_user), db: Session = Depends(get_db)):
    query = select(Notification).where(Notification.user_id == current_user.id).order_by(Notification.created_at.desc())
    rows = db.scalars(query.offset((page - 1) * limit).limit(limit)).all()
    return {"data": {"items": [NotificationRead.model_validate(row) for row in rows], "page": page, "limit": limit}}


@notifications_router.post("/{notification_id}/read", summary="Mark a notification read")
def mark_notification_read(notification_id: UUID, current_user: AuthenticatedUser = Depends(get_current_user), db: Session = Depends(get_db)):
    row = db.scalar(select(Notification).where(Notification.id == notification_id, Notification.user_id == current_user.id))
    if not row:
        raise HTTPException(status_code=404, detail="Notification not found")
    row.is_read = True
    db.commit()
    return {"data": NotificationRead.model_validate(row)}
