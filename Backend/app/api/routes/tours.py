from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import get_current_profile
from app.db.database import get_db
from app.models import Profile, Tour, TourDeparture, TourReservationRequest
from app.schemas import DepartureRead, ReservationCreate, ReservationRead, TourRead
from app.services.audit_service import record_audit

router = APIRouter(prefix="/tours", tags=["Tours"])
reservation_router = APIRouter(prefix="/reservation-requests", tags=["Reservations"])


def public_tour(db: Session, tour_id: UUID) -> Tour:
    tour = db.scalar(select(Tour).where(Tour.id == tour_id, Tour.status == "published"))
    if tour is None:
        raise HTTPException(status_code=404, detail="Published tour not found")
    return tour


@router.get("", summary="List published tours")
def list_tours(
    destination_id: UUID | None = None,
    query: str | None = Query(None, max_length=120),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    stmt = select(Tour).where(Tour.status == "published")
    if destination_id:
        stmt = stmt.where(Tour.destination_id == destination_id)
    if query:
        stmt = stmt.where(Tour.title.ilike(f"%{query}%"))
    rows = db.scalars(stmt.order_by(Tour.created_at.desc()).offset((page - 1) * limit).limit(limit)).all()
    return {"data": [TourRead.model_validate(row) for row in rows], "page": page, "limit": limit}


@router.get("/{tour_id}", summary="Get a published tour")
def get_tour(tour_id: UUID, db: Session = Depends(get_db)):
    return {"data": TourRead.model_validate(public_tour(db, tour_id))}


@router.get("/{tour_id}/departures", summary="List departures for a published tour")
def get_departures(tour_id: UUID, db: Session = Depends(get_db)):
    tour = public_tour(db, tour_id)
    rows = db.scalars(select(TourDeparture).where(TourDeparture.tour_id == tour.id, TourDeparture.status == "scheduled").order_by(TourDeparture.start_date)).all()
    return {"data": [DepartureRead.model_validate(row) for row in rows]}


@router.get("/{tour_id}/checkout-link", summary="Get the provider's external checkout link")
def checkout_link(tour_id: UUID, db: Session = Depends(get_db)):
    tour = public_tour(db, tour_id)
    if not tour.external_checkout_url:
        raise HTTPException(status_code=404, detail="This tour has no external checkout link")
    return {"data": {"tour_id": tour.id, "checkout_url": tour.external_checkout_url, "payment_processed_by_porikroma": False}}


@router.post("/{tour_id}/reservation-requests", status_code=status.HTTP_201_CREATED, summary="Request seats on a published tour")
def create_reservation(tour_id: UUID, payload: ReservationCreate, profile: Profile = Depends(get_current_profile), db: Session = Depends(get_db)):
    tour = public_tour(db, tour_id)
    departure = db.scalar(select(TourDeparture).where(TourDeparture.id == payload.departure_id, TourDeparture.tour_id == tour.id).with_for_update())
    if departure is None or departure.status != "scheduled":
        raise HTTPException(status_code=404, detail="Scheduled departure not found")
    if departure.remaining_capacity < payload.traveler_count:
        raise HTTPException(status_code=409, detail="Not enough remaining capacity")
    existing = db.scalar(select(TourReservationRequest).where(
        TourReservationRequest.departure_id == departure.id,
        TourReservationRequest.traveler_id == profile.id,
        TourReservationRequest.status.in_(["requested", "approved"]),
    ))
    if existing:
        raise HTTPException(status_code=409, detail="You already have an active request for this departure")
    departure.remaining_capacity -= payload.traveler_count
    request = TourReservationRequest(tour_id=tour.id, departure_id=departure.id, traveler_id=profile.id, traveler_count=payload.traveler_count)
    db.add(request)
    record_audit(db, actor_id=profile.id, action="reservation_request_created", resource_type="reservation_request", metadata={"tour_id": str(tour.id)})
    db.commit()
    db.refresh(request)
    return {"data": ReservationRead.model_validate(request)}


@reservation_router.get("", summary="List my reservation requests")
def list_my_reservations(profile: Profile = Depends(get_current_profile), db: Session = Depends(get_db)):
    rows = db.scalars(select(TourReservationRequest).where(TourReservationRequest.traveler_id == profile.id).order_by(TourReservationRequest.created_at.desc())).all()
    return {"data": [ReservationRead.model_validate(row) for row in rows]}


@reservation_router.get("/{request_id}", summary="Get one of my reservation requests")
def get_my_reservation(request_id: UUID, profile: Profile = Depends(get_current_profile), db: Session = Depends(get_db)):
    row = db.scalar(select(TourReservationRequest).where(TourReservationRequest.id == request_id, TourReservationRequest.traveler_id == profile.id))
    if row is None:
        raise HTTPException(status_code=404, detail="Reservation request not found")
    return {"data": ReservationRead.model_validate(row)}


@reservation_router.delete("/{request_id}", summary="Cancel one of my reservation requests")
def cancel_my_reservation(request_id: UUID, profile: Profile = Depends(get_current_profile), db: Session = Depends(get_db)):
    row = db.scalar(select(TourReservationRequest).where(TourReservationRequest.id == request_id, TourReservationRequest.traveler_id == profile.id).with_for_update())
    if row is None:
        raise HTTPException(status_code=404, detail="Reservation request not found")
    if row.status not in {"requested", "approved"}:
        raise HTTPException(status_code=409, detail="Reservation request is already closed")
    row.status = "cancelled"
    row.departure.remaining_capacity += row.traveler_count
    record_audit(db, actor_id=profile.id, action="reservation_request_cancelled", resource_type="reservation_request", resource_id=row.id)
    db.commit()
    return {"data": {"cancelled": True}}
