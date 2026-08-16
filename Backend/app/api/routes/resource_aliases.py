"""Canonical resource paths retained alongside nested trip paths."""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from app.core.security import AuthenticatedUser, get_current_user
from app.db.database import get_db
from app.models import Expense, ItineraryItem, JournalEntry, PackingItem, TripPhoto
from app.schemas import ExpenseRead, ExpenseUpdate, ItineraryRead, ItineraryUpdate, JournalRead, JournalUpdate, PackingRead, PackingUpdate, PhotoRead
from app.services.authorization import require_trip_access

router = APIRouter(tags=["Trips"])


@router.patch("/itinerary/{item_id}", summary="Update an itinerary item")
def update_itinerary(item_id: UUID, payload: ItineraryUpdate, current_user: AuthenticatedUser = Depends(get_current_user), db: Session = Depends(get_db)):
    row = db.get(ItineraryItem, item_id)
    if not row:
        raise HTTPException(status_code=404, detail="Itinerary item not found")
    require_trip_access(db, row.trip_id, current_user.id, write=True)
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(row, key, value)
    db.commit()
    db.refresh(row)
    return {"data": ItineraryRead.model_validate(row)}


@router.delete("/itinerary/{item_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete an itinerary item")
def delete_itinerary(item_id: UUID, current_user: AuthenticatedUser = Depends(get_current_user), db: Session = Depends(get_db)):
    row = db.get(ItineraryItem, item_id)
    if not row:
        raise HTTPException(status_code=404, detail="Itinerary item not found")
    require_trip_access(db, row.trip_id, current_user.id, write=True)
    db.delete(row)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.patch("/expenses/{expense_id}", summary="Update an owned expense")
def update_expense(expense_id: UUID, payload: ExpenseUpdate, current_user: AuthenticatedUser = Depends(get_current_user), db: Session = Depends(get_db)):
    row = db.get(Expense, expense_id)
    if not row:
        raise HTTPException(status_code=404, detail="Expense not found")
    require_trip_access(db, row.trip_id, current_user.id)
    if row.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the expense owner can modify it")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(row, key, value)
    db.commit()
    db.refresh(row)
    return {"data": ExpenseRead.model_validate(row)}


@router.delete("/expenses/{expense_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete an owned expense")
def delete_expense(expense_id: UUID, current_user: AuthenticatedUser = Depends(get_current_user), db: Session = Depends(get_db)):
    row = db.get(Expense, expense_id)
    if not row:
        raise HTTPException(status_code=404, detail="Expense not found")
    require_trip_access(db, row.trip_id, current_user.id)
    if row.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the expense owner can delete it")
    db.delete(row)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.patch("/packing/{item_id}", summary="Update a packing item")
def update_packing(item_id: UUID, payload: PackingUpdate, current_user: AuthenticatedUser = Depends(get_current_user), db: Session = Depends(get_db)):
    row = db.get(PackingItem, item_id)
    if not row:
        raise HTTPException(status_code=404, detail="Packing item not found")
    require_trip_access(db, row.trip_id, current_user.id)
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(row, key, value)
    db.commit()
    db.refresh(row)
    return {"data": PackingRead.model_validate(row)}


@router.delete("/packing/{item_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete a packing item")
def delete_packing(item_id: UUID, current_user: AuthenticatedUser = Depends(get_current_user), db: Session = Depends(get_db)):
    row = db.get(PackingItem, item_id)
    if not row:
        raise HTTPException(status_code=404, detail="Packing item not found")
    require_trip_access(db, row.trip_id, current_user.id)
    db.delete(row)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.patch("/journal/{entry_id}", summary="Update an owned journal entry")
def update_journal(entry_id: UUID, payload: JournalUpdate, current_user: AuthenticatedUser = Depends(get_current_user), db: Session = Depends(get_db)):
    row = db.get(JournalEntry, entry_id)
    if not row:
        raise HTTPException(status_code=404, detail="Journal entry not found")
    require_trip_access(db, row.trip_id, current_user.id)
    if row.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the journal author can modify it")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(row, key, value)
    db.commit()
    db.refresh(row)
    return {"data": JournalRead.model_validate(row)}


@router.delete("/journal/{entry_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete an owned journal entry")
def delete_journal(entry_id: UUID, current_user: AuthenticatedUser = Depends(get_current_user), db: Session = Depends(get_db)):
    row = db.get(JournalEntry, entry_id)
    if not row:
        raise HTTPException(status_code=404, detail="Journal entry not found")
    require_trip_access(db, row.trip_id, current_user.id)
    if row.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the journal author can delete it")
    db.delete(row)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.delete("/photos/{photo_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete an owned trip photo")
def delete_photo(photo_id: UUID, current_user: AuthenticatedUser = Depends(get_current_user), db: Session = Depends(get_db)):
    row = db.get(TripPhoto, photo_id)
    if not row:
        raise HTTPException(status_code=404, detail="Photo not found")
    require_trip_access(db, row.trip_id, current_user.id)
    if row.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the photo owner can delete it")
    db.delete(row)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
