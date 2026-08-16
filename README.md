# Porikroma

Porikroma is a travel planning application with a React/Vite frontend, a FastAPI backend, Supabase authentication, and Supabase PostgreSQL persistence.

## Repository layout

- `Frontend/Porikroma_SWE` — React/Vite application
- `Backend` — FastAPI API, SQLAlchemy models, migrations, and tests
- `docs` — architecture, database, authorization, API, and feature documentation

## Local setup

### Backend

```bash
cd Backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
alembic upgrade head
uvicorn app.main:app --reload --port 8000
```

Set the backend environment variables in `Backend/.env`. Keep secrets out of Git.

### Frontend

```bash
cd Frontend/Porikroma_SWE
npm install
cp .env.example .env
npm run dev
```

The frontend expects the backend at `http://localhost:8000` by default. Override it with `VITE_API_BASE_URL`.

## Verification

```bash
cd Backend
pytest -q

cd ../Frontend/Porikroma_SWE
npm run build
npm run lint
```

The backend exposes `/health`, and API documentation is available at `/docs` while the server is running.

## Authentication and persistence

Supabase Auth is the source of truth for sessions. The frontend sends the active Supabase access token to the FastAPI backend. User-owned records are associated with the authenticated user and persisted in the database; frontend state and local storage are not used as a database substitute.

See the files in `docs/` for the current architecture, API contract, authorization model, database structure, and feature status.

