from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models import Attraction, Destination, Hotel, Restaurant
from app.schemas import DestinationRead, Page, PlaceRead

router = APIRouter(prefix="/destinations", tags=["Destinations"])


@router.get("", summary="List destinations")
def list_destinations(query: str | None = Query(None, max_length=100), db: Session = Depends(get_db)):
    stmt = select(Destination).order_by(Destination.name)
    if query:
        stmt = stmt.where(Destination.name.ilike(f"%{query}%"))
    return {"data": [DestinationRead.model_validate(item) for item in db.scalars(stmt).all()]}


@router.get("/hotels", summary="List all hotels")
def list_all_hotels(destination_id: UUID | None = None, db: Session = Depends(get_db)):
    stmt = select(Hotel).order_by(Hotel.name)
    if destination_id:
        stmt = stmt.where(Hotel.destination_id == destination_id)
    return {"data": [PlaceRead.model_validate(item) for item in db.scalars(stmt).all()]}


@router.get("/restaurants", summary="List all restaurants")
def list_all_restaurants(destination_id: UUID | None = None, db: Session = Depends(get_db)):
    stmt = select(Restaurant).order_by(Restaurant.name)
    if destination_id:
        stmt = stmt.where(Restaurant.destination_id == destination_id)
    return {"data": [PlaceRead.model_validate(item) for item in db.scalars(stmt).all()]}


@router.get("/attractions", summary="List all attractions")
def list_all_attractions(destination_id: UUID | None = None, db: Session = Depends(get_db)):
    stmt = select(Attraction).order_by(Attraction.name)
    if destination_id:
        stmt = stmt.where(Attraction.destination_id == destination_id)
    return {"data": [PlaceRead.model_validate(item) for item in db.scalars(stmt).all()]}


@router.get("/{destination_id}", summary="Get a destination")
def get_destination(destination_id: UUID, db: Session = Depends(get_db)):
    item = db.get(Destination, destination_id)
    if not item:
        raise HTTPException(status_code=404, detail="Destination not found")
    return {"data": DestinationRead.model_validate(item)}


def places(model, destination_id: UUID, db: Session):
    rows = db.scalars(select(model).where(model.destination_id == destination_id).order_by(model.name)).all()
    return {"data": [PlaceRead.model_validate(row) for row in rows]}


@router.get("/{destination_id}/hotels", summary="List hotels for a destination")
def list_hotels(destination_id: UUID, db: Session = Depends(get_db)):
    return places(Hotel, destination_id, db)


@router.get("/{destination_id}/restaurants", summary="List restaurants for a destination")
def list_restaurants(destination_id: UUID, db: Session = Depends(get_db)):
    return places(Restaurant, destination_id, db)


@router.get("/{destination_id}/attractions", summary="List attractions for a destination")
def list_attractions(destination_id: UUID, db: Session = Depends(get_db)):
    return places(Attraction, destination_id, db)
