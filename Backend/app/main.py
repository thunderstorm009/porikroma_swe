from __future__ import annotations
import logging
import re

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.exc import SQLAlchemyError

from app.core.config import get_settings
from app.db.database import test_database
from app.api.routes import admin, ai, auth, destinations, forum, misc, providers, resource_aliases, tours, trips, users, users_ext, ws

settings = get_settings()
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s %(message)s")
logger = logging.getLogger("porikroma.api")

_TOKEN_IN_URL = re.compile(r"((?:access_)?token=)[^&\s\"']+")


class RedactTokenFilter(logging.Filter):
    """The chat WebSocket carries the Supabase access token in its URL, and uvicorn
    logs full URLs. Mask it so tokens never end up in log files."""

    def filter(self, record: logging.LogRecord) -> bool:
        if isinstance(record.args, tuple):
            record.args = tuple(_TOKEN_IN_URL.sub(r"\1[redacted]", a) if isinstance(a, str) else a for a in record.args)
        if isinstance(record.msg, str):
            record.msg = _TOKEN_IN_URL.sub(r"\1[redacted]", record.msg)
        return True


for _name in ("uvicorn.access", "uvicorn.error"):
    logging.getLogger(_name).addFilter(RedactTokenFilter())

class RejectNulInUrlMiddleware:
    """PostgreSQL text can't hold NUL, so a %00 in a search term or path segment made
    psycopg2 raise (500). Reject such URLs up front. Bodies are checked in schemas.APIModel."""

    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope["type"] == "http":
            raw = (scope.get("raw_path") or b"") + b"?" + (scope.get("query_string") or b"")
            if b"%00" in raw or b"\x00" in raw:
                response = JSONResponse(status_code=422, content={"detail": "URL cannot contain NUL (%00) characters"})
                await response(scope, receive, send)
                return
        await self.app(scope, receive, send)


app = FastAPI(
    title="Porikroma API",
    version="1.0.0",
)

app.add_middleware(RejectNulInUrlMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/v1")
app.include_router(users.router, prefix="/api/v1")
app.include_router(users_ext.router, prefix="/api/v1")
app.include_router(admin.router, prefix="/api/v1")
app.include_router(providers.router, prefix="/api/v1")
app.include_router(tours.router, prefix="/api/v1")
app.include_router(tours.reservation_router, prefix="/api/v1")
app.include_router(trips.router, prefix="/api/v1")
app.include_router(destinations.router, prefix="/api/v1")
app.include_router(forum.router, prefix="/api/v1")
app.include_router(misc.emergency_router, prefix="/api/v1")
app.include_router(misc.weather_router, prefix="/api/v1")
app.include_router(misc.notifications_router, prefix="/api/v1")
app.include_router(ai.router, prefix="/api/v1")
app.include_router(resource_aliases.router, prefix="/api/v1")
app.include_router(ws.router, prefix="/api/v1/ws")


@app.exception_handler(SQLAlchemyError)
async def database_exception_handler(request: Request, exc: SQLAlchemyError):
    logger.exception("Database failure on %s %s", request.method, request.url.path)
    return JSONResponse(status_code=500, content={"detail": "A database error occurred"})


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    logger.exception("Unhandled request failure on %s %s", request.method, request.url.path)
    return JSONResponse(status_code=500, content={"detail": "An unexpected server error occurred"})


@app.get("/health")
def health():
    try:
        result = test_database()

        return {
            "status": "ok",
            "database": "connected",
            "test": result,
        }

    except Exception:
        logger.exception("Database connectivity check failed")
        return JSONResponse(
            status_code=503,
            content={"status": "error", "database": "not connected", "detail": "Database connectivity check failed"},
        )
