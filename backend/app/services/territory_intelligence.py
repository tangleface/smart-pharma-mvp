from datetime import datetime, timedelta, timezone

from sqlalchemy import and_, func, select
from sqlalchemy.orm import Session, aliased

from app.models_vnext import (
    VNextClassification,
    VNextObservation,
    VNextPharmacy,
    VNextTerritory,
    VNextUser,
    VNextVisit,
)
from app.schemas_vnext import TerritoryMapPoint, TerritoryMapResponse


COVERAGE_WINDOW_DAYS = 30


def build_territory_map(db: Session) -> TerritoryMapResponse:
    now = datetime.now(timezone.utc)
    window_start = now - timedelta(days=COVERAGE_WINDOW_DAYS)

    visit_stats = (
        select(
            VNextVisit.pharmacy_id.label("pharmacy_id"),
            func.max(VNextVisit.completed_at).label("last_visit_at"),
            func.count(VNextVisit.id)
            .filter(
                and_(
                    VNextVisit.status == "completed",
                    VNextVisit.completed_at >= window_start,
                )
            )
            .label("visits_last_30_days"),
        )
        .group_by(VNextVisit.pharmacy_id)
        .subquery()
    )

    observation_stats = (
        select(
            VNextVisit.pharmacy_id.label("pharmacy_id"),
            func.count(VNextObservation.id).label("observations_last_30_days"),
        )
        .join(VNextVisit, VNextVisit.id == VNextObservation.visit_id)
        .where(VNextObservation.created_at >= window_start)
        .group_by(VNextVisit.pharmacy_id)
        .subquery()
    )

    priority_ranked = (
        select(
            VNextClassification.pharmacy_id.label("pharmacy_id"),
            VNextClassification.value.label("management_priority"),
            func.row_number()
            .over(
                partition_by=VNextClassification.pharmacy_id,
                order_by=VNextClassification.valid_from.desc(),
            )
            .label("rn"),
        )
        .where(
            VNextClassification.classification_type == "priority",
            VNextClassification.pharmacy_id.is_not(None),
            VNextClassification.valid_from <= now,
            (
                VNextClassification.valid_until.is_(None)
                | (VNextClassification.valid_until >= now)
            ),
        )
        .subquery()
    )

    priority = aliased(priority_ranked)

    rows = db.execute(
        select(
            VNextPharmacy.id,
            VNextPharmacy.name,
            VNextPharmacy.internal_code,
            VNextTerritory.name.label("territory"),
            VNextUser.full_name.label("delegate"),
            VNextPharmacy.city,
            VNextPharmacy.latitude,
            VNextPharmacy.longitude,
            VNextPharmacy.segment,
            VNextPharmacy.status.label("pharmacy_status"),
            VNextPharmacy.target_visits_month,
            func.coalesce(visit_stats.c.visits_last_30_days, 0).label("visits_last_30_days"),
            visit_stats.c.last_visit_at,
            priority.c.management_priority,
            func.coalesce(observation_stats.c.observations_last_30_days, 0).label(
                "observations_last_30_days"
            ),
        )
        .outerjoin(VNextTerritory, VNextTerritory.id == VNextPharmacy.territory_id)
        .outerjoin(VNextUser, VNextUser.id == VNextPharmacy.assigned_delegate_id)
        .outerjoin(visit_stats, visit_stats.c.pharmacy_id == VNextPharmacy.id)
        .outerjoin(observation_stats, observation_stats.c.pharmacy_id == VNextPharmacy.id)
        .outerjoin(
            priority,
            and_(
                priority.c.pharmacy_id == VNextPharmacy.id,
                priority.c.rn == 1,
            ),
        )
        .where(
            VNextPharmacy.latitude.is_not(None),
            VNextPharmacy.longitude.is_not(None),
        )
        .order_by(VNextTerritory.name, VNextPharmacy.name)
    ).all()

    points = []
    for row in rows:
        visits = int(row.visits_last_30_days or 0)
        target = row.target_visits_month
        ratio = round(visits / target, 2) if target and target > 0 else None
        coverage_status = _coverage_status(
            pharmacy_status=row.pharmacy_status,
            target=target,
            coverage_ratio=ratio,
        )
        days_since_last_visit = (
            max((now - row.last_visit_at).days, 0)
            if row.last_visit_at is not None
            else None
        )

        points.append(
            TerritoryMapPoint(
                id=row.id,
                name=row.name,
                internal_code=row.internal_code,
                territory=row.territory,
                delegate=row.delegate,
                city=row.city,
                latitude=float(row.latitude),
                longitude=float(row.longitude),
                segment=row.segment,
                pharmacy_status=row.pharmacy_status,
                target_visits_month=target,
                visits_last_30_days=visits,
                coverage_ratio=ratio,
                coverage_status=coverage_status,
                last_visit_at=row.last_visit_at,
                days_since_last_visit=days_since_last_visit,
                management_priority=row.management_priority,
                observations_last_30_days=int(row.observations_last_30_days or 0),
            )
        )

    return TerritoryMapResponse(
        generated_at=now,
        coverage_window_days=COVERAGE_WINDOW_DAYS,
        points=points,
    )


def _coverage_status(
    pharmacy_status: str,
    target: int | None,
    coverage_ratio: float | None,
) -> str:
    if pharmacy_status == "temporarily_excluded":
        return "excluded"
    if target is None or target <= 0 or coverage_ratio is None:
        return "unknown"
    if coverage_ratio >= 1.0:
        return "on_target"
    if coverage_ratio >= 0.5:
        return "watch"
    return "undercovered"
