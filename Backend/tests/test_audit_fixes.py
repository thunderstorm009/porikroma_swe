"""Regression tests for the 2026-11 audit fixes (see .project-tracker/FIX_LOG.md)."""

from uuid import UUID, uuid4

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import select

from app.core.security import AuthenticatedUser, get_current_user, get_optional_user
from app.db.database import SessionLocal
from app.main import app
from app.models import ForumQuestion, Profile, Role, UserRole

OWNER = UUID("00000000-0000-4000-8000-000000000001")
MEMBER = UUID("00000000-0000-4000-8000-000000000002")
DEMO_TRIP = UUID("30000000-0000-4000-8000-000000000001")


def as_user(user_id, **claims):
    identity = lambda: AuthenticatedUser(user_id, {"sub": str(user_id), "email": f"{user_id}@test.invalid", **claims})
    app.dependency_overrides[get_current_user] = identity
    app.dependency_overrides[get_optional_user] = identity


@pytest.fixture(autouse=True)
def clear_overrides():
    app.dependency_overrides.clear()
    yield
    app.dependency_overrides.clear()


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def public_trip(client):
    as_user(OWNER)
    response = client.post("/api/v1/trips", json={"title": "Public audit trip", "travel_type": "group", "traveler_count": 4, "visibility": "public"})
    assert response.status_code == 201
    return response.json()["data"]["id"]


def test_non_member_can_view_public_trip_but_not_write_to_it(client, public_trip):
    stranger = uuid4()
    as_user(stranger)
    assert client.get(f"/api/v1/trips/{public_trip}").status_code == 200
    writes = [
        ("post", f"/api/v1/trips/{public_trip}/expenses", {"category": "food", "description": "x", "amount": 10, "expense_date": "2026-10-01"}),
        ("post", f"/api/v1/trips/{public_trip}/packing", {"name": "Tent"}),
        ("post", f"/api/v1/trips/{public_trip}/journal", {"title": "t", "content": "c", "entry_date": "2026-10-01"}),
        ("post", f"/api/v1/trips/{public_trip}/photos", {"image_url": "https://example.com/a.jpg"}),
        ("post", f"/api/v1/trips/{public_trip}/messages", {"content": "hello"}),
        ("post", f"/api/v1/trips/{public_trip}/itinerary", {"title": "Hike"}),
    ]
    for method, url, body in writes:
        assert getattr(client, method)(url, json=body).status_code == 403, url
    # Expense and chat history of a public trip are member-only too.
    assert client.get(f"/api/v1/trips/{public_trip}/expenses").status_code == 403
    assert client.get(f"/api/v1/trips/{public_trip}/messages").status_code == 403


def test_member_can_add_content_and_leave(client, public_trip):
    joiner = uuid4()
    as_user(joiner)
    request = client.post(f"/api/v1/trips/{public_trip}/join-requests", json={"message": "hi"})
    assert request.status_code == 201
    as_user(OWNER)
    approved = client.patch(f"/api/v1/trips/{public_trip}/join-requests/{request.json()['data']['id']}", json={"status": "approved"})
    assert approved.status_code == 200
    as_user(joiner)
    assert client.post(f"/api/v1/trips/{public_trip}/packing", json={"name": "Rain jacket"}).status_code == 201
    assert client.post(f"/api/v1/trips/{public_trip}/messages", json={"content": "On my way"}).status_code == 201
    # A member may leave on their own.
    assert client.delete(f"/api/v1/trips/{public_trip}/members/{joiner}").status_code == 204
    assert client.get(f"/api/v1/trips/{public_trip}/packing").status_code == 403


def test_patch_rejects_null_for_required_columns_and_bad_dates(client, public_trip):
    as_user(OWNER)
    assert client.patch(f"/api/v1/trips/{public_trip}", json={"title": None}).status_code == 422
    assert client.patch(f"/api/v1/trips/{public_trip}", json={"budget": None}).status_code == 422
    assert client.patch(f"/api/v1/trips/{public_trip}", json={"start_date": "2026-10-10", "end_date": "2026-10-01"}).status_code == 422
    assert client.patch(f"/api/v1/trips/{public_trip}", json={"destination_id": str(uuid4())}).status_code == 422
    # Nullable fields can still be cleared.
    assert client.patch(f"/api/v1/trips/{public_trip}", json={"description": None}).status_code == 200


def test_requested_role_is_only_used_when_the_profile_is_created(client):
    newcomer = uuid4()
    as_user(newcomer, user_metadata={"requested_role": "provider", "full_name": "New Planner"})
    roles = client.get("/api/v1/users/me").json()["data"]["roles"]
    assert roles == ["provider"]

    with SessionLocal() as db:
        provider_role = db.scalar(select(Role).where(Role.name == "provider"))
        assignment = db.scalar(select(UserRole).where(UserRole.user_id == newcomer, UserRole.role_id == provider_role.id))
        from datetime import datetime, timezone
        assignment.revoked_at = datetime.now(timezone.utc)
        db.commit()

    # The same (user-editable) metadata must not grant the role back.
    roles = client.get("/api/v1/users/me").json()["data"]["roles"]
    assert "provider" not in roles


def test_profile_creation_survives_username_collision(client):
    first, second = uuid4(), uuid4()
    app.dependency_overrides[get_current_user] = lambda: AuthenticatedUser(first, {"sub": str(first), "email": "sameperson@a.test"})
    assert client.get("/api/v1/users/me").status_code == 200
    app.dependency_overrides[get_current_user] = lambda: AuthenticatedUser(second, {"sub": str(second), "email": "sameperson@b.test"})
    response = client.get("/api/v1/users/me")
    assert response.status_code == 200
    assert response.json()["data"]["username"] != "sameperson"


def test_username_conflict_returns_409(client):
    as_user(MEMBER)
    with SessionLocal() as db:
        taken = db.get(Profile, OWNER).username
    assert client.patch("/api/v1/users/me", json={"username": taken}).status_code == 409


def test_suspended_account_is_blocked_everywhere(client):
    suspended = uuid4()
    as_user(suspended)
    assert client.get("/api/v1/trips").status_code == 200
    with SessionLocal() as db:
        db.get(Profile, suspended).account_status = "suspended"
        db.commit()
    assert client.get("/api/v1/trips").status_code == 403
    assert client.get("/api/v1/notifications").status_code == 403


def test_forum_list_is_paginated_in_sql_and_reports_user_state(client):
    as_user(OWNER)
    created = client.post("/api/v1/forum/questions", json={"title": "Pagination audit", "content": "c", "category": "Destinations", "tags": ["audit"]})
    assert created.status_code == 201
    question_id = created.json()["data"]["id"]
    assert client.post(f"/api/v1/forum/questions/{question_id}/like").json()["data"]["liked"] is True

    page = client.get("/api/v1/forum/questions", params={"sort": "latest", "limit": 1}).json()["data"]
    assert len(page["items"]) == 1 and page["total"] >= 2
    listed = client.get("/api/v1/forum/questions", params={"query": "Pagination audit"}).json()["data"]["items"]
    assert listed[0]["liked"] is True and listed[0]["like_count"] == 1

    for sort in ("trending", "most_helpful", "most_discussed", "unanswered"):
        assert client.get("/api/v1/forum/questions", params={"sort": sort}).status_code == 200
    assert client.get("/api/v1/forum/questions", params={"sort": "bogus"}).status_code == 422


def test_question_view_count_is_not_bumped_by_refetch(client):
    with SessionLocal() as db:
        question_id = db.scalar(select(ForumQuestion.id).limit(1))
    before = client.get(f"/api/v1/forum/questions/{question_id}").json()["data"]["question"]["view_count"]
    after = client.get(f"/api/v1/forum/questions/{question_id}", params={"count_view": "false"}).json()["data"]["question"]["view_count"]
    assert after == before
    assert client.get(f"/api/v1/forum/questions/{uuid4()}").status_code == 404


def test_emergency_category_filter_accepts_ui_labels(client):
    response = client.get("/api/v1/emergency/nearby", params={"latitude": 21.4272, "longitude": 92.0058, "category": "Hospital", "radius": 200})
    assert response.status_code == 200
    assert all(item["category"] == "hospital" for item in response.json()["data"])


def test_weather_reports_its_source(client):
    data = client.get("/api/v1/weather", params={"latitude": 21.4, "longitude": 92.0}).json()["data"]
    assert data["source"] in {"openweather", "sample"}


def test_resource_alias_paths_share_trip_handlers(client):
    as_user(MEMBER)
    response = client.patch(f"/api/v1/expenses/{uuid4()}", json={"description": "x"})
    assert response.status_code == 404
    assert client.patch(f"/api/v1/expenses/{uuid4()}", json={"amount": None}).status_code == 422


def _token(user_id) -> str:
    import jwt
    return jwt.encode({"sub": str(user_id), "aud": "authenticated"}, "porikroma-test-secret", algorithm="HS256")


def test_websocket_chat_persists_and_echoes(client):
    # Starlette's TestClient gives every socket its own event loop, so fan-out between two
    # sockets can't be observed here; the sender's own echo exercises the same path.
    with client.websocket_connect(f"/api/v1/ws/trips/{DEMO_TRIP}/chat?token={_token(MEMBER)}") as ws:
        ws.send_text("   ")  # blank messages are ignored
        ws.send_json({"text": "Meet at 8?"})
        received = ws.receive_json()
    assert received["content"] == "Meet at 8?"
    assert received["sender_id"] == str(MEMBER)
    assert received["sender"]["id"] == str(MEMBER)
    as_user(OWNER)
    history = client.get(f"/api/v1/trips/{DEMO_TRIP}/messages").json()["data"]["items"]
    assert history[-1]["id"] == received["id"]


def test_websocket_rejects_non_members_and_bad_tokens(client):
    from starlette.websockets import WebSocketDisconnect
    for token in (_token(uuid4()), "not-a-jwt"):
        with pytest.raises(WebSocketDisconnect) as closed:
            with client.websocket_connect(f"/api/v1/ws/trips/{DEMO_TRIP}/chat?token={token}") as ws:
                ws.receive_text()
        assert closed.value.code == 1008
