from functools import lru_cache
from collections.abc import Generator

from fastapi import HTTPException
from sqlalchemy import create_engine
from sqlalchemy.engine import Engine
from sqlalchemy.orm import Session, sessionmaker

from app.config import get_settings


def _normalize_postgres_url(url: str) -> str:
    """Force SQLAlchemy to use psycopg v3 for Postgres URLs."""
    if url.startswith("postgresql+psycopg://"):
        return url
    if url.startswith("postgresql://"):
        return url.replace("postgresql://", "postgresql+psycopg://", 1)
    if url.startswith("postgres://"):
        return url.replace("postgres://", "postgresql+psycopg://", 1)
    return url


@lru_cache
def get_vnext_engine() -> Engine:
    settings = get_settings()
    if not settings.vnext_database_url:
        raise RuntimeError("VNEXT_DATABASE_URL is not configured")

    return create_engine(
        _normalize_postgres_url(settings.vnext_database_url),
        pool_pre_ping=True,
        pool_recycle=300,
    )


@lru_cache
def get_vnext_session_factory() -> sessionmaker[Session]:
    return sessionmaker(
        autocommit=False,
        autoflush=False,
        bind=get_vnext_engine(),
    )


def get_vnext_db() -> Generator[Session, None, None]:
    try:
        session_factory = get_vnext_session_factory()
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc

    db = session_factory()
    try:
        yield db
    finally:
        db.close()
