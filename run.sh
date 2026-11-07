#!/usr/bin/env bash
# Start Porikroma locally: FastAPI backend + Vite frontend. Ctrl+C stops both.
#
#   ./run.sh                 # backend :8000, frontend :5173
#   BACKEND_PORT=8001 FRONTEND_PORT=5174 ./run.sh
#
# First run creates Backend/.venv and installs frontend packages automatically.

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$ROOT/Backend"
FRONTEND_DIR="$ROOT/Frontend"
BACKEND_PORT="${BACKEND_PORT:-8000}"
FRONTEND_PORT="${FRONTEND_PORT:-5173}"
VENV="$BACKEND_DIR/.venv"

info() { printf '\033[1;36m[porikroma]\033[0m %s\n' "$*"; }
fail() { printf '\033[1;31m[porikroma]\033[0m %s\n' "$*" >&2; exit 1; }

# --- prerequisites ---------------------------------------------------------
command -v python3 >/dev/null || fail "python3 is not installed."
command -v npm >/dev/null || fail "npm (Node.js) is not installed."

[ -f "$BACKEND_DIR/.env.local" ] || [ -f "$BACKEND_DIR/.env" ] || [ -n "${DATABASE_URL:-}" ] \
  || fail "Backend config missing: copy Backend/.env.example to Backend/.env.local and fill it in."
[ -f "$FRONTEND_DIR/.env.local" ] || [ -f "$FRONTEND_DIR/.env" ] \
  || fail "Frontend config missing: copy Frontend/.env.example to Frontend/.env.local and fill it in."

port_busy() {
  if command -v ss >/dev/null; then ss -ltn "sport = :$1" | grep -q LISTEN
  elif command -v lsof >/dev/null; then lsof -iTCP:"$1" -sTCP:LISTEN >/dev/null 2>&1
  else return 1; fi
}
port_busy "$BACKEND_PORT" && fail "Port $BACKEND_PORT is already in use (another backend running?). Stop it or set BACKEND_PORT."
port_busy "$FRONTEND_PORT" && fail "Port $FRONTEND_PORT is already in use. Stop it or set FRONTEND_PORT."

# --- one-time setup --------------------------------------------------------
if [ ! -x "$VENV/bin/uvicorn" ]; then
  info "Setting up the Python environment (first run only)..."
  python3 -m venv "$VENV"
  "$VENV/bin/pip" install -q --upgrade pip
  "$VENV/bin/pip" install -q -r "$BACKEND_DIR/requirements.txt"
fi

if [ ! -d "$FRONTEND_DIR/node_modules" ]; then
  info "Installing frontend packages (first run only)..."
  (cd "$FRONTEND_DIR" && npm install --no-audit --no-fund)
fi

# Custom ports: point the frontend at the backend and let the backend accept the
# frontend's origin. Default ports keep whatever the .env files say.
if [ "$BACKEND_PORT" != "8000" ]; then export VITE_API_BASE_URL="http://localhost:$BACKEND_PORT"; fi
if [ "$FRONTEND_PORT" != "5173" ]; then export CORS_ORIGINS="http://localhost:$FRONTEND_PORT,http://127.0.0.1:$FRONTEND_PORT"; fi

# --- start both, stop both -------------------------------------------------
# Job control gives each server its own process group, so stopping a group also
# stops what it spawned (uvicorn's reload worker, Vite's node process).
set -m
PIDS=()
STOPPING=""
cleanup() {
  trap - INT TERM EXIT
  STOPPING=1
  info "Stopping..."
  for pid in "${PIDS[@]}"; do kill -TERM -- "-$pid" 2>/dev/null || kill -TERM "$pid" 2>/dev/null || true; done
  wait 2>/dev/null || true
}
trap cleanup INT TERM EXIT

info "Backend  -> http://localhost:$BACKEND_PORT  (API docs: /docs)"
(cd "$BACKEND_DIR" && exec "$VENV/bin/uvicorn" app.main:app --reload --port "$BACKEND_PORT") &
PIDS+=($!)

info "Frontend -> http://localhost:$FRONTEND_PORT"
(cd "$FRONTEND_DIR" && exec ./node_modules/.bin/vite --port "$FRONTEND_PORT" --strictPort) &
PIDS+=($!)

info "Press Ctrl+C to stop both."
# If either server dies, stop the other one too.
wait -n || true
[ -n "$STOPPING" ] && exit 0
fail "A server stopped unexpectedly - see the output above."
