"""Regression tests for bugs found in the second, independent verification pass."""

from uuid import UUID, uuid4

import jwt
import pytest
from fastapi.testclient import TestClient
from starlette.websockets import WebSocketDisconnect

from app.core.security import AuthenticatedUser, get_current_user, get_optional_user
from app.main import app

OWNER = UUID("00000000-0000-4000-8000-000000000001")


def as_user(user_id):
    identity = lambda: AuthenticatedUser(user_id, {"sub": str(user_id), "email": f"{user_id}@test.invalid"})
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
def trip(client):
    as_user(OWNER)
    response = client.post("/api/v1/trips", json={"title": "Round 2 trip", "travel_type": "group", "traveler_count": 3})
    assert response.status_code == 201
    return response.json()["data"]["id"]


def test_itinerary_items_accept_and_return_a_date(client, trip):
    # A field named `date` shadowed the `date` type, so the schema only accepted None
    # and any stored dated item would have broken the itinerary listing.
    created = client.post(f"/api/v1/trips/{trip}/itinerary", json={"title": "Beach", "date": "2026-12-02", "start_time": "09:00"})
    assert created.status_code == 201, created.text
    assert created.json()["data"]["date"] == "2026-12-02"
    patched = client.patch(f"/api/v1/itinerary/{created.json()['data']['id']}", json={"date": "2026-12-03"})
    assert patched.status_code == 200, patched.text
    listed = client.get(f"/api/v1/trips/{trip}/itinerary")
    assert listed.status_code == 200
    assert [item["date"] for item in listed.json()["data"]] == ["2026-12-03"]


@pytest.mark.parametrize("body", [
    {"title": "x", "location_name": "L" * 241},
    {"title": "x", "latitude": 5000},
    {"title": "x", "longitude": -1000},
    {"title": "x", "order_index": 10**12},
])
def test_itinerary_values_beyond_column_limits_are_422_not_500(client, trip, body):
    assert client.post(f"/api/v1/trips/{trip}/itinerary", json=body).status_code == 422


@pytest.mark.parametrize("method,path,body", [
    ("post", "/api/v1/trips", {"title": "nul\x00title"}),
    ("patch", "/api/v1/users/me", {"full_name": "a\x00b"}),
    ("post", "/api/v1/forum/questions", {"title": "t", "content": "c", "category": "c", "tags": ["ok", "b\x00d"]}),
    ("post", "/api/v1/providers/apply", {"business_name": "Biz\x00"}),
])
def test_nul_characters_in_bodies_are_rejected(client, method, path, body):
    as_user(uuid4())
    assert getattr(client, method)(path, json=body).status_code == 422


@pytest.mark.parametrize("path", [
    "/api/v1/forum/questions?query=%00",
    "/api/v1/destinations?query=a%00b",
    "/api/v1/emergency/nearby?latitude=21.4&longitude=92&category=%00",
])
def test_nul_characters_in_urls_are_rejected(client, path):
    assert client.get(path).status_code == 422


@pytest.mark.parametrize("path", [
    "/api/v1/forum/questions?page=99999999999999999999",
    "/api/v1/trips?page=10000000000000",
    "/api/v1/notifications?page=10000000000000",
    "/api/v1/tours?page=10000000000000",
])
def test_huge_page_numbers_are_422_not_a_bigint_overflow(client, path):
    as_user(OWNER)
    assert client.get(path).status_code == 422


def test_blank_text_is_rejected_instead_of_stored_empty(client, trip):
    assert client.post(f"/api/v1/trips/{trip}/messages", json={"content": "   "}).status_code == 422
    assert client.patch("/api/v1/users/me", json={"username": "    "}).status_code == 422
    assert client.patch(f"/api/v1/trips/{trip}", json={"title": "  "}).status_code == 422
    assert client.post("/api/v1/forum/questions", json={"title": " ", "content": "c", "category": "c"}).status_code == 422
    sent = client.post(f"/api/v1/trips/{trip}/messages", json={"content": "  hello  "})
    assert sent.status_code == 201 and sent.json()["data"]["content"] == "hello"


def test_rejected_websocket_gets_close_code_1008_after_accept(client, trip):
    # Closing before accept() is an HTTP 403 handshake failure, which browsers surface as
    # code 1006; the frontend only stops reconnecting on 1008.
    stranger = jwt.encode({"sub": str(uuid4()), "aud": "authenticated"}, "porikroma-test-secret", algorithm="HS256")
    for token in (stranger, "not-a-jwt"):
        with client.websocket_connect(f"/api/v1/ws/trips/{trip}/chat?token={token}") as ws:
            with pytest.raises(WebSocketDisconnect) as closed:
                ws.receive_text()
        assert closed.value.code == 1008
