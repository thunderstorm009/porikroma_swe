"""SQLAlchemy declarative base used by application models and Alembic."""

from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    pass
