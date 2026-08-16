from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import get_settings

DATABASE_URL = get_settings().database_url

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
)

SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, expire_on_commit=False)


def get_db():
    """Yield a request-scoped SQLAlchemy session and always close it."""
    db: Session = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def test_database():
    with engine.connect() as connection:
        result = connection.execute(text("SELECT 1"))
        return result.scalar()
