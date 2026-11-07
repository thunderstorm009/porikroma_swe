"""Test bootstrap.

The API tests create, modify and delete rows. They must never run against a
shared or production database, so they only run when TEST_DATABASE_URL is set
explicitly. That URL replaces DATABASE_URL *before* the application is
imported, the schema is created from the SQLAlchemy models, and the demo seed
is loaded.

    docker run -d --name porikroma-testdb -e POSTGRES_PASSWORD=test \
        -e POSTGRES_DB=porikroma_test -p 127.0.0.1:55432:5432 postgres:16-alpine
    TEST_DATABASE_URL=postgresql://postgres:test@127.0.0.1:55432/porikroma_test pytest -q
"""

from __future__ import annotations

import os

import pytest

_test_url = os.getenv("TEST_DATABASE_URL")
if not _test_url:
    pytest.exit(
        "TEST_DATABASE_URL is not set. Backend tests write data and must run against an "
        "isolated database (see tests/conftest.py). Refusing to fall back to DATABASE_URL.",
        returncode=2,
    )

os.environ["DATABASE_URL"] = _test_url
# Keep tests hermetic: no real AI/weather calls, and tokens signed with a local secret.
# These are set before the app loads .env/.env.local, and dotenv never overrides them.
os.environ["AI_PROVIDER"] = "mock"
os.environ["ENVIRONMENT"] = "test"
os.environ["OPENWEATHER_API_KEY"] = ""
os.environ["SUPABASE_JWKS_URL"] = ""
os.environ["SUPABASE_JWT_SECRET"] = "porikroma-test-secret"


@pytest.fixture(scope="session", autouse=True)
def _database_schema():
    from app.db.base import Base
    from app.db.database import engine
    from app import models  # noqa: F401  (registers tables)
    import seed

    Base.metadata.drop_all(engine)
    Base.metadata.create_all(engine)
    seed.run()
    yield
