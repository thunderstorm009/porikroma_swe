from uuid import UUID
import pytest
from fastapi.testclient import TestClient

from app.core.security import AuthenticatedUser, get_current_user
from app.db.database import SessionLocal
from app.main import app

OWNER = UUID("00000000-0000-4000-8000-000000000001")
DESTINATION_ID = UUID("10000000-0000-4000-8000-000000000001")

def user(user_id):
    return lambda: AuthenticatedUser(user_id, {"sub": str(user_id), "email": f"{user_id}@test.invalid"})

@pytest.fixture(autouse=True)
def clear_overrides():
    app.dependency_overrides.clear()
    app.dependency_overrides[get_current_user] = user(OWNER)
    yield
    app.dependency_overrides.clear()

@pytest.fixture
def client():
    return TestClient(app)

def test_destinations_read(client):
    res = client.get("/api/v1/destinations")
    assert res.status_code == 200

def test_trip_crud(client):
    # Create Trip
    res = client.post("/api/v1/trips", json={
        "destination_id": str(DESTINATION_ID),
        "title": "CRUD Test Trip",
        "description": "Testing CRUD",
        "start_date": "2026-10-01",
        "end_date": "2026-10-10"
    })
    assert res.status_code == 201
    trip_id = res.json()["data"]["id"]

    # Read Trip
    res = client.get(f"/api/v1/trips/{trip_id}")
    assert res.status_code == 200
    assert res.json()["data"]["title"] == "CRUD Test Trip"

    # Update Trip
    res = client.patch(f"/api/v1/trips/{trip_id}", json={
        "title": "Updated CRUD Trip"
    })
    assert res.status_code == 200
    assert res.json()["data"]["title"] == "Updated CRUD Trip"

    # --- Sub-resources CRUD ---

    # Expense Create
    res = client.post(f"/api/v1/trips/{trip_id}/expenses", json={
        "amount": 100.50,
        "currency": "USD",
        "description": "Lunch",
        "category": "food",
        "expense_date": "2026-10-02"
    })
    assert res.status_code == 201
    expense_id = res.json()["data"]["id"]

    # Expense Read
    res = client.get(f"/api/v1/trips/{trip_id}/expenses")
    assert res.status_code == 200
    assert len(res.json()["data"]) >= 1

    # Expense Update
    res = client.patch(f"/api/v1/expenses/{expense_id}", json={"amount": 150.0})
    assert res.status_code == 200
    assert res.json()["data"]["amount"] == "150.00"

    # Expense Delete
    res = client.delete(f"/api/v1/expenses/{expense_id}")
    assert res.status_code == 204

    # Itinerary Create
    res = client.post(f"/api/v1/trips/{trip_id}/itinerary", json={
        "title": "Museum Visit",
        "location_name": "City Center"
    })
    assert res.status_code == 201, res.text
    itinerary_id = res.json()["data"]["id"]

    # Itinerary Read
    res = client.get(f"/api/v1/trips/{trip_id}/itinerary")
    assert res.status_code == 200, res.text

    # Itinerary Update
    res = client.patch(f"/api/v1/itinerary/{itinerary_id}", json={"title": "Park Visit"})
    assert res.status_code == 200, res.text

    # Itinerary Delete
    res = client.delete(f"/api/v1/itinerary/{itinerary_id}")
    assert res.status_code == 204, res.text

    # Journal Create
    res = client.post(f"/api/v1/trips/{trip_id}/journal", json={
        "title": "Day 1",
        "entry_date": "2026-10-01",
        "content": "First day!"
    })
    assert res.status_code == 201, res.text
    journal_id = res.json()["data"]["id"]

    # Journal Update
    res = client.patch(f"/api/v1/journal/{journal_id}", json={"content": "Updated day 1"})
    assert res.status_code == 200, res.text

    # Journal Delete
    res = client.delete(f"/api/v1/journal/{journal_id}")
    assert res.status_code == 204, res.text

    # Packing Create
    res = client.post(f"/api/v1/trips/{trip_id}/packing", json={
        "name": "Sunscreen",
        "quantity": 1,
        "is_completed": False
    })
    assert res.status_code == 201, res.text
    packing_id = res.json()["data"]["id"]

    # Packing Update
    res = client.patch(f"/api/v1/packing/{packing_id}", json={"is_completed": True})
    assert res.status_code == 200, res.text

    # Packing Delete
    res = client.delete(f"/api/v1/packing/{packing_id}")
    assert res.status_code == 204

    # Delete Trip
    res = client.delete(f"/api/v1/trips/{trip_id}")
    assert res.status_code == 204


def test_forum_crud(client):
    # Create Question
    res = client.post("/api/v1/forum/questions", json={
        "title": "Where to stay?",
        "content": "Looking for a hotel.",
        "category": "Accommodation"
    })
    assert res.status_code == 201
    question_id = res.json()["data"]["id"]

    # Read Question
    res = client.get(f"/api/v1/forum/questions/{question_id}")
    assert res.status_code == 200

    # Update Question
    res = client.patch(f"/api/v1/forum/questions/{question_id}", json={"content": "Looking for a cheap hotel."})
    assert res.status_code == 200

    # Create Answer
    res = client.post(f"/api/v1/forum/questions/{question_id}/answers", json={
        "content": "Try the downtown hostel."
    })
    assert res.status_code == 201
    answer_id = res.json()["data"]["id"]

    # Update Answer
    res = client.patch(f"/api/v1/forum/answers/{answer_id}", json={"content": "Try the uptown hostel instead."})
    assert res.status_code == 200

    # Delete Answer
    res = client.delete(f"/api/v1/forum/answers/{answer_id}")
    assert res.status_code == 204

    # Delete Question
    res = client.delete(f"/api/v1/forum/questions/{question_id}")
    assert res.status_code == 204
