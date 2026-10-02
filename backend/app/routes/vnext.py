from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.config import get_settings
from app.database_vnext import get_vnext_db


router = APIRouter(prefix="/vnext", tags=["vnext"])


@router.get("/health")
def vnext_health(db: Session = Depends(get_vnext_db)) -> dict[str, object]:
    """Minimal Gate: prove FastAPI can read the Supabase v0.2 database."""
    pharmacy_count = int(
        db.execute(text("select count(*) from public.pharmacies")).scalar_one()
    )
    visit_count = int(
        db.execute(text("select count(*) from public.visits")).scalar_one()
    )
    return {
        "status": "ok",
        "database": "supabase-postgresql",
        "pharmacies": pharmacy_count,
        "visits": visit_count,
        "expected_demo_pharmacies": 30,
        "gate_passed": pharmacy_count == 30,
    }


@router.get("/config")
def vnext_config_status() -> dict[str, object]:
    settings = get_settings()
    return {
        "vnext_database_configured": bool(settings.vnext_database_url),
        "legacy_database": "sqlite" if settings.database_url.startswith("sqlite") else "configured",
    }
