from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.database import SessionLocal, init_db
from app.routes import actions, dashboard, pharmacy_risks, reports, signals
from app.seed import seed_demo_data


settings = get_settings()

app = FastAPI(
    title="Smart Pharma Intelligence API",
    description="Local MVP API for pharmaceutical field intelligence.",
    version="0.1.0",
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
