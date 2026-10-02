from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.database import SessionLocal, init_db
from app.routes import (
    actions,
    dashboard,
    pharmacies_vnext,
    pharmacy_risks,
    reports,
    signals,
    vnext,
)
from app.seed import seed_demo_data


settings = get_settings()

app = FastAPI(
    title="Smart Pharma Intelligence API",
    description="Smart Pharma MVP API with an isolated experimental v0.2 data layer.",
    version="0.2.0-experimental",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.frontend_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup() -> None:
    # Legacy MVP stays untouched and continues to use SQLite.
    init_db()
    db = SessionLocal()
    try:
        seed_demo_data(db)
    finally:
        db.close()


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "smart-pharma-intelligence"}


app.include_router(reports.router)
app.include_router(signals.router)
app.include_router(dashboard.router)
app.include_router(actions.router)
app.include_router(pharmacy_risks.router)

# Experimental v0.2 routes use Supabase/PostgreSQL through a separate DB session.
app.include_router(vnext.router)
app.include_router(pharmacies_vnext.router)
