from datetime import datetime, timedelta, timezone
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models import DelegateReport, NextBestAction, OperationalSignal
from app.schemas import BreakdownPoint, DashboardSummary, TrendPoint


def summary(db: Session) -> DashboardSummary:
    total_reports = db.query(func.count(DelegateReport.id)).scalar() or 0
    total_signals = db.query(func.count(OperationalSignal.id)).scalar() or 0
    critical_alerts = (
        db.query(func.count(OperationalSignal.id))
        .filter(OperationalSignal.severity == "critical")
        .scalar()
        or 0
    )
    unresolved_signals = (
        db.query(func.count(OperationalSignal.id))
        .filter(OperationalSignal.status.in_(["new", "reviewed", "in_progress"]))
        .scalar()
        or 0
    )
    average_urgency = db.query(func.avg(OperationalSignal.urgency_score)).scalar() or 0
    return DashboardSummary(
        total_reports=total_reports,
        total_signals=total_signals,
        critical_alerts=critical_alerts,
        unresolved_signals=unresolved_signals,
        average_urgency_score=round(float(average_urgency), 1),
    )


def trends(db: Session) -> list[TrendPoint]:
    start = datetime.now(timezone.utc).date() - timedelta(days=6)
    rows = (
        db.query(func.date(OperationalSignal.created_at), func.count(OperationalSignal.id))
        .filter(OperationalSignal.created_at >= datetime.combine(start, datetime.min.time()))
        .group_by(func.date(OperationalSignal.created_at))
        .all()
    )
    counts = {row[0]: row[1] for row in rows}
    points = []
    for offset in range(7):
        day = start + timedelta(days=offset)
        key = day.isoformat()
        points.append(TrendPoint(date=key, signals=int(counts.get(key, 0))))
    return points


def breakdown_by(db: Session, column) -> list[BreakdownPoint]:
    rows = (
        db.query(column, func.count(OperationalSignal.id))
        .group_by(column)
        .order_by(func.count(OperationalSignal.id).desc())
        .all()
    )
    return [BreakdownPoint(name=row[0], value=int(row[1])) for row in rows]


def latest_actions(db: Session, limit: int = 8) -> list[NextBestAction]:
    return db.query(NextBestAction).order_by(NextBestAction.created_at.desc()).limit(limit).all()

