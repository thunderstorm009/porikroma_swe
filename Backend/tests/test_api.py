from uuid import UUID

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import select

from app.core.security import AuthenticatedUser, get_current_user
from app.db.database import SessionLocal
from app.main import app
from app.models import AIConversation, Expense, ForumAnswer, ForumQuestion, Profile, Trip

DEMO_TRIP = UUID("30000000-0000-4000-8000-000000000001")
OWNER = UUID("00000000-0000-4000-8000-000000000001")
MEMBER = UUID("00000000-0000-4000-8000-000000000002")
NON_MEMBER = UUID("00000000-0000-4000-8000-000000000099")
APPLICANT = UUID("00000000-0000-4000-8000-000000000088")


def user(user_id):
    return lambda: AuthenticatedUser(user_id, {"sub": str(user_id), "email": f"{user_id}@test.invalid"})


@pytest.fixture(autouse=True)
def clear_overrides():
    app.dependency_overrides.clear()
    yield
    app.dependency_overrides.clear()


@pytest.fixture
def client():
    return TestClient(app)


def test_health_and_public_catalog(client):
    assert client.get("/health").json()["database"] == "connected"
    assert client.get("/api/v1/destinations").status_code == 200
    assert client.get("/api/v1/forum/questions").status_code == 200


def test_protected_trips_require_auth(client):
    assert client.get("/api/v1/trips").status_code == 401


def test_trip_owner_can_read_and_non_member_cannot(client):
    app.dependency_overrides[get_current_user] = user(OWNER)
    assert client.get(f"/api/v1/trips/{DEMO_TRIP}").status_code == 200

    app.dependency_overrides[get_current_user] = user(NON_MEMBER)
    assert client.get(f"/api/v1/trips/{DEMO_TRIP}").status_code == 403
    assert client.get(f"/api/v1/trips/{DEMO_TRIP}/messages").status_code == 403


def test_member_cannot_modify_trip_or_private_ai_context(client):
    app.dependency_overrides[get_current_user] = user(MEMBER)
    response = client.patch(f"/api/v1/trips/{DEMO_TRIP}", json={"title": "Not allowed"})
    assert response.status_code == 403
    response = client.post("/api/v1/ai/chat", json={"message": "What is next?", "trip_id": str(DEMO_TRIP)})
    assert response.status_code == 200
    with SessionLocal() as db:
        conversation = AIConversation(user_id=OWNER, title="Private owner conversation")
        db.add(conversation)
        db.commit()
        db.refresh(conversation)
        conversation_id = conversation.id
    response = client.post("/api/v1/ai/chat", json={"message": "Read this", "conversation_id": str(conversation_id)})
    assert response.status_code == 403


def test_member_cannot_modify_owner_expense_or_forum_content(client):
    with SessionLocal() as db:
        expense = db.scalar(select(Expense).where(Expense.trip_id == DEMO_TRIP, Expense.user_id == OWNER))
        question = db.scalar(select(ForumQuestion).where(ForumQuestion.author_id == OWNER))
        answer = db.scalar(select(ForumAnswer).where(ForumAnswer.author_id == MEMBER))
        assert expense and question and answer
        expense_id, question_id, answer_id = expense.id, question.id, answer.id
    app.dependency_overrides[get_current_user] = user(MEMBER)
    assert client.patch(f"/api/v1/expenses/{expense_id}", json={"description": "No"}).status_code == 403
    assert client.delete(f"/api/v1/forum/questions/{question_id}").status_code == 403
    app.dependency_overrides[get_current_user] = user(OWNER)
    assert client.delete(f"/api/v1/forum/answers/{answer_id}").status_code == 403


def test_owner_cannot_be_removed(client):
    app.dependency_overrides[get_current_user] = user(OWNER)
    response = client.delete(f"/api/v1/trips/{DEMO_TRIP}/members/{OWNER}")
    assert response.status_code == 400


def test_authenticated_user_gets_traveler_access_but_not_admin(client):
    app.dependency_overrides[get_current_user] = user(OWNER)
    access = client.get("/api/v1/users/me/access")
    assert access.status_code == 200
    assert "traveler" in access.json()["data"]["roles"]
    assert client.get("/api/v1/admin/providers").status_code == 403


def test_forum_writes_use_authenticated_identity_and_return_public_authors(client):
    with SessionLocal() as db:
        owner = db.get(Profile, OWNER)
        member = db.get(Profile, MEMBER)
        assert owner and member
        owner_name = owner.full_name
        member_name = member.full_name

    app.dependency_overrides[get_current_user] = user(OWNER)
    question_response = client.post(
        "/api/v1/forum/questions",
        json={
            "title": "Identity flow test question",
            "content": "The backend must use the token identity.",
            "author_id": str(MEMBER),
            "category": "Destinations",
            "tags": ["identity-test"],
        },
    )
    assert question_response.status_code == 201
    question = question_response.json()["data"]
    question_id = question["id"]
    assert question["author_id"] == str(OWNER)
    assert question["author"]["id"] == str(OWNER)
    assert question["author"]["full_name"] == owner_name

    app.dependency_overrides[get_current_user] = user(MEMBER)
    answer_response = client.post(
        f"/api/v1/forum/questions/{question_id}/answers",
        json={"content": "This answer belongs to the second authenticated user."},
    )
    assert answer_response.status_code == 201
    answer = answer_response.json()["data"]
    assert answer["author_id"] == str(MEMBER)
    assert answer["author"]["id"] == str(MEMBER)
    assert answer["author"]["full_name"] == member_name

    app.dependency_overrides[get_current_user] = user(OWNER)
    detail = client.get(f"/api/v1/forum/questions/{question_id}")
    assert detail.status_code == 200
    assert detail.json()["data"]["question"]["author"]["id"] == str(OWNER)
    assert detail.json()["data"]["answers"][0]["author"]["id"] == str(MEMBER)

    client.delete(f"/api/v1/forum/questions/{question_id}")


def test_provider_application_requires_review(client):
    with SessionLocal() as db:
        existing = db.get(Profile, APPLICANT)
        if existing:
            db.delete(existing)
            db.commit()
    try:
        app.dependency_overrides[get_current_user] = user(APPLICANT)
        response = client.post("/api/v1/providers/apply", json={"business_name": "Test Provider"})
        assert response.status_code == 201
        assert response.json()["data"]["verification_status"] == "pending"
        assert client.post("/api/v1/providers/me/submit").status_code == 200
        assert client.get("/api/v1/providers/me/tours").status_code == 403
    finally:
        app.dependency_overrides.clear()
        with SessionLocal() as db:
            existing = db.get(Profile, APPLICANT)
            if existing:
                db.delete(existing)
                db.commit()
