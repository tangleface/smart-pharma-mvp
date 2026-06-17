from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import OperationalSignal
from app.schemas import BreakdownPoint, DashboardSummary, TrendPoint
from app.services.analytics import breakdown_by, summary, trends


router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/summary", response_model=DashboardSummary)
def get_summary(db: Session = Depends(get_db)) -> DashboardSummary:
    return summary(db)


@router.get("/trends", response_model=list[TrendPoint])
def get_trends(db: Session = Depends(get_db)) -> list[TrendPoint]:
    return trends(db)


@router.get("/categories", response_model=list[BreakdownPoint])
def get_categories(db: Session = Depends(get_db)) -> list[BreakdownPoint]:
    return breakdown_by(db, OperationalSignal.category)


@router.get("/severity", response_model=list[BreakdownPoint])
def get_severity(db: Session = Depends(get_db)) -> list[BreakdownPoint]:
    return breakdown_by(db, OperationalSignal.severity)

