"""Pydantic request/response contracts for the public API."""

from __future__ import annotations

from datetime import date, datetime, time
from decimal import Decimal
from typing import Generic, Literal, Optional, TypeVar
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, model_validator


class APIModel(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)


T = TypeVar("T")


class Envelope(BaseModel, Generic[T]):
    data: T


class Page(APIModel):
    page: int
    limit: int
    total: int
    items: list


class ProfileRead(APIModel):
    id: UUID
    username: Optional[str] = None
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None
    bio: Optional[str] = None
    account_status: str = "active"
    email: Optional[str] = None
    role: str = "traveler"
    contribution_count: int = 0
    created_at: datetime
    updated_at: datetime


class ProfileUpdate(APIModel):
    username: Optional[str] = Field(default=None, min_length=2, max_length=80)
    full_name: Optional[str] = Field(default=None, max_length=160)
    avatar_url: Optional[str] = Field(default=None, max_length=500)
    bio: Optional[str] = Field(default=None, max_length=2000)


class RoleRead(APIModel):
    name: str
    description: Optional[str] = None


class UserRoleRead(APIModel):
    role: RoleRead
    granted_at: datetime
    revoked_at: Optional[datetime] = None


class MyAccessRead(APIModel):
    profile: ProfileRead
    roles: list[str]
    provider: Optional["ProviderProfileRead"] = None


class DestinationRead(APIModel):
    id: UUID
    name: str
    country: str
    description: Optional[str] = None
    latitude: Optional[Decimal] = None
    longitude: Optional[Decimal] = None
    image_url: Optional[str] = None
    estimated_budget: Optional[Decimal] = None
    recommended_days: Optional[int] = None


class PlaceRead(APIModel):
    id: UUID
    destination_id: UUID
    name: str
    description: Optional[str] = None
    address: Optional[str] = None
    latitude: Optional[Decimal] = None
    longitude: Optional[Decimal] = None
    image_url: Optional[str] = None
    rating: Optional[Decimal] = None
    price_range: Optional[str] = None
    category: Optional[str] = None


class TripMemberRead(APIModel):
    id: UUID
    trip_id: UUID
    user_id: UUID
    role: str
    joined_at: datetime
    user: Optional[ProfileRead] = None


class TripCreate(APIModel):
    title: str = Field(min_length=1, max_length=200)
    description: Optional[str] = None
    destination_id: Optional[UUID] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    travel_type: Literal["solo", "group"] = "solo"
    traveler_count: int = Field(default=1, ge=1, le=100)
    budget: Decimal = Field(default=Decimal("0"), ge=0, max_digits=12, decimal_places=2)
    status: Literal["planning", "active", "completed", "cancelled"] = "planning"

    @model_validator(mode="after")
    def valid_dates(self):
        if self.start_date and self.end_date and self.end_date < self.start_date:
            raise ValueError("end_date must be on or after start_date")
        if self.travel_type == "solo" and self.traveler_count != 1:
            self.traveler_count = 1
        return self


class TripUpdate(APIModel):
    title: Optional[str] = Field(default=None, min_length=1, max_length=200)
    description: Optional[str] = None
    destination_id: Optional[UUID] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    travel_type: Optional[Literal["solo", "group"]] = None
    traveler_count: Optional[int] = Field(default=None, ge=1, le=100)
    budget: Optional[Decimal] = Field(default=None, ge=0, max_digits=12, decimal_places=2)
    status: Optional[Literal["planning", "active", "completed", "cancelled"]] = None


class TripRead(APIModel):
    id: UUID
    owner_id: UUID
    destination_id: Optional[UUID] = None
    title: str
    description: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    travel_type: str
    traveler_count: int
    budget: Decimal
    status: str
    created_at: datetime
    updated_at: datetime
    destination: Optional[DestinationRead] = None
    members: list[TripMemberRead] = []


class MemberAdd(APIModel):
    user_id: UUID
    role: Literal["admin", "member"] = "member"


class ItineraryCreate(APIModel):
    title: str = Field(min_length=1, max_length=200)
    description: Optional[str] = None
    date: Optional[date] = None
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    location_name: Optional[str] = None
    latitude: Optional[Decimal] = None
    longitude: Optional[Decimal] = None
    estimated_cost: Decimal = Field(default=Decimal("0"), ge=0, max_digits=12, decimal_places=2)
    category: Optional[str] = Field(default=None, max_length=60)
    order_index: int = Field(default=0, ge=0)


class ItineraryUpdate(APIModel):
    title: Optional[str] = Field(default=None, min_length=1, max_length=200)
    description: Optional[str] = None
    date: Optional[date] = None
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    location_name: Optional[str] = None
    latitude: Optional[Decimal] = None
    longitude: Optional[Decimal] = None
    estimated_cost: Optional[Decimal] = Field(default=None, ge=0, max_digits=12, decimal_places=2)
    category: Optional[str] = Field(default=None, max_length=60)
    order_index: Optional[int] = Field(default=None, ge=0)


class ItineraryRead(ItineraryCreate):
    id: UUID
    trip_id: UUID
    created_at: datetime
    updated_at: datetime


ExpenseCategory = Literal["accommodation", "food", "transport", "activity", "shopping", "emergency", "other"]


class ExpenseCreate(APIModel):
    category: ExpenseCategory
    description: str = Field(min_length=1, max_length=240)
    amount: Decimal = Field(gt=0, max_digits=12, decimal_places=2)
    expense_date: date


class ExpenseUpdate(APIModel):
    category: Optional[ExpenseCategory] = None
    description: Optional[str] = Field(default=None, min_length=1, max_length=240)
    amount: Optional[Decimal] = Field(default=None, gt=0, max_digits=12, decimal_places=2)
    expense_date: Optional[date] = None


class ExpenseRead(ExpenseCreate):
    id: UUID
    trip_id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime
    user: Optional[ProfileRead] = None


class BudgetSummary(APIModel):
    total_budget: Decimal
    total_spent: Decimal
    remaining_budget: Decimal
    percentage_spent: Decimal
    category_breakdown: dict[str, Decimal]


class PackingCreate(APIModel):
    name: str = Field(min_length=1, max_length=180)
    quantity: int = Field(default=1, ge=1, le=999)
    is_completed: bool = False


class PackingUpdate(APIModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=180)
    quantity: Optional[int] = Field(default=None, ge=1, le=999)
    is_completed: Optional[bool] = None


class PackingRead(PackingCreate):
    id: UUID
    trip_id: UUID
    created_at: datetime
    updated_at: datetime


class JournalCreate(APIModel):
    title: str = Field(min_length=1, max_length=200)
    content: str = Field(min_length=1)
    entry_date: date


class JournalUpdate(JournalCreate):
    title: Optional[str] = Field(default=None, min_length=1, max_length=200)
    content: Optional[str] = Field(default=None, min_length=1)
    entry_date: Optional[date] = None


class JournalRead(JournalCreate):
    id: UUID
    trip_id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime


class PhotoCreate(APIModel):
    image_url: str = Field(min_length=1, max_length=1000)
    caption: Optional[str] = Field(default=None, max_length=500)
    public_id: Optional[str] = Field(default=None, max_length=240)


class PhotoRead(PhotoCreate):
    id: UUID
    trip_id: UUID
    user_id: UUID
    created_at: datetime


class MessageCreate(APIModel):
    content: str = Field(min_length=1, max_length=5000)


class MessageRead(APIModel):
    id: UUID
    trip_id: UUID
    sender_id: UUID
    content: str
    created_at: datetime
    updated_at: datetime
    sender: Optional[ProfileRead] = None


class QuestionCreate(APIModel):
    title: str = Field(min_length=1, max_length=240)
    content: str = Field(min_length=1)
    destination_id: Optional[UUID] = None
    destination: Optional[str] = Field(default=None, max_length=160)
    category: str = Field(min_length=1, max_length=80)
    tags: list[str] = Field(default_factory=list, max_length=20)


class QuestionUpdate(APIModel):
    title: Optional[str] = Field(default=None, min_length=1, max_length=240)
    content: Optional[str] = Field(default=None, min_length=1)
    destination_id: Optional[UUID] = None
    destination: Optional[str] = Field(default=None, max_length=160)
    category: Optional[str] = Field(default=None, min_length=1, max_length=80)
    tags: Optional[list[str]] = Field(default=None, max_length=20)


class ReplyCreate(APIModel):
    content: str = Field(min_length=1)


class AnswerCreate(ReplyCreate):
    pass


class ReplyRead(APIModel):
    id: UUID
    answer_id: UUID
    author_id: UUID
    content: str
    created_at: datetime
    updated_at: datetime
    author: Optional[ProfileRead] = None


class AnswerRead(APIModel):
    id: UUID
    question_id: UUID
    author_id: UUID
    content: str
    is_ai_generated: bool
    created_at: datetime
    updated_at: datetime
    author: Optional[ProfileRead] = None
    replies: list[ReplyRead] = []
    like_count: int = 0


class QuestionRead(APIModel):
    id: UUID
    author_id: UUID
    title: str
    content: str
    destination_id: Optional[UUID] = None
    category: str
    view_count: int
    created_at: datetime
    updated_at: datetime
    author: Optional[ProfileRead] = None
    destination: Optional[DestinationRead] = None
    tags: list[str] = []
    answer_count: int = 0
    like_count: int = 0
    bookmarked: bool = False
    followed: bool = False


class QuestionBundle(APIModel):
    question: QuestionRead
    answers: list[AnswerRead]


class NotificationRead(APIModel):
    id: UUID
    user_id: UUID
    type: str
    title: str
    message: str
    is_read: bool
    created_at: datetime


class AIChatRequest(APIModel):
    message: str = Field(min_length=1, max_length=10000)
    trip_id: Optional[UUID] = None
    conversation_id: Optional[UUID] = None


class AIChatResponse(APIModel):
    conversation_id: UUID
    role: Literal["assistant"] = "assistant"
    content: str


class TripPlanRequest(APIModel):
    destination: str = Field(min_length=1, max_length=160)
    start_date: date
    end_date: date
    traveler_count: int = Field(ge=1, le=100)
    travel_type: Literal["solo", "group"]
    budget: Decimal = Field(ge=0, max_digits=12, decimal_places=2)
    interests: list[str] = Field(default_factory=list)
    travel_style: str = Field(default="balanced", max_length=60)

    @model_validator(mode="after")
    def valid_dates(self):
        if self.end_date < self.start_date:
            raise ValueError("end_date must be on or after start_date")
        return self


class TripPlanDay(APIModel):
    day: int
    date: date
    activities: list[dict]


class TripPlanResponse(APIModel):
    summary: str
    estimated_budget: Decimal
    days: list[TripPlanDay]


class RecommendationRequest(APIModel):
    budget: Decimal = Field(ge=0, max_digits=12, decimal_places=2)
    duration: int = Field(ge=1, le=90)
    travel_type: Literal["solo", "group"]
    interests: list[str] = Field(default_factory=list)
    travel_style: str = Field(default="balanced", max_length=60)


class DestinationRecommendation(APIModel):
    destination: DestinationRead
    match_score: int = Field(ge=0, le=100)
    reason: str
    estimated_budget: Decimal
    recommended_days: int


class BudgetOptimizationRequest(APIModel):
    trip_id: UUID


class BudgetOptimizationResponse(APIModel):
    current_status: str
    potential_savings: Decimal
    recommendations: list[str]


class ForumAIRequest(APIModel):
    question_id: UUID


class CommunityConsensus(APIModel):
    response_count: int
    summary: str
    recommendations: list[str]
    disagreements: list[str]
    warnings: list[str]


class ProviderApplicationCreate(APIModel):
    business_name: str = Field(min_length=2, max_length=200)
    display_name: Optional[str] = Field(default=None, max_length=160)
    description: Optional[str] = None
    phone: Optional[str] = Field(default=None, max_length=50)
    website: Optional[str] = Field(default=None, max_length=500)


class ProviderApplicationUpdate(APIModel):
    business_name: Optional[str] = Field(default=None, min_length=2, max_length=200)
    display_name: Optional[str] = Field(default=None, max_length=160)
    description: Optional[str] = None
    phone: Optional[str] = Field(default=None, max_length=50)
    website: Optional[str] = Field(default=None, max_length=500)


class ProviderDocumentCreate(APIModel):
    document_type: str = Field(min_length=2, max_length=60)
    file_url: str = Field(min_length=1, max_length=1000)


class ProviderDocumentRead(ProviderDocumentCreate):
    id: UUID
    provider_id: UUID
    verification_status: str
    review_notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class ProviderProfileRead(APIModel):
    id: UUID
    user_id: UUID
    business_name: str
    display_name: Optional[str] = None
    description: Optional[str] = None
    phone: Optional[str] = None
    website: Optional[str] = None
    verification_status: str
    review_notes: Optional[str] = None
    submitted_at: Optional[datetime] = None
    approved_at: Optional[datetime] = None
    documents: list[ProviderDocumentRead] = []
    created_at: datetime
    updated_at: datetime


class TourCreate(APIModel):
    destination_id: Optional[UUID] = None
    title: str = Field(min_length=2, max_length=240)
    description: str = Field(min_length=1)
    requirements: Optional[str] = None
    inclusions: Optional[str] = None
    exclusions: Optional[str] = None
    capacity: int = Field(default=1, ge=1, le=10000)
    display_price: Decimal = Field(default=Decimal("0"), ge=0, max_digits=12, decimal_places=2)
    currency: str = Field(default="BDT", min_length=3, max_length=3)
    external_checkout_url: Optional[str] = Field(default=None, max_length=1000)


class TourUpdate(APIModel):
    destination_id: Optional[UUID] = None
    title: Optional[str] = Field(default=None, min_length=2, max_length=240)
    description: Optional[str] = Field(default=None, min_length=1)
    requirements: Optional[str] = None
    inclusions: Optional[str] = None
    exclusions: Optional[str] = None
    capacity: Optional[int] = Field(default=None, ge=1, le=10000)
    display_price: Optional[Decimal] = Field(default=None, ge=0, max_digits=12, decimal_places=2)
    currency: Optional[str] = Field(default=None, min_length=3, max_length=3)
    external_checkout_url: Optional[str] = Field(default=None, max_length=1000)


class TourRead(APIModel):
    id: UUID
    provider_id: UUID
    destination_id: Optional[UUID] = None
    title: str
    description: str
    status: str
    requirements: Optional[str] = None
    inclusions: Optional[str] = None
    exclusions: Optional[str] = None
    capacity: int
    display_price: Decimal
    currency: str
    external_checkout_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    destination: Optional[DestinationRead] = None


class DepartureCreate(APIModel):
    start_date: date
    end_date: date
    capacity: Optional[int] = Field(default=None, ge=1, le=10000)

    @model_validator(mode="after")
    def valid_dates(self):
        if self.end_date < self.start_date:
            raise ValueError("end_date must be on or after start_date")
        return self


class DepartureRead(APIModel):
    id: UUID
    tour_id: UUID
    start_date: date
    end_date: date
    capacity: int
    remaining_capacity: int
    status: str
    created_at: datetime
    updated_at: datetime


class ReservationCreate(APIModel):
    departure_id: UUID
    traveler_count: int = Field(default=1, ge=1, le=10000)


class ReservationUpdate(APIModel):
    status: Literal["approved", "rejected", "cancelled", "completed"]
    external_reference: Optional[str] = Field(default=None, max_length=240)
    provider_notes: Optional[str] = None


class ReservationRead(APIModel):
    id: UUID
    tour_id: UUID
    departure_id: UUID
    traveler_id: UUID
    traveler_count: int
    status: str
    external_reference: Optional[str] = None
    provider_notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class ReviewUpdate(APIModel):
    status: Literal["approved", "rejected", "suspended", "pending", "published", "paused", "archived"]
    review_notes: Optional[str] = None


class RoleAssignment(APIModel):
    role: Literal["traveler", "provider", "provider_reviewer", "catalog_staff", "moderator", "support", "platform_admin"]


class AccountStatusUpdate(APIModel):
    account_status: Literal["active", "suspended", "deactivated"]
