"""Idempotent development/demo seed for Porikroma.

This creates database profiles and demo content only. It never creates or
modifies Supabase Auth users and never stores passwords.
"""

from __future__ import annotations

from datetime import date, time
from decimal import Decimal
import os
from uuid import UUID

from sqlalchemy import select

from app.db.database import SessionLocal
from app.core.permissions import ensure_role
from app.models import (
    Attraction,
    Destination,
    Expense,
    ForumAnswer,
    ForumQuestion,
    ForumReply,
    ForumTag,
    Hotel,
    ItineraryItem,
    JournalEntry,
    Notification,
    PackingItem,
    Profile,
    Role,
    Restaurant,
    Trip,
    TripMember,
)


def uid(value: str) -> UUID:
    return UUID(value)


DEMO_USERS = [
    ("00000000-0000-4000-8000-000000000001", "demo_sarah", "Sarah Jenkins", "Trip owner"),
    ("00000000-0000-4000-8000-000000000002", "demo_tanvir", "Tanvir Hossain", "Traveler"),
    ("00000000-0000-4000-8000-000000000003", "demo_nusrat", "Nusrat Jahan", "Photographer"),
]

DESTINATIONS = [
    ("10000000-0000-4000-8000-000000000001", "Cox's Bazar", "Long beaches, seafood and an easy coastal rhythm.", 21.4272, 92.0058, 18000, 3),
    ("10000000-0000-4000-8000-000000000002", "Sajek Valley", "Cloud trails, hill villages and slow mornings above the valley.", 23.3815, 92.2938, 14500, 4),
    ("10000000-0000-4000-8000-000000000003", "Sreemangal", "Tea gardens, rainforest walks and a restorative green escape.", 24.3065, 91.7296, 12500, 3),
    ("10000000-0000-4000-8000-000000000004", "Bandarban", "Mountain trails and riverside stays for curious explorers.", 22.1953, 92.2184, 16000, 4),
    ("10000000-0000-4000-8000-000000000005", "Sylhet", "Waterfalls, tea estates and a generous food culture.", 24.8949, 91.8687, 13500, 3),
    ("10000000-0000-4000-8000-000000000006", "Sundarbans", "A wild mangrove corridor made for patient, immersive travel.", 21.9497, 89.1833, 24000, 4),
    ("10000000-0000-4000-8000-000000000007", "Saint Martin's Island", "Clear water, quiet shorelines and a compact island pace.", 20.6275, 92.3228, 21000, 3),
]

ROLE_DEFINITIONS = [
    ("traveler", "Create and manage personal travel plans and community activity."),
    ("provider", "Manage an approved provider profile, tours and reservation requests."),
    ("provider_reviewer", "Review provider applications and verification documents."),
    ("catalog_staff", "Review and manage the public tour catalog."),
    ("moderator", "Moderate forum content and community reports."),
    ("support", "Assist users with account and reservation support workflows."),
    ("platform_admin", "Full platform administration and role management."),
]


def get_or_create(db, model, identity: dict, values: dict):
    row = db.scalar(select(model).filter_by(**identity))
    if not row:
        row = model(**identity, **values)
        db.add(row)
        db.flush()
    else:
        for key, value in values.items():
            setattr(row, key, value)
    return row


def run() -> None:
    with SessionLocal() as db:
        for role_name, description in ROLE_DEFINITIONS:
            get_or_create(db, Role, {"name": role_name}, {"description": description})

        users = {}
        for raw_id, username, full_name, bio in DEMO_USERS:
            users[username] = get_or_create(db, Profile, {"id": uid(raw_id)}, {"username": username, "full_name": full_name, "bio": f"Development demo profile · {bio}"})

        configured_admin = os.getenv("SEED_PLATFORM_ADMIN_USER_ID")
        if configured_admin:
            try:
                admin_id = uid(configured_admin)
            except ValueError as exc:
                raise ValueError("SEED_PLATFORM_ADMIN_USER_ID must be a valid UUID") from exc
            if db.get(Profile, admin_id):
                ensure_role(db, admin_id, "platform_admin", admin_id)
            else:
                print("SEED_PLATFORM_ADMIN_USER_ID does not match an existing profile; no admin role granted")

        destinations = {}
        for raw_id, name, description, lat, lon, budget, days in DESTINATIONS:
            destinations[name] = get_or_create(db, Destination, {"id": uid(raw_id)}, {"name": name, "country": "Bangladesh", "description": description, "latitude": lat, "longitude": lon, "estimated_budget": budget, "recommended_days": days})

        place_rows = [
            ("Hotel", "Cox's Bazar", "Sayeman Beach Resort", "Marine Drive", 9500, 4.7),
            ("Hotel", "Sreemangal", "Grand Sultan Tea Resort", "Sreemangal tea gardens", 14500, 4.8),
            ("Hotel", "Sajek Valley", "Megh Machang", "Ruilui Para", 6800, 4.6),
            ("Restaurant", "Cox's Bazar", "Mermaid Cafe", "Marine Drive", None, 4.6),
            ("Restaurant", "Sylhet", "Panshi Restaurant", "Zindabazar", None, 4.7),
            ("Restaurant", "Sreemangal", "Seven Layer Tea Cabin", "College Road", None, 4.4),
            ("Attraction", "Cox's Bazar", "Himchari National Park", "Himchari", None, None),
            ("Attraction", "Sajek Valley", "Konglak Hill", "Sajek Valley", None, None),
            ("Attraction", "Sreemangal", "Lawachara Rainforest", "Lawachara", None, None),
        ]
        for kind, destination_name, name, address, price, rating in place_rows:
            destination = destinations[destination_name]
            model = {"Hotel": Hotel, "Restaurant": Restaurant, "Attraction": Attraction}[kind]
            values = {"description": f"Development demo {kind.lower()} in {destination_name}", "address": address, "rating": rating}
            if kind == "Hotel":
                values["price_range"] = "৳৳" if price else None
            if kind in {"Restaurant", "Attraction"}:
                values["category"] = "Attraction" if kind == "Attraction" else "Local"
            if price:
                values["description"] = f"Development demo stay from ৳{price}"
            get_or_create(db, model, {"destination_id": destination.id, "name": name}, values)

        emergency_rows = [
            ("Cox's Bazar District Hospital", "hospital", "Hospital Road, Cox's Bazar", 21.439, 91.979, "+880 341-62401"),
            ("Lazz Pharma Kolatoli", "pharmacy", "Kolatoli Beach Road", 21.413, 91.990, "+880 1812-111222"),
            ("Cox's Bazar Model Police Station", "police", "Bazarghata", 21.441, 91.980, "999"),
            ("Cox's Bazar Fire Service", "fire_station", "Fire Service Road", 21.446, 91.988, "16123"),
            ("Sreemangal Care Pharmacy", "pharmacy", "Moulvibazar Road", 24.305, 91.731, "+880 1712-555666"),
            ("Bandarban Sadar Hospital", "hospital", "Hospital Road, Bandarban", 22.194, 92.220, "+880 361-62233"),
        ]
        for name, category, address, lat, lon, phone in emergency_rows:
            from app.models import EmergencyLocation
            get_or_create(db, EmergencyLocation, {"name": name}, {"category": category, "address": address, "latitude": lat, "longitude": lon, "phone": phone, "is_open": True})

        question = get_or_create(db, ForumQuestion, {"id": uid("20000000-0000-4000-8000-000000000001")}, {"author_id": users["demo_sarah"].id, "title": "Best places to visit in Sajek?", "content": "I'm visiting Sajek for three days. What places should I visit?", "destination_id": destinations["Sajek Valley"].id, "category": "Destinations", "view_count": 14})
        tag = get_or_create(db, ForumTag, {"name": "Sajek"}, {})
        if tag not in question.tags:
            question.tags.append(tag)
        answer = get_or_create(db, ForumAnswer, {"id": uid("21000000-0000-4000-8000-000000000001")}, {"question_id": question.id, "author_id": users["demo_tanvir"].id, "content": "Start early for Konglak Hill, then keep the afternoon for a slow local lunch.", "is_ai_generated": False})
        get_or_create(db, ForumReply, {"id": uid("22000000-0000-4000-8000-000000000001")}, {"answer_id": answer.id, "author_id": users["demo_sarah"].id, "content": "That is helpful, thank you."})

        trip = get_or_create(db, Trip, {"id": uid("30000000-0000-4000-8000-000000000001")}, {"owner_id": users["demo_sarah"].id, "destination_id": destinations["Cox's Bazar"].id, "title": "Cox's Bazar Sea Beach & Inani", "description": "Development demo group trip", "start_date": date(2026, 10, 6), "end_date": date(2026, 10, 12), "travel_type": "group", "traveler_count": 3, "budget": Decimal("25000.00"), "status": "planning"})
        get_or_create(db, TripMember, {"trip_id": trip.id, "user_id": users["demo_sarah"].id}, {"role": "owner"})
        get_or_create(db, TripMember, {"trip_id": trip.id, "user_id": users["demo_tanvir"].id}, {"role": "member"})
        get_or_create(db, ItineraryItem, {"trip_id": trip.id, "title": "Cox's Bazar Beach", "date": date(2026, 10, 7)}, {"description": "Morning walk and swim", "start_time": time(9), "location_name": "Laboni Point", "estimated_cost": Decimal("0"), "category": "beach", "order_index": 0})
        get_or_create(db, Expense, {"trip_id": trip.id, "user_id": users["demo_sarah"].id, "description": "Hotel advance", "expense_date": date(2026, 8, 9)}, {"category": "accommodation", "amount": Decimal("9500.00")})
        get_or_create(db, PackingItem, {"trip_id": trip.id, "name": "Light rain shell"}, {"quantity": 1, "is_completed": False})
        get_or_create(db, JournalEntry, {"trip_id": trip.id, "user_id": users["demo_sarah"].id, "title": "Planning notes", "entry_date": date(2026, 8, 16)}, {"content": "Keep Day 2 flexible for weather."})
        get_or_create(db, Notification, {"user_id": users["demo_sarah"].id, "title": "Demo trip ready"}, {"type": "system", "message": "Development seed data is ready.", "is_read": False})
        db.commit()
        print("Porikroma development seed complete")


if __name__ == "__main__":
    run()
