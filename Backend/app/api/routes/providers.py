from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.permissions import require_approved_provider
from app.core.security import get_current_profile
from app.db.database import get_db
from app.models import ProviderDocument, ProviderProfile, Profile, Tour, TourDeparture, TourReservationRequest
from app.schemas import (
    DepartureCreate,
    DepartureRead,
    ProviderApplicationCreate,
    ProviderApplicationUpdate,
    ProviderDocumentCreate,
    ProviderDocumentRead,
    ProviderProfileRead,
    ReservationRead,
    ReservationUpdate,
    TourCreate,
    TourRead,
    TourUpdate,
)
from app.services.audit_service import record_audit

router = APIRouter(prefix="/providers", tags=["Providers"])


def provider_for(db: Session, profile_id: UUID) -> ProviderProfile:
    provider = db.scalar(select(ProviderProfile).where(ProviderProfile.user_id == profile_id))
    if provider is None:
        raise HTTPException(status_code=404, detail="Provider profile not found")
    return provider


@router.post("/apply", status_code=status.HTTP_201_CREATED, summary="Apply to become a tour provider")
def apply_provider(payload: ProviderApplicationCreate, profile: Profile = Depends(get_current_profile), db: Session = Depends(get_db)):
    existing = db.scalar(select(ProviderProfile).where(ProviderProfile.user_id == profile.id))
    if existing:
        raise HTTPException(status_code=409, detail="A provider application already exists")
    provider = ProviderProfile(user_id=profile.id, **payload.model_dump())
    db.add(provider)
    record_audit(db, actor_id=profile.id, action="provider_application_created", resource_type="provider_profile")
    db.commit()
    db.refresh(provider)
    return {"data": ProviderProfileRead.model_validate(provider)}


@router.get("/me", summary="Get my provider application")
def get_my_provider(profile: Profile = Depends(get_current_profile), db: Session = Depends(get_db)):
    return {"data": ProviderProfileRead.model_validate(provider_for(db, profile.id))}


@router.patch("/me", summary="Update my provider application")
def update_my_provider(payload: ProviderApplicationUpdate, profile: Profile = Depends(get_current_profile), db: Session = Depends(get_db)):
    provider = provider_for(db, profile.id)
    if provider.verification_status == "approved":
        raise HTTPException(status_code=409, detail="Approved provider details require an administrative review")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(provider, key, value)
    db.commit()
    db.refresh(provider)
    return {"data": ProviderProfileRead.model_validate(provider)}


@router.post("/me/submit", summary="Submit my provider application for review")
def submit_provider(profile: Profile = Depends(get_current_profile), db: Session = Depends(get_db)):
    provider = provider_for(db, profile.id)
    if provider.verification_status == "approved":
        raise HTTPException(status_code=409, detail="Provider is already approved")
    provider.verification_status = "pending"
    provider.submitted_at = datetime.now(timezone.utc)
    record_audit(db, actor_id=profile.id, action="provider_application_submitted", resource_type="provider_profile", resource_id=provider.id)
    db.commit()
    db.refresh(provider)
    return {"data": ProviderProfileRead.model_validate(provider)}


@router.get("/me/documents", summary="List my provider documents")
def list_documents(profile: Profile = Depends(get_current_profile), db: Session = Depends(get_db)):
    provider = provider_for(db, profile.id)
    rows = db.scalars(select(ProviderDocument).where(ProviderDocument.provider_id == provider.id).order_by(ProviderDocument.created_at.desc())).all()
    return {"data": [ProviderDocumentRead.model_validate(row) for row in rows]}


@router.post("/me/documents", status_code=status.HTTP_201_CREATED, summary="Upload a provider document URL")
def add_document(payload: ProviderDocumentCreate, profile: Profile = Depends(get_current_profile), db: Session = Depends(get_db)):
    provider = provider_for(db, profile.id)
    if provider.verification_status == "approved":
        raise HTTPException(status_code=409, detail="Approved provider documents require an administrative review")
    document = ProviderDocument(provider_id=provider.id, **payload.model_dump())
    db.add(document)
    record_audit(db, actor_id=profile.id, action="provider_document_added", resource_type="provider_document")
    db.commit()
    db.refresh(document)
    return {"data": ProviderDocumentRead.model_validate(document)}


@router.get("/me/tours", summary="List my tours")
def list_my_tours(profile: Profile = Depends(require_approved_provider), db: Session = Depends(get_db)):
    provider = provider_for(db, profile.id)
    tours = db.scalars(select(Tour).where(Tour.provider_id == provider.id).order_by(Tour.created_at.desc())).all()
    return {"data": [TourRead.model_validate(tour) for tour in tours]}


@router.post("/me/tours", status_code=status.HTTP_201_CREATED, summary="Create a draft tour")
def create_tour(payload: TourCreate, profile: Profile = Depends(require_approved_provider), db: Session = Depends(get_db)):
    provider = provider_for(db, profile.id)
    tour = Tour(provider_id=provider.id, **payload.model_dump())
    db.add(tour)
    record_audit(db, actor_id=profile.id, action="tour_created", resource_type="tour")
    db.commit()
    db.refresh(tour)
    return {"data": TourRead.model_validate(tour)}


@router.patch("/me/tours/{tour_id}", summary="Update one of my tours")
def update_tour(tour_id: UUID, payload: TourUpdate, profile: Profile = Depends(require_approved_provider), db: Session = Depends(get_db)):
    provider = provider_for(db, profile.id)
    tour = db.scalar(select(Tour).where(Tour.id == tour_id, Tour.provider_id == provider.id))
    if tour is None:
        raise HTTPException(status_code=404, detail="Tour not found")
    if tour.status in {"archived", "pending_review"}:
        raise HTTPException(status_code=409, detail="This tour cannot be edited in its current state")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(tour, key, value)
    db.commit()
    db.refresh(tour)
    return {"data": TourRead.model_validate(tour)}


@router.post("/me/tours/{tour_id}/submit", summary="Submit a tour for catalog review")
def submit_tour(tour_id: UUID, profile: Profile = Depends(require_approved_provider), db: Session = Depends(get_db)):
    provider = provider_for(db, profile.id)
    tour = db.scalar(select(Tour).where(Tour.id == tour_id, Tour.provider_id == provider.id))
    if tour is None:
        raise HTTPException(status_code=404, detail="Tour not found")
    if tour.status not in {"draft", "rejected", "paused"}:
        raise HTTPException(status_code=409, detail="Tour is not ready for submission")
    tour.status = "pending_review"
    record_audit(db, actor_id=profile.id, action="tour_submitted_for_review", resource_type="tour", resource_id=tour.id)
    db.commit()
    return {"data": TourRead.model_validate(tour)}


@router.post("/me/tours/{tour_id}/departures", status_code=status.HTTP_201_CREATED, summary="Create a tour departure")
def create_departure(tour_id: UUID, payload: DepartureCreate, profile: Profile = Depends(require_approved_provider), db: Session = Depends(get_db)):
    provider = provider_for(db, profile.id)
    tour = db.scalar(select(Tour).where(Tour.id == tour_id, Tour.provider_id == provider.id))
    if tour is None:
        raise HTTPException(status_code=404, detail="Tour not found")
    capacity = payload.capacity or tour.capacity
    departure = TourDeparture(tour_id=tour.id, start_date=payload.start_date, end_date=payload.end_date, capacity=capacity, remaining_capacity=capacity)
    db.add(departure)
    db.commit()
    db.refresh(departure)
    return {"data": DepartureRead.model_validate(departure)}


@router.get("/me/tours/{tour_id}/departures", summary="List departures for one of my tours")
def list_departures(tour_id: UUID, profile: Profile = Depends(require_approved_provider), db: Session = Depends(get_db)):
    provider = provider_for(db, profile.id)
    tour = db.scalar(select(Tour).where(Tour.id == tour_id, Tour.provider_id == provider.id))
    if tour is None:
        raise HTTPException(status_code=404, detail="Tour not found")
    rows = db.scalars(select(TourDeparture).where(TourDeparture.tour_id == tour.id).order_by(TourDeparture.start_date)).all()
    return {"data": [DepartureRead.model_validate(row) for row in rows]}


@router.get("/me/reservation-requests", summary="List reservation requests for my tours")
def provider_reservations(profile: Profile = Depends(require_approved_provider), db: Session = Depends(get_db)):
    provider = provider_for(db, profile.id)
    rows = db.scalars(select(TourReservationRequest).join(Tour).where(Tour.provider_id == provider.id).order_by(TourReservationRequest.created_at.desc())).all()
    return {"data": [ReservationRead.model_validate(row) for row in rows]}


@router.patch("/me/reservation-requests/{request_id}", summary="Process a reservation request")
def update_reservation(request_id: UUID, payload: ReservationUpdate, profile: Profile = Depends(require_approved_provider), db: Session = Depends(get_db)):
    provider = provider_for(db, profile.id)
    request = db.scalar(select(TourReservationRequest).join(Tour).where(TourReservationRequest.id == request_id, Tour.provider_id == provider.id))
    if request is None:
        raise HTTPException(status_code=404, detail="Reservation request not found")
    if payload.status == "cancelled":
        raise HTTPException(status_code=400, detail="Travelers cancel their own reservation requests")
    if request.status not in {"requested", "approved"}:
        raise HTTPException(status_code=409, detail="Reservation request is already closed")
    if payload.status == "approved" and request.status == "requested":
        request.status = "approved"
    elif payload.status == "rejected" and request.status in {"requested", "approved"}:
        if request.status == "approved" or request.status == "requested":
            request.departure.remaining_capacity += request.traveler_count
        request.status = "rejected"
    elif payload.status == "completed":
        request.status = "completed"
    if payload.external_reference is not None:
        request.external_reference = payload.external_reference
    if payload.provider_notes is not None:
        request.provider_notes = payload.provider_notes
    record_audit(db, actor_id=profile.id, action="reservation_request_updated", resource_type="reservation_request", resource_id=request.id, metadata={"status": request.status})
    db.commit()
    db.refresh(request)
    return {"data": ReservationRead.model_validate(request)}
