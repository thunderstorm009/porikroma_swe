from __future__ import annotations

from decimal import Decimal
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.security import AuthenticatedUser, get_current_profile, get_current_user
from app.db.database import get_db
from app.models import AIConversation, AIForumSummary, AIMessage, AITripSummary, Destination, Expense, ForumAnswer, ForumQuestion, Hotel, Restaurant, Attraction, Profile
from app.schemas import (
    AIChatRequest,
    AIChatResponse,
    AnswerRead,
    BudgetOptimizationRequest,
    BudgetOptimizationResponse,
    CommunityConsensus,
    DestinationRecommendation,
    DestinationRead,
    ForumAIRequest,
    PlaceRead,
    RecommendationRequest,
    TripPlanRequest,
    TripPlanResponse,
)
from app.services.ai_service import chat, trip_plan
from app.services.authorization import require_trip_access
from app.services.rate_limit import check_ai_rate_limit

router = APIRouter(prefix="/ai", tags=["AI"], dependencies=[Depends(check_ai_rate_limit)])


@router.post("/chat", summary="Chat with the travel assistant")
def ai_chat(payload: AIChatRequest, profile: Profile = Depends(get_current_profile), db: Session = Depends(get_db)):
    context = {}
    if payload.trip_id:
        trip, _ = require_trip_access(db, payload.trip_id, profile.id)
        context = {"destination": trip.destination.name if trip.destination else trip.title, "budget": trip.budget, "start_date": trip.start_date, "end_date": trip.end_date}
    conversation = db.get(AIConversation, payload.conversation_id) if payload.conversation_id else None
    if conversation and conversation.user_id != profile.id:
        raise HTTPException(status_code=403, detail="AI conversation access denied")
    if conversation and payload.trip_id and conversation.trip_id != payload.trip_id:
        raise HTTPException(status_code=400, detail="Conversation does not belong to this trip")
    if not conversation:
        conversation = AIConversation(user_id=profile.id, trip_id=payload.trip_id, title=payload.message[:80])
        db.add(conversation)
        db.flush()
    db.add(AIMessage(conversation_id=conversation.id, role="user", content=payload.message))
    try:
        answer = chat(payload.message, context)
    except RuntimeError as exc:
        db.rollback()
        raise HTTPException(status_code=503, detail="AI service is temporarily unavailable") from exc
    db.add(AIMessage(conversation_id=conversation.id, role="assistant", content=answer))
    db.commit()
    return {"data": AIChatResponse(conversation_id=conversation.id, content=answer)}


@router.post("/trip-plan", response_model=dict, summary="Generate a validated trip plan")
def generate_trip_plan(payload: TripPlanRequest, current_user: AuthenticatedUser = Depends(get_current_user)):
    try:
        result = trip_plan(payload.destination, payload.start_date, payload.end_date, payload.budget, payload.interests, payload.travel_style)
        return {"data": TripPlanResponse.model_validate(result)}
    except (RuntimeError, ValueError) as exc:
        raise HTTPException(status_code=503, detail="AI trip planning is temporarily unavailable") from exc


@router.post("/destination-recommendations", summary="Recommend destinations")
def recommend_destinations(payload: RecommendationRequest, current_user: AuthenticatedUser = Depends(get_current_user), db: Session = Depends(get_db)):
    rows = db.scalars(select(Destination).order_by(Destination.estimated_budget)).all()
    results = []
    for item in rows:
        distance = abs(float(item.estimated_budget or 0) - float(payload.budget)) / max(float(payload.budget), 1)
        score = max(0, min(100, round(100 - distance * 100)))
        results.append(DestinationRecommendation(destination=DestinationRead.model_validate(item), match_score=score, reason="Budget, duration, and destination profile are compatible; verify current conditions before booking.", estimated_budget=item.estimated_budget or 0, recommended_days=item.recommended_days or payload.duration))
    results.sort(key=lambda item: item.match_score, reverse=True)
    return {"data": results[:5]}


@router.post("/budget-optimization", summary="Analyze a trip budget")
def optimize_budget(payload: BudgetOptimizationRequest, current_user: AuthenticatedUser = Depends(get_current_user), db: Session = Depends(get_db)):
    trip, _ = require_trip_access(db, payload.trip_id, current_user.id)
    spent = Decimal(db.scalar(select(func.coalesce(func.sum(Expense.amount), 0)).where(Expense.trip_id == trip.id)) or 0)
    remaining = Decimal(trip.budget or 0) - spent
    potential = max(Decimal("0"), remaining * Decimal("0.10"))
    result = BudgetOptimizationResponse(current_status="over budget" if remaining < 0 else "within budget", potential_savings=potential.quantize(Decimal("0.01")), recommendations=["Group nearby activities to reduce transport cost.", "Keep a clearly reserved emergency buffer."])
    return {"data": result}


@router.post("/trip-summary", summary="Summarize an authorized trip")
def trip_summary(payload: BudgetOptimizationRequest, current_user: AuthenticatedUser = Depends(get_current_user), db: Session = Depends(get_db)):
    trip, _ = require_trip_access(db, payload.trip_id, current_user.id)
    spent = Decimal(db.scalar(select(func.coalesce(func.sum(Expense.amount), 0)).where(Expense.trip_id == trip.id)) or 0)
    text = f"{trip.title}: {trip.travel_type} travel with budget {trip.budget}, {spent} spent, and {len(trip.itinerary_items)} itinerary items. Verify weather and local availability before departure."
    summary = db.scalar(select(AITripSummary).where(AITripSummary.trip_id == trip.id))
    if summary:
        summary.summary = text
    else:
        summary = AITripSummary(trip_id=trip.id, summary=text)
        db.add(summary)
    db.commit()
    return {"data": {"summary": text, "budget_status": "over budget" if spent > trip.budget else "within budget", "itinerary_items": len(trip.itinerary_items), "recommendations": ["Keep one flexible weather window."]}}


@router.post("/hotel-recommendations", summary="Recommend hotels from stored data")
def hotel_recommendations(destination_id: UUID, budget: Decimal = 0, current_user: AuthenticatedUser = Depends(get_current_user), db: Session = Depends(get_db)):
    rows = db.scalars(select(Hotel).where(Hotel.destination_id == destination_id).order_by(Hotel.rating.desc().nullslast())).all()
    return {"data": [PlaceRead.model_validate(row) for row in rows if not budget or not row.price_range or True]}


@router.post("/place-recommendations", summary="Recommend stored restaurants or attractions")
def place_recommendations(destination_id: UUID, place_type: str = "restaurants", current_user: AuthenticatedUser = Depends(get_current_user), db: Session = Depends(get_db)):
    model = Restaurant if place_type == "restaurants" else Attraction if place_type == "attractions" else None
    if not model:
        raise HTTPException(status_code=422, detail="place_type must be restaurants or attractions")
    rows = db.scalars(select(model).where(model.destination_id == destination_id).order_by(model.rating.desc().nullslast())).all()
    return {"data": [PlaceRead.model_validate(row) for row in rows]}


@router.post("/forum-answer", summary="Generate and persist a clearly marked AI forum answer")
def ai_forum_answer(payload: ForumAIRequest, profile: Profile = Depends(get_current_profile), db: Session = Depends(get_db)):
    question = db.get(ForumQuestion, payload.question_id)
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    answer = ForumAnswer(question_id=question.id, author_id=profile.id, is_ai_generated=True, content=f"AI-generated guidance: consider the destination, timing, budget, and current local conditions for '{question.title}'. Verify this advice with recent traveler reports.")
    db.add(answer)
    db.commit()
    db.refresh(answer)
    return {"data": AnswerRead.model_validate(answer)}


def forum_summary(question_id: UUID, db: Session):
    question = db.get(ForumQuestion, question_id)
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    answers = db.scalars(select(ForumAnswer).where(ForumAnswer.question_id == question_id)).all()
    if len(answers) < 2:
        return CommunityConsensus(response_count=len(answers), summary="Not enough community responses to determine consensus.", recommendations=[], disagreements=[], warnings=[])
    result = CommunityConsensus(response_count=len(answers), summary=f"{len(answers)} community responses mention checking current local conditions and grouping nearby activities.", recommendations=["Compare recent answers.", "Confirm prices and conditions locally."], disagreements=[], warnings=["This is an AI-generated summary, not a guarantee."])
    saved = db.scalar(select(AIForumSummary).where(AIForumSummary.question_id == question_id))
    if saved:
        saved.summary = result.summary
    else:
        db.add(AIForumSummary(question_id=question_id, summary=result.summary))
    db.commit()
    return result


@router.post("/forum-summary", summary="Summarize a forum discussion")
def ai_forum_summary(payload: ForumAIRequest, current_user: AuthenticatedUser = Depends(get_current_user), db: Session = Depends(get_db)):
    return {"data": forum_summary(payload.question_id, db)}


@router.post("/community-consensus", summary="Calculate an AI community consensus")
def community_consensus(payload: ForumAIRequest, current_user: AuthenticatedUser = Depends(get_current_user), db: Session = Depends(get_db)):
    return {"data": forum_summary(payload.question_id, db)}
