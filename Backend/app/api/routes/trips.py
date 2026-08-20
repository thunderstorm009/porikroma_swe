from __future__ import annotations

from datetime import date
from decimal import Decimal
from uuid import UUID

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy import delete, func, select
from sqlalchemy.orm import Session, selectinload

from app.core.security import AuthenticatedUser, get_current_profile, get_current_user
from app.db.database import get_db
from app.models import (
    Expense,
    ItineraryItem,
    JournalEntry,
    PackingItem,
    Profile,
    Trip,
    TripMember,
    TripMessage,
    TripPhoto,
    TripJoinRequest,
)
from app.schemas import (
    BudgetSummary,
    ExpenseCreate,
    ExpenseRead,
    ExpenseUpdate,
    ItineraryCreate,
    ItineraryRead,
    ItineraryUpdate,
    JournalCreate,
    JournalRead,
    JournalUpdate,
    MemberAdd,
    MessageCreate,
    MessageRead,
    PackingCreate,
    PackingRead,
    PackingUpdate,
    PhotoCreate,
    PhotoRead,
    TripCreate,
    TripMemberRead,
    TripRead,
    TripUpdate,
    JoinRequestCreate,
    JoinRequestRead,
    JoinRequestUpdate,
)
from app.services.authorization import get_trip, membership, require_trip_access, require_trip_owner

router = APIRouter(prefix="/trips", tags=["Trips"])


def trip_query():
    return select(Trip).options(
        selectinload(Trip.destination),
        selectinload(Trip.members).selectinload(TripMember.user),
    )


def trip_read(trip: Trip) -> TripRead:
    return TripRead.model_validate(trip)


@router.get("", summary="List accessible trips")
def list_trips(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    discover: bool = Query(False),
    travel_type: Optional[str] = Query(None),
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if discover:
        base = select(Trip.id).where(Trip.visibility == 'public', Trip.status == 'planning')
    else:
        base = select(Trip.id).join(TripMember, TripMember.trip_id == Trip.id).where(TripMember.user_id == current_user.id)
    if travel_type:
        base = base.where(Trip.travel_type == travel_type)
    
    total = db.scalar(select(func.count()).select_from(base.subquery())) or 0
    ids = db.scalars(base.order_by(Trip.created_at.desc()).offset((page - 1) * limit).limit(limit)).all()
    trips = db.scalars(trip_query().where(Trip.id.in_(ids)).order_by(Trip.created_at.desc())).unique().all() if ids else []
    return {"data": {"items": [trip_read(item) for item in trips], "page": page, "limit": limit, "total": total}}


@router.get("/{trip_id}", summary="Get a trip")
def get_trip_detail(trip_id: UUID, current_user: AuthenticatedUser = Depends(get_current_user), db: Session = Depends(get_db)):
    require_trip_access(db, trip_id, current_user.id)
    trip = db.scalar(trip_query().where(Trip.id == trip_id))
    return {"data": trip_read(trip)}


@router.post("", status_code=status.HTTP_201_CREATED, summary="Create a trip")
def create_trip(payload: TripCreate, profile: Profile = Depends(get_current_profile), db: Session = Depends(get_db)):
    trip = Trip(owner_id=profile.id, **payload.model_dump())
    db.add(trip)
    db.flush()
    db.add(TripMember(trip_id=trip.id, user_id=profile.id, role="owner"))
    db.commit()
    trip = db.scalar(trip_query().where(Trip.id == trip.id))
    return {"data": trip_read(trip)}


@router.patch("/{trip_id}", summary="Update a trip")
def update_trip(trip_id: UUID, payload: TripUpdate, current_user: AuthenticatedUser = Depends(get_current_user), db: Session = Depends(get_db)):
    _, member = require_trip_access(db, trip_id, current_user.id, write=True)
    trip = get_trip(db, trip_id)
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(trip, key, value)
    if member.role == "admin" and payload.status == "cancelled":
        raise HTTPException(status_code=403, detail="Only the trip owner can cancel a trip")
    db.commit()
    db.refresh(trip)
    return {"data": trip_read(trip)}


@router.delete("/{trip_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete a trip")
def delete_trip(trip_id: UUID, current_user: AuthenticatedUser = Depends(get_current_user), db: Session = Depends(get_db)):
    trip = require_trip_owner(db, trip_id, current_user.id)
    db.delete(trip)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/{trip_id}/members", summary="List trip members")
def list_members(trip_id: UUID, current_user: AuthenticatedUser = Depends(get_current_user), db: Session = Depends(get_db)):
    require_trip_access(db, trip_id, current_user.id)
    members = db.scalars(select(TripMember).options(selectinload(TripMember.user)).where(TripMember.trip_id == trip_id).order_by(TripMember.joined_at)).all()
    return {"data": [TripMemberRead.model_validate(member) for member in members]}


@router.post("/{trip_id}/members", status_code=status.HTTP_201_CREATED, summary="Add a trip member")
def add_member(trip_id: UUID, payload: MemberAdd, current_user: AuthenticatedUser = Depends(get_current_user), db: Session = Depends(get_db)):
    require_trip_access(db, trip_id, current_user.id, write=True)
    if not db.get(Profile, payload.user_id):
        raise HTTPException(status_code=404, detail="Profile to add was not found")
    if membership(db, trip_id, payload.user_id):
        raise HTTPException(status_code=409, detail="User is already a trip member")
    member = TripMember(trip_id=trip_id, user_id=payload.user_id, role=payload.role)
    db.add(member)
    db.commit()
    db.refresh(member)
    return {"data": TripMemberRead.model_validate(member)}


@router.delete("/{trip_id}/members/{user_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Remove a trip member")
def remove_member(trip_id: UUID, user_id: UUID, current_user: AuthenticatedUser = Depends(get_current_user), db: Session = Depends(get_db)):
    require_trip_access(db, trip_id, current_user.id, write=True)
    member = membership(db, trip_id, user_id)
    if not member:
        raise HTTPException(status_code=404, detail="Trip member not found")
    if member.role == "owner":
        raise HTTPException(status_code=400, detail="The trip owner cannot be removed")
    db.delete(member)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/{trip_id}/itinerary", summary="List itinerary items")
def list_itinerary(trip_id: UUID, current_user: AuthenticatedUser = Depends(get_current_user), db: Session = Depends(get_db)):
    require_trip_access(db, trip_id, current_user.id)
    items = db.scalars(select(ItineraryItem).where(ItineraryItem.trip_id == trip_id).order_by(ItineraryItem.date, ItineraryItem.order_index, ItineraryItem.start_time)).all()
    return {"data": [ItineraryRead.model_validate(item) for item in items]}


@router.post("/{trip_id}/itinerary", status_code=status.HTTP_201_CREATED, summary="Add an itinerary item")
def add_itinerary(trip_id: UUID, payload: ItineraryCreate, current_user: AuthenticatedUser = Depends(get_current_user), db: Session = Depends(get_db)):
    require_trip_access(db, trip_id, current_user.id)
    item = ItineraryItem(trip_id=trip_id, **payload.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return {"data": ItineraryRead.model_validate(item)}


@router.patch("/itinerary/{item_id}", summary="Update an itinerary item")
def update_itinerary(item_id: UUID, payload: ItineraryUpdate, current_user: AuthenticatedUser = Depends(get_current_user), db: Session = Depends(get_db)):
    item = db.get(ItineraryItem, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Itinerary item not found")
    require_trip_access(db, item.trip_id, current_user.id, write=True)
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(item, key, value)
    db.commit()
    db.refresh(item)
    return {"data": ItineraryRead.model_validate(item)}


@router.delete("/itinerary/{item_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete an itinerary item")
def delete_itinerary(item_id: UUID, current_user: AuthenticatedUser = Depends(get_current_user), db: Session = Depends(get_db)):
    item = db.get(ItineraryItem, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Itinerary item not found")
    require_trip_access(db, item.trip_id, current_user.id, write=True)
    db.delete(item)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/{trip_id}/expenses", summary="List trip expenses")
def list_expenses(trip_id: UUID, current_user: AuthenticatedUser = Depends(get_current_user), db: Session = Depends(get_db)):
    require_trip_access(db, trip_id, current_user.id)
    rows = db.scalars(select(Expense).options(selectinload(Expense.user)).where(Expense.trip_id == trip_id).order_by(Expense.expense_date.desc(), Expense.created_at.desc())).all()
    return {"data": [ExpenseRead.model_validate(row) for row in rows]}


@router.post("/{trip_id}/expenses", status_code=status.HTTP_201_CREATED, summary="Add a trip expense")
def add_expense(trip_id: UUID, payload: ExpenseCreate, profile: Profile = Depends(get_current_profile), db: Session = Depends(get_db)):
    require_trip_access(db, trip_id, profile.id)
    expense = Expense(trip_id=trip_id, user_id=profile.id, **payload.model_dump())
    db.add(expense)
    db.commit()
    db.refresh(expense)
    expense = db.scalar(select(Expense).options(selectinload(Expense.user)).where(Expense.id == expense.id))
    return {"data": ExpenseRead.model_validate(expense)}


@router.patch("/expenses/{expense_id}", summary="Update an owned expense")
def update_expense(expense_id: UUID, payload: ExpenseUpdate, current_user: AuthenticatedUser = Depends(get_current_user), db: Session = Depends(get_db)):
    expense = db.get(Expense, expense_id)
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    require_trip_access(db, expense.trip_id, current_user.id)
    if expense.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the expense owner can modify it")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(expense, key, value)
    db.commit()
    db.refresh(expense)
    return {"data": ExpenseRead.model_validate(expense)}


@router.delete("/expenses/{expense_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete an owned expense")
def delete_expense(expense_id: UUID, current_user: AuthenticatedUser = Depends(get_current_user), db: Session = Depends(get_db)):
    expense = db.get(Expense, expense_id)
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    require_trip_access(db, expense.trip_id, current_user.id)
    if expense.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the expense owner can delete it")
    db.delete(expense)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/{trip_id}/budget-summary", summary="Calculate a trip budget summary")
def budget_summary(trip_id: UUID, current_user: AuthenticatedUser = Depends(get_current_user), db: Session = Depends(get_db)):
    trip, _ = require_trip_access(db, trip_id, current_user.id)
    total = db.scalar(select(func.coalesce(func.sum(Expense.amount), 0)).where(Expense.trip_id == trip_id)) or Decimal("0")
    grouped = db.execute(select(Expense.category, func.sum(Expense.amount)).where(Expense.trip_id == trip_id).group_by(Expense.category)).all()
    budget = Decimal(trip.budget or 0)
    remaining = budget - Decimal(total)
    percent = (Decimal(total) / budget * 100) if budget else Decimal("0")
    result = BudgetSummary(total_budget=budget, total_spent=Decimal(total), remaining_budget=remaining, percentage_spent=percent.quantize(Decimal("0.01")), category_breakdown={category: Decimal(amount) for category, amount in grouped})
    return {"data": result}


@router.get("/{trip_id}/packing", summary="List packing items")
def list_packing(trip_id: UUID, current_user: AuthenticatedUser = Depends(get_current_user), db: Session = Depends(get_db)):
    require_trip_access(db, trip_id, current_user.id)
    rows = db.scalars(select(PackingItem).where(PackingItem.trip_id == trip_id).order_by(PackingItem.created_at)).all()
    return {"data": [PackingRead.model_validate(row) for row in rows]}


@router.post("/{trip_id}/packing", status_code=status.HTTP_201_CREATED, summary="Add a packing item")
def add_packing(trip_id: UUID, payload: PackingCreate, current_user: AuthenticatedUser = Depends(get_current_user), db: Session = Depends(get_db)):
    require_trip_access(db, trip_id, current_user.id)
    row = PackingItem(trip_id=trip_id, **payload.model_dump())
    db.add(row)
    db.commit()
    db.refresh(row)
    return {"data": PackingRead.model_validate(row)}


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


@router.get("/{trip_id}/journal", summary="List journal entries")
def list_journal(trip_id: UUID, current_user: AuthenticatedUser = Depends(get_current_user), db: Session = Depends(get_db)):
    require_trip_access(db, trip_id, current_user.id)
    rows = db.scalars(select(JournalEntry).where(JournalEntry.trip_id == trip_id).order_by(JournalEntry.entry_date.desc())).all()
    return {"data": [JournalRead.model_validate(row) for row in rows]}


@router.post("/{trip_id}/journal", status_code=status.HTTP_201_CREATED, summary="Create a journal entry")
def add_journal(trip_id: UUID, payload: JournalCreate, profile: Profile = Depends(get_current_profile), db: Session = Depends(get_db)):
    require_trip_access(db, trip_id, profile.id)
    row = JournalEntry(trip_id=trip_id, user_id=profile.id, **payload.model_dump())
    db.add(row)
    db.commit()
    db.refresh(row)
    return {"data": JournalRead.model_validate(row)}


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


@router.get("/{trip_id}/photos", summary="List trip photos")
def list_photos(trip_id: UUID, current_user: AuthenticatedUser = Depends(get_current_user), db: Session = Depends(get_db)):
    require_trip_access(db, trip_id, current_user.id)
    rows = db.scalars(select(TripPhoto).where(TripPhoto.trip_id == trip_id).order_by(TripPhoto.created_at.desc())).all()
    return {"data": [PhotoRead.model_validate(row) for row in rows]}


@router.post("/{trip_id}/photos", status_code=status.HTTP_201_CREATED, summary="Add a trip photo URL")
def add_photo(trip_id: UUID, payload: PhotoCreate, profile: Profile = Depends(get_current_profile), db: Session = Depends(get_db)):
    require_trip_access(db, trip_id, profile.id)
    row = TripPhoto(trip_id=trip_id, user_id=profile.id, **payload.model_dump())
    db.add(row)
    db.commit()
    db.refresh(row)
    return {"data": PhotoRead.model_validate(row)}


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


@router.get("/{trip_id}/messages", summary="List group messages")
def list_messages(trip_id: UUID, page: int = Query(1, ge=1), limit: int = Query(50, ge=1, le=100), current_user: AuthenticatedUser = Depends(get_current_user), db: Session = Depends(get_db)):
    require_trip_access(db, trip_id, current_user.id)
    total = db.scalar(select(func.count(TripMessage.id)).where(TripMessage.trip_id == trip_id)) or 0
    rows = db.scalars(select(TripMessage).options(selectinload(TripMessage.sender)).where(TripMessage.trip_id == trip_id).order_by(TripMessage.created_at.desc()).offset((page - 1) * limit).limit(limit)).all()
    rows.reverse()
    return {"data": {"items": [MessageRead.model_validate(row) for row in rows], "page": page, "limit": limit, "total": total}}


@router.post("/{trip_id}/messages", status_code=status.HTTP_201_CREATED, summary="Send a group message")
def send_message(trip_id: UUID, payload: MessageCreate, profile: Profile = Depends(get_current_profile), db: Session = Depends(get_db)):
    require_trip_access(db, trip_id, profile.id)
    row = TripMessage(trip_id=trip_id, sender_id=profile.id, content=payload.content)
    db.add(row)
    db.commit()
    db.refresh(row)
    return {"data": MessageRead.model_validate(row)}

@router.get("/{trip_id}/join-requests", summary="List join requests")
def list_join_requests(trip_id: UUID, current_user: AuthenticatedUser = Depends(get_current_user), db: Session = Depends(get_db)):
    require_trip_access(db, trip_id, current_user.id, write=True)
    requests = db.scalars(select(TripJoinRequest).options(selectinload(TripJoinRequest.user)).where(TripJoinRequest.trip_id == trip_id).order_by(TripJoinRequest.created_at.desc())).all()
    return {"data": [JoinRequestRead.model_validate(req) for req in requests]}

@router.post("/{trip_id}/join-requests", status_code=status.HTTP_201_CREATED, summary="Create a join request")
def create_join_request(trip_id: UUID, payload: JoinRequestCreate, current_user: AuthenticatedUser = Depends(get_current_user), db: Session = Depends(get_db)):
    trip = db.get(Trip, trip_id)
    if not trip or trip.visibility != "public":
        raise HTTPException(status_code=404, detail="Trip not found or not public")
    
    if membership(db, trip_id, current_user.id):
        raise HTTPException(status_code=409, detail="Already a member")
        
    existing = db.scalar(select(TripJoinRequest).where(TripJoinRequest.trip_id == trip_id, TripJoinRequest.user_id == current_user.id, TripJoinRequest.status == 'pending'))
    if existing:
        raise HTTPException(status_code=409, detail="Join request already pending")
        
    req = TripJoinRequest(trip_id=trip_id, user_id=current_user.id, message=payload.message, status='pending')
    db.add(req)
    db.commit()
    db.refresh(req)
    req = db.scalar(select(TripJoinRequest).options(selectinload(TripJoinRequest.user)).where(TripJoinRequest.id == req.id))
    return {"data": JoinRequestRead.model_validate(req)}

@router.patch("/{trip_id}/join-requests/{request_id}", summary="Update a join request")
def update_join_request(trip_id: UUID, request_id: UUID, payload: JoinRequestUpdate, current_user: AuthenticatedUser = Depends(get_current_user), db: Session = Depends(get_db)):
    require_trip_access(db, trip_id, current_user.id, write=True)
    req = db.get(TripJoinRequest, request_id)
    if not req or req.trip_id != trip_id:
        raise HTTPException(status_code=404, detail="Join request not found")
        
    if req.status != 'pending':
        raise HTTPException(status_code=400, detail="Request is already resolved")
        
    req.status = payload.status
    if payload.status == 'approved':
        if not membership(db, trip_id, req.user_id):
            db.add(TripMember(trip_id=trip_id, user_id=req.user_id, role="member"))
            
    db.commit()
    db.refresh(req)
    req = db.scalar(select(TripJoinRequest).options(selectinload(TripJoinRequest.user)).where(TripJoinRequest.id == req.id))
    return {"data": JoinRequestRead.model_validate(req)}
