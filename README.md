# Porikroma

Porikroma is a travel planning application with a React/Vite frontend, a FastAPI backend, Supabase authentication, and Supabase PostgreSQL persistence.

## Repository layout

- `Frontend` — React/Vite application
- `Backend` — FastAPI API, SQLAlchemy models, migrations, and tests
- `docs` — architecture, database, authorization, API, and feature documentation

## Local setup

### Quick start (both servers)

```bash
./run.sh
```

Starts the backend on http://localhost:8000 and the frontend on http://localhost:5173.
The first run creates `Backend/.venv` and installs frontend packages. Press Ctrl+C to stop both.
Both `Backend/.env.local` (or `.env`) and `Frontend/.env.local` (or `.env`) must exist.
Other ports: `BACKEND_PORT=8001 FRONTEND_PORT=5174 ./run.sh`.


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
cd Frontend
npm install
cp .env.example .env
npm run dev
```

The frontend expects the backend at `http://localhost:8000` by default. Override it with `VITE_API_BASE_URL`.

## Verification

Backend tests create and delete data, so they only run against an isolated database
given in `TEST_DATABASE_URL` (they refuse to fall back to `DATABASE_URL`):

```bash
docker run -d --name porikroma-testdb -e POSTGRES_PASSWORD=test \
  -e POSTGRES_DB=porikroma_test -p 127.0.0.1:55432:5432 postgres:16-alpine
cd Backend
TEST_DATABASE_URL=postgresql://postgres:test@127.0.0.1:55432/porikroma_test pytest -q

cd ../Frontend
npm run build
npm run lint
```

The backend exposes `/health`, and API documentation is available at `/docs` while the server is running.

## Authentication and persistence

Supabase Auth is the source of truth for sessions. The frontend sends the active Supabase access token to the FastAPI backend. User-owned records are associated with the authenticated user and persisted in the database; frontend state and local storage are not used as a database substitute.

See the files in `docs/` for the current architecture, API contract, authorization model, database structure, and feature status.

