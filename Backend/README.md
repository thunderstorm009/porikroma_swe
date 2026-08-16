# Porikroma backend

## Local development

```bash
uv venv --python 3.13 .venv
uv pip install --python .venv/bin/python -r requirements.txt
cp .env.example .env
alembic upgrade head
python seed.py
uvicorn app.main:app --reload
```

The backend requires Supabase PostgreSQL through `DATABASE_URL`. It does not
run a local PostgreSQL container. Supabase Auth remains the password and user
session provider; the API validates bearer tokens and creates a profile on
first authenticated access.

API docs are available at `/docs` and `/redoc`; the database-preserving health
probe is `/health`.

## Tests

```bash
pytest -q
```

The current tests use dependency overrides for authenticated identities and
exercise authorization against seeded development records. They do not create
Supabase Auth users.
