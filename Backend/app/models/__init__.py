"""SQLAlchemy 2.x models for the Porikroma domain."""

from __future__ import annotations

import uuid
from datetime import date, datetime, time
from decimal import Decimal
from typing import Optional

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    Column,
    Date,
    DateTime,
    ForeignKey,
    Index,
    JSON,
    Integer,
    Numeric,
    String,
    Table,
    Text,
    Time,
    UniqueConstraint,
    Uuid,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)


class UUIDPrimaryKeyMixin:
    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)


class Profile(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "profiles"

    username: Mapped[Optional[str]] = mapped_column(String(80), unique=True, index=True)
    full_name: Mapped[Optional[str]] = mapped_column(String(160))
    avatar_url: Mapped[Optional[str]] = mapped_column(String(500))
    bio: Mapped[Optional[str]] = mapped_column(Text)
    account_status: Mapped[str] = mapped_column(String(20), nullable=False, default="active")

    owned_trips: Mapped[list["Trip"]] = relationship(back_populates="owner", foreign_keys="Trip.owner_id")
    memberships: Mapped[list["TripMember"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    expenses: Mapped[list["Expense"]] = relationship(back_populates="user")
    journal_entries: Mapped[list["JournalEntry"]] = relationship(back_populates="user")
    photos: Mapped[list["TripPhoto"]] = relationship(back_populates="user")
    messages: Mapped[list["TripMessage"]] = relationship(back_populates="sender")
    forum_questions: Mapped[list["ForumQuestion"]] = relationship(back_populates="author")
    forum_answers: Mapped[list["ForumAnswer"]] = relationship(back_populates="author")
    forum_replies: Mapped[list["ForumReply"]] = relationship(back_populates="author")
    notifications: Mapped[list["Notification"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    ai_conversations: Mapped[list["AIConversation"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    roles: Mapped[list["UserRole"]] = relationship(back_populates="user", cascade="all, delete-orphan", foreign_keys="UserRole.user_id")
    provider_profile: Mapped[Optional["ProviderProfile"]] = relationship(back_populates="user", uselist=False, cascade="all, delete-orphan", foreign_keys="ProviderProfile.user_id")
    reservations: Mapped[list["TourReservationRequest"]] = relationship(back_populates="traveler", foreign_keys="TourReservationRequest.traveler_id")


class Destination(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "destinations"

    name: Mapped[str] = mapped_column(String(160), nullable=False, index=True)
    country: Mapped[str] = mapped_column(String(120), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text)
    latitude: Mapped[Optional[Decimal]] = mapped_column(Numeric(10, 7))
    longitude: Mapped[Optional[Decimal]] = mapped_column(Numeric(10, 7))
    image_url: Mapped[Optional[str]] = mapped_column(String(500))
    estimated_budget: Mapped[Optional[Decimal]] = mapped_column(Numeric(12, 2))
    recommended_days: Mapped[Optional[int]] = mapped_column(Integer)

    trips: Mapped[list["Trip"]] = relationship(back_populates="destination")
    hotels: Mapped[list["Hotel"]] = relationship(back_populates="destination", cascade="all, delete-orphan")
    restaurants: Mapped[list["Restaurant"]] = relationship(back_populates="destination", cascade="all, delete-orphan")
    attractions: Mapped[list["Attraction"]] = relationship(back_populates="destination", cascade="all, delete-orphan")
    forum_questions: Mapped[list["ForumQuestion"]] = relationship(back_populates="destination")


class Trip(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "trips"
    __table_args__ = (
        CheckConstraint("travel_type IN ('solo', 'group')", name="ck_trips_travel_type"),
        CheckConstraint("status IN ('planning', 'active', 'completed', 'cancelled')", name="ck_trips_status"),
        Index("ix_trips_owner_id", "owner_id"),
        Index("ix_trips_destination_id", "destination_id"),
        Index("ix_trips_dates", "start_date", "end_date"),
    )

    owner_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("profiles.id", ondelete="RESTRICT"), nullable=False)
    destination_id: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("destinations.id", ondelete="SET NULL"))
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text)
    start_date: Mapped[Optional[date]] = mapped_column(Date)
    end_date: Mapped[Optional[date]] = mapped_column(Date)
    travel_type: Mapped[str] = mapped_column(String(20), nullable=False, default="solo")
    traveler_count: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    budget: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False, default=Decimal("0"))
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="planning")

    owner: Mapped["Profile"] = relationship(back_populates="owned_trips", foreign_keys=[owner_id])
    destination: Mapped[Optional["Destination"]] = relationship(back_populates="trips")
    members: Mapped[list["TripMember"]] = relationship(back_populates="trip", cascade="all, delete-orphan")
    itinerary_items: Mapped[list["ItineraryItem"]] = relationship(back_populates="trip", cascade="all, delete-orphan", order_by="ItineraryItem.order_index")
    expenses: Mapped[list["Expense"]] = relationship(back_populates="trip", cascade="all, delete-orphan")
    packing_items: Mapped[list["PackingItem"]] = relationship(back_populates="trip", cascade="all, delete-orphan")
    journal_entries: Mapped[list["JournalEntry"]] = relationship(back_populates="trip", cascade="all, delete-orphan")
    photos: Mapped[list["TripPhoto"]] = relationship(back_populates="trip", cascade="all, delete-orphan")
    messages: Mapped[list["TripMessage"]] = relationship(back_populates="trip", cascade="all, delete-orphan")
    ai_conversations: Mapped[list["AIConversation"]] = relationship(back_populates="trip")
    ai_summary: Mapped[Optional["AITripSummary"]] = relationship(back_populates="trip", uselist=False, cascade="all, delete-orphan")


class TripMember(UUIDPrimaryKeyMixin, Base):
    __tablename__ = "trip_members"
    __table_args__ = (
        UniqueConstraint("trip_id", "user_id", name="uq_trip_members_trip_user"),
        CheckConstraint("role IN ('owner', 'admin', 'member')", name="ck_trip_members_role"),
        Index("ix_trip_members_trip_id", "trip_id"),
        Index("ix_trip_members_user_id", "user_id"),
    )

    trip_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("trips.id", ondelete="CASCADE"), nullable=False)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False)
    role: Mapped[str] = mapped_column(String(20), nullable=False, default="member")
    joined_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    trip: Mapped["Trip"] = relationship(back_populates="members")
    user: Mapped["Profile"] = relationship(back_populates="memberships")


class ItineraryItem(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "itinerary_items"
    __table_args__ = (Index("ix_itinerary_trip_date_order", "trip_id", "date", "order_index"),)

    trip_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("trips.id", ondelete="CASCADE"), nullable=False)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text)
    date: Mapped[Optional[date]] = mapped_column(Date)
    start_time: Mapped[Optional[time]] = mapped_column(Time)
    end_time: Mapped[Optional[time]] = mapped_column(Time)
    location_name: Mapped[Optional[str]] = mapped_column(String(240))
    latitude: Mapped[Optional[Decimal]] = mapped_column(Numeric(10, 7))
    longitude: Mapped[Optional[Decimal]] = mapped_column(Numeric(10, 7))
    estimated_cost: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False, default=Decimal("0"))
    category: Mapped[Optional[str]] = mapped_column(String(60))
    order_index: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    trip: Mapped["Trip"] = relationship(back_populates="itinerary_items")


class Expense(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "expenses"
    __table_args__ = (
        CheckConstraint("category IN ('accommodation', 'food', 'transport', 'activity', 'shopping', 'emergency', 'other')", name="ck_expenses_category"),
        Index("ix_expenses_trip_id", "trip_id"),
    )

    trip_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("trips.id", ondelete="CASCADE"), nullable=False)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("profiles.id", ondelete="RESTRICT"), nullable=False)
    category: Mapped[str] = mapped_column(String(30), nullable=False)
    description: Mapped[str] = mapped_column(String(240), nullable=False)
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    expense_date: Mapped[date] = mapped_column(Date, nullable=False)

    trip: Mapped["Trip"] = relationship(back_populates="expenses")
    user: Mapped["Profile"] = relationship(back_populates="expenses")


class PackingItem(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "packing_items"

    trip_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("trips.id", ondelete="CASCADE"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(180), nullable=False)
    quantity: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    is_completed: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    trip: Mapped["Trip"] = relationship(back_populates="packing_items")


class JournalEntry(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "journal_entries"
    __table_args__ = (Index("ix_journal_trip_date", "trip_id", "entry_date"),)

    trip_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("trips.id", ondelete="CASCADE"), nullable=False)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("profiles.id", ondelete="RESTRICT"), nullable=False)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    entry_date: Mapped[date] = mapped_column(Date, nullable=False)
    trip: Mapped["Trip"] = relationship(back_populates="journal_entries")
    user: Mapped["Profile"] = relationship(back_populates="journal_entries")


class TripPhoto(UUIDPrimaryKeyMixin, Base):
    __tablename__ = "trip_photos"

    trip_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("trips.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("profiles.id", ondelete="RESTRICT"), nullable=False)
    image_url: Mapped[str] = mapped_column(String(1000), nullable=False)
    caption: Mapped[Optional[str]] = mapped_column(String(500))
    public_id: Mapped[Optional[str]] = mapped_column(String(240))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    trip: Mapped["Trip"] = relationship(back_populates="photos")
    user: Mapped["Profile"] = relationship(back_populates="photos")


class TripMessage(UUIDPrimaryKeyMixin, Base):
    __tablename__ = "trip_messages"
    __table_args__ = (Index("ix_trip_messages_trip_created", "trip_id", "created_at"),)

    trip_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("trips.id", ondelete="CASCADE"), nullable=False)
    sender_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("profiles.id", ondelete="RESTRICT"), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    trip: Mapped["Trip"] = relationship(back_populates="messages")
    sender: Mapped["Profile"] = relationship(back_populates="messages")


class ForumQuestion(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "forum_questions"
    __table_args__ = (
        Index("ix_forum_questions_created_at", "created_at"),
        Index("ix_forum_questions_category", "category"),
        Index("ix_forum_questions_destination", "destination_id"),
    )

    author_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("profiles.id", ondelete="RESTRICT"), nullable=False)
    title: Mapped[str] = mapped_column(String(240), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    destination_id: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("destinations.id", ondelete="SET NULL"))
    category: Mapped[str] = mapped_column(String(80), nullable=False)
    view_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    author: Mapped["Profile"] = relationship(back_populates="forum_questions")
    destination: Mapped[Optional["Destination"]] = relationship(back_populates="forum_questions")
    answers: Mapped[list["ForumAnswer"]] = relationship(back_populates="question", cascade="all, delete-orphan")
    likes: Mapped[list["QuestionLike"]] = relationship(back_populates="question", cascade="all, delete-orphan")
    bookmarks: Mapped[list["QuestionBookmark"]] = relationship(back_populates="question", cascade="all, delete-orphan")
    followers: Mapped[list["QuestionFollower"]] = relationship(back_populates="question", cascade="all, delete-orphan")
    tags: Mapped[list["ForumTag"]] = relationship(secondary="question_tags", back_populates="questions")
    ai_summary: Mapped[Optional["AIForumSummary"]] = relationship(back_populates="question", uselist=False, cascade="all, delete-orphan")


class ForumAnswer(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "forum_answers"
    __table_args__ = (Index("ix_forum_answers_question_id", "question_id"),)

    question_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("forum_questions.id", ondelete="CASCADE"), nullable=False)
    author_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("profiles.id", ondelete="RESTRICT"), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    is_ai_generated: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    question: Mapped["ForumQuestion"] = relationship(back_populates="answers")
    author: Mapped["Profile"] = relationship(back_populates="forum_answers")
    replies: Mapped[list["ForumReply"]] = relationship(back_populates="answer", cascade="all, delete-orphan")
    likes: Mapped[list["AnswerLike"]] = relationship(back_populates="answer", cascade="all, delete-orphan")


class ForumReply(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "forum_replies"
    __table_args__ = (Index("ix_forum_replies_answer_id", "answer_id"),)

    answer_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("forum_answers.id", ondelete="CASCADE"), nullable=False)
    author_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("profiles.id", ondelete="RESTRICT"), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    answer: Mapped["ForumAnswer"] = relationship(back_populates="replies")
    author: Mapped["Profile"] = relationship(back_populates="forum_replies")


question_tags = Table(
    "question_tags",
    Base.metadata,
    Column("question_id", Uuid, ForeignKey("forum_questions.id", ondelete="CASCADE"), primary_key=True),
    Column("tag_id", Uuid, ForeignKey("forum_tags.id", ondelete="CASCADE"), primary_key=True),
)


class ForumTag(UUIDPrimaryKeyMixin, Base):
    __tablename__ = "forum_tags"
    name: Mapped[str] = mapped_column(String(80), unique=True, nullable=False)
    questions: Mapped[list["ForumQuestion"]] = relationship(secondary=question_tags, back_populates="tags")


class QuestionLike(Base):
    __tablename__ = "question_likes"
    question_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("forum_questions.id", ondelete="CASCADE"), primary_key=True)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("profiles.id", ondelete="CASCADE"), primary_key=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    question: Mapped["ForumQuestion"] = relationship(back_populates="likes")


class AnswerLike(Base):
    __tablename__ = "answer_likes"
    answer_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("forum_answers.id", ondelete="CASCADE"), primary_key=True)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("profiles.id", ondelete="CASCADE"), primary_key=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    answer: Mapped["ForumAnswer"] = relationship(back_populates="likes")


class QuestionBookmark(Base):
    __tablename__ = "question_bookmarks"
    question_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("forum_questions.id", ondelete="CASCADE"), primary_key=True)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("profiles.id", ondelete="CASCADE"), primary_key=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    question: Mapped["ForumQuestion"] = relationship(back_populates="bookmarks")


class QuestionFollower(Base):
    __tablename__ = "question_followers"
    question_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("forum_questions.id", ondelete="CASCADE"), primary_key=True)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("profiles.id", ondelete="CASCADE"), primary_key=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    question: Mapped["ForumQuestion"] = relationship(back_populates="followers")


class Hotel(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "hotels"
    destination_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("destinations.id", ondelete="CASCADE"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text)
    address: Mapped[Optional[str]] = mapped_column(String(300))
    latitude: Mapped[Optional[Decimal]] = mapped_column(Numeric(10, 7))
    longitude: Mapped[Optional[Decimal]] = mapped_column(Numeric(10, 7))
    image_url: Mapped[Optional[str]] = mapped_column(String(500))
    rating: Mapped[Optional[Decimal]] = mapped_column(Numeric(2, 1))
    price_range: Mapped[Optional[str]] = mapped_column(String(30))
    destination: Mapped["Destination"] = relationship(back_populates="hotels")


class Restaurant(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "restaurants"
    destination_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("destinations.id", ondelete="CASCADE"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text)
    address: Mapped[Optional[str]] = mapped_column(String(300))
    latitude: Mapped[Optional[Decimal]] = mapped_column(Numeric(10, 7))
    longitude: Mapped[Optional[Decimal]] = mapped_column(Numeric(10, 7))
    image_url: Mapped[Optional[str]] = mapped_column(String(500))
    rating: Mapped[Optional[Decimal]] = mapped_column(Numeric(2, 1))
    price_range: Mapped[Optional[str]] = mapped_column(String(30))
    category: Mapped[Optional[str]] = mapped_column(String(80))
    destination: Mapped["Destination"] = relationship(back_populates="restaurants")


class Attraction(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "attractions"
    destination_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("destinations.id", ondelete="CASCADE"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text)
    address: Mapped[Optional[str]] = mapped_column(String(300))
    latitude: Mapped[Optional[Decimal]] = mapped_column(Numeric(10, 7))
    longitude: Mapped[Optional[Decimal]] = mapped_column(Numeric(10, 7))
    image_url: Mapped[Optional[str]] = mapped_column(String(500))
    rating: Mapped[Optional[Decimal]] = mapped_column(Numeric(2, 1))
    category: Mapped[Optional[str]] = mapped_column(String(80))
    destination: Mapped["Destination"] = relationship(back_populates="attractions")


class EmergencyLocation(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "emergency_locations"
    __table_args__ = (CheckConstraint("category IN ('hospital', 'pharmacy', 'police', 'fire_station')", name="ck_emergency_category"),)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    category: Mapped[str] = mapped_column(String(30), nullable=False, index=True)
    address: Mapped[Optional[str]] = mapped_column(String(300))
    latitude: Mapped[Decimal] = mapped_column(Numeric(10, 7), nullable=False)
    longitude: Mapped[Decimal] = mapped_column(Numeric(10, 7), nullable=False)
    phone: Mapped[Optional[str]] = mapped_column(String(50))
    is_open: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)


class Notification(UUIDPrimaryKeyMixin, Base):
    __tablename__ = "notifications"
    __table_args__ = (Index("ix_notifications_user_created", "user_id", "created_at"),)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False)
    type: Mapped[str] = mapped_column(String(40), nullable=False)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    is_read: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    user: Mapped["Profile"] = relationship(back_populates="notifications")


class AIConversation(UUIDPrimaryKeyMixin, Base):
    __tablename__ = "ai_conversations"
    __table_args__ = (Index("ix_ai_conversations_user_id", "user_id"), Index("ix_ai_conversations_trip_id", "trip_id"))
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False)
    trip_id: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("trips.id", ondelete="CASCADE"))
    title: Mapped[Optional[str]] = mapped_column(String(200))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    user: Mapped["Profile"] = relationship(back_populates="ai_conversations")
    trip: Mapped[Optional["Trip"]] = relationship(back_populates="ai_conversations")
    messages: Mapped[list["AIMessage"]] = relationship(back_populates="conversation", cascade="all, delete-orphan")


class AIMessage(UUIDPrimaryKeyMixin, Base):
    __tablename__ = "ai_messages"
    __table_args__ = (CheckConstraint("role IN ('user', 'assistant', 'system')", name="ck_ai_messages_role"),)
    conversation_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("ai_conversations.id", ondelete="CASCADE"), nullable=False, index=True)
    role: Mapped[str] = mapped_column(String(20), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    conversation: Mapped["AIConversation"] = relationship(back_populates="messages")


class AITripSummary(UUIDPrimaryKeyMixin, Base):
    __tablename__ = "ai_trip_summaries"
    trip_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("trips.id", ondelete="CASCADE"), nullable=False, unique=True)
    summary: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    trip: Mapped["Trip"] = relationship(back_populates="ai_summary")


class AIForumSummary(UUIDPrimaryKeyMixin, Base):
    __tablename__ = "ai_forum_summaries"
    question_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("forum_questions.id", ondelete="CASCADE"), nullable=False, unique=True)
    summary: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    question: Mapped["ForumQuestion"] = relationship(back_populates="ai_summary")


class Role(UUIDPrimaryKeyMixin, Base):
    __tablename__ = "roles"

    name: Mapped[str] = mapped_column(String(40), unique=True, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(String(300))
    user_roles: Mapped[list["UserRole"]] = relationship(back_populates="role", cascade="all, delete-orphan")


class UserRole(UUIDPrimaryKeyMixin, Base):
    __tablename__ = "user_roles"
    __table_args__ = (
        UniqueConstraint("user_id", "role_id", name="uq_user_roles_user_role"),
        Index("ix_user_roles_user_id", "user_id"),
        Index("ix_user_roles_role_id", "role_id"),
    )

    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False)
    role_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("roles.id", ondelete="CASCADE"), nullable=False)
    granted_by: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("profiles.id", ondelete="SET NULL"))
    granted_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    revoked_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))

    user: Mapped["Profile"] = relationship(back_populates="roles", foreign_keys=[user_id])
    role: Mapped["Role"] = relationship(back_populates="user_roles")
    grantor: Mapped[Optional["Profile"]] = relationship(foreign_keys=[granted_by])


class ProviderProfile(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "provider_profiles"
    __table_args__ = (
        CheckConstraint("verification_status IN ('pending', 'approved', 'rejected', 'suspended')", name="ck_provider_profiles_status"),
        Index("ix_provider_profiles_status", "verification_status"),
    )

    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False, unique=True)
    business_name: Mapped[str] = mapped_column(String(200), nullable=False)
    display_name: Mapped[Optional[str]] = mapped_column(String(160))
    description: Mapped[Optional[str]] = mapped_column(Text)
    phone: Mapped[Optional[str]] = mapped_column(String(50))
    website: Mapped[Optional[str]] = mapped_column(String(500))
    verification_status: Mapped[str] = mapped_column(String(20), nullable=False, default="pending")
    reviewed_by: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("profiles.id", ondelete="SET NULL"))
    review_notes: Mapped[Optional[str]] = mapped_column(Text)
    submitted_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    approved_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))

    user: Mapped["Profile"] = relationship(back_populates="provider_profile", foreign_keys=[user_id])
    reviewer: Mapped[Optional["Profile"]] = relationship(foreign_keys=[reviewed_by])
    documents: Mapped[list["ProviderDocument"]] = relationship(back_populates="provider", cascade="all, delete-orphan")
    tours: Mapped[list["Tour"]] = relationship(back_populates="provider", cascade="all, delete-orphan")


class ProviderDocument(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "provider_documents"
    __table_args__ = (
        CheckConstraint("verification_status IN ('pending', 'approved', 'rejected')", name="ck_provider_documents_status"),
        Index("ix_provider_documents_provider_id", "provider_id"),
    )

    provider_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("provider_profiles.id", ondelete="CASCADE"), nullable=False)
    document_type: Mapped[str] = mapped_column(String(60), nullable=False)
    file_url: Mapped[str] = mapped_column(String(1000), nullable=False)
    verification_status: Mapped[str] = mapped_column(String(20), nullable=False, default="pending")
    review_notes: Mapped[Optional[str]] = mapped_column(Text)
    provider: Mapped["ProviderProfile"] = relationship(back_populates="documents")


class Tour(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "tours"
    __table_args__ = (
        CheckConstraint("status IN ('draft', 'pending_review', 'published', 'paused', 'archived', 'rejected')", name="ck_tours_status"),
        CheckConstraint("capacity > 0", name="ck_tours_capacity_positive"),
        CheckConstraint("display_price >= 0", name="ck_tours_price_nonnegative"),
        Index("ix_tours_provider_id", "provider_id"),
        Index("ix_tours_destination_id", "destination_id"),
        Index("ix_tours_status", "status"),
    )

    provider_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("provider_profiles.id", ondelete="CASCADE"), nullable=False)
    destination_id: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("destinations.id", ondelete="SET NULL"))
    title: Mapped[str] = mapped_column(String(240), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="draft")
    requirements: Mapped[Optional[str]] = mapped_column(Text)
    inclusions: Mapped[Optional[str]] = mapped_column(Text)
    exclusions: Mapped[Optional[str]] = mapped_column(Text)
    capacity: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    display_price: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False, default=Decimal("0"))
    currency: Mapped[str] = mapped_column(String(3), nullable=False, default="BDT")
    external_checkout_url: Mapped[Optional[str]] = mapped_column(String(1000))

    provider: Mapped["ProviderProfile"] = relationship(back_populates="tours")
    destination: Mapped[Optional["Destination"]] = relationship()
    departures: Mapped[list["TourDeparture"]] = relationship(back_populates="tour", cascade="all, delete-orphan")
    reservations: Mapped[list["TourReservationRequest"]] = relationship(back_populates="tour", cascade="all, delete-orphan")


class TourDeparture(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "tour_departures"
    __table_args__ = (
        CheckConstraint("end_date >= start_date", name="ck_tour_departures_dates"),
        CheckConstraint("capacity > 0", name="ck_tour_departures_capacity_positive"),
        CheckConstraint("remaining_capacity >= 0", name="ck_tour_departures_remaining_nonnegative"),
        CheckConstraint("status IN ('scheduled', 'closed', 'cancelled', 'completed')", name="ck_tour_departures_status"),
        Index("ix_tour_departures_tour_dates", "tour_id", "start_date", "end_date"),
    )

    tour_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("tours.id", ondelete="CASCADE"), nullable=False)
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    end_date: Mapped[date] = mapped_column(Date, nullable=False)
    capacity: Mapped[int] = mapped_column(Integer, nullable=False)
    remaining_capacity: Mapped[int] = mapped_column(Integer, nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="scheduled")
    tour: Mapped["Tour"] = relationship(back_populates="departures")
    reservations: Mapped[list["TourReservationRequest"]] = relationship(back_populates="departure")


class TourReservationRequest(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "tour_reservation_requests"
    __table_args__ = (
        CheckConstraint("traveler_count > 0", name="ck_reservations_traveler_count_positive"),
        CheckConstraint("status IN ('requested', 'approved', 'rejected', 'cancelled', 'completed')", name="ck_reservations_status"),
        Index("ix_reservations_traveler_id", "traveler_id"),
        Index("ix_reservations_departure_id", "departure_id"),
        Index("ix_reservations_status", "status"),
    )

    tour_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("tours.id", ondelete="CASCADE"), nullable=False)
    departure_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("tour_departures.id", ondelete="CASCADE"), nullable=False)
    traveler_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("profiles.id", ondelete="RESTRICT"), nullable=False)
    traveler_count: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="requested")
    external_reference: Mapped[Optional[str]] = mapped_column(String(240))
    provider_notes: Mapped[Optional[str]] = mapped_column(Text)

    tour: Mapped["Tour"] = relationship(back_populates="reservations")
    departure: Mapped["TourDeparture"] = relationship(back_populates="reservations")
    traveler: Mapped["Profile"] = relationship(back_populates="reservations", foreign_keys=[traveler_id])


class TripInvitation(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "trip_invitations"
    __table_args__ = (
        CheckConstraint("status IN ('pending', 'accepted', 'declined', 'cancelled')", name="ck_trip_invitations_status"),
        Index("ix_trip_invitations_trip_id", "trip_id"),
        Index("ix_trip_invitations_invitee_email", "invitee_email"),
    )

    trip_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("trips.id", ondelete="CASCADE"), nullable=False)
    inviter_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False)
    invitee_email: Mapped[str] = mapped_column(String(255), nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="pending")
    role: Mapped[str] = mapped_column(String(20), nullable=False, default="member")

    trip: Mapped["Trip"] = relationship()
    inviter: Mapped["Profile"] = relationship(foreign_keys=[inviter_id])


class TripJoinRequest(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "trip_join_requests"
    __table_args__ = (
        CheckConstraint("status IN ('pending', 'approved', 'rejected', 'cancelled')", name="ck_trip_join_requests_status"),
        Index("ix_trip_join_requests_trip_id", "trip_id"),
        Index("ix_trip_join_requests_user_id", "user_id"),
    )

    trip_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("trips.id", ondelete="CASCADE"), nullable=False)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="pending")

    trip: Mapped["Trip"] = relationship()
    user: Mapped["Profile"] = relationship(foreign_keys=[user_id])


class AuditLog(UUIDPrimaryKeyMixin, Base):
    __tablename__ = "audit_logs"
    __table_args__ = (Index("ix_audit_logs_resource", "resource_type", "resource_id"), Index("ix_audit_logs_created_at", "created_at"))

    actor_id: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("profiles.id", ondelete="SET NULL"))
    action: Mapped[str] = mapped_column(String(80), nullable=False)
    resource_type: Mapped[str] = mapped_column(String(80), nullable=False)
    resource_id: Mapped[Optional[uuid.UUID]] = mapped_column(Uuid)
    metadata_json: Mapped[dict] = mapped_column("metadata", JSON, nullable=False, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    actor: Mapped[Optional["Profile"]] = relationship(foreign_keys=[actor_id])


__all__ = [
    "AIConversation", "AIForumSummary", "AIMessage", "AITripSummary", "AnswerLike",
    "Attraction", "Destination", "EmergencyLocation", "Expense", "ForumAnswer",
    "ForumQuestion", "ForumReply", "ForumTag", "Hotel", "ItineraryItem", "JournalEntry",
    "Notification", "PackingItem", "Profile", "QuestionBookmark", "QuestionFollower",
    "QuestionLike", "Restaurant", "Trip", "TripMember", "TripMessage", "TripPhoto",
    "TripInvitation", "TripJoinRequest"
]
