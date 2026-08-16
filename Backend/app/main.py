import logging

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.exc import SQLAlchemyError

from app.core.config import get_settings
from app.db.database import test_database
from app.api.routes import admin, ai, auth, destinations, forum, misc, providers, resource_aliases, tours, trips, users

settings = get_settings()
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s %(message)s")
logger = logging.getLogger("porikroma.api")

app = FastAPI(
    title="Porikroma API",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)

app.include_router(auth.router, prefix="/api/v1")
app.include_router(users.router, prefix="/api/v1")
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
        return {
            "status": "error",
            "database": "not connected",
            "detail": "Database connectivity check failed",
        }
