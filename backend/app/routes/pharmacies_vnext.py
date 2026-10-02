from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from sqlalchemy import and_, func, select
from sqlalchemy.orm import Session, aliased

from app.database_vnext import get_vnext_db
from app.models_vnext import (
    VNextClassification,
    VNextPharmacy,
    VNextTerritory,
    VNextUser,
    VNextVisit,
)
from app.schemas_vnext import PharmacyVNextListItem


router = APIRouter(prefix="/vnext/pharmacies", tags=["vnext-pharmacies"])


@router.get("", response_model=list[PharmacyVNextListItem])
def list_pharmacies(db: Session = Depends(get_vnext_db)) -> list[PharmacyVNextListItem]:
    now = datetime.now(timezone.utc)
    month_start = datetime(now.year, now.month, 1, tzinfo=timezone.utc)

    visit_stats = (
        select(
            VNextVisit.pharmacy_id.label("pharmacy_id"),
            func.max(VNextVisit.completed_at).label("last_visit_at"),
            func.count(VNextVisit.id)
            .filter(
                and_(
                    VNextVisit.status == "completed",
                    VNextVisit.completed_at >= month_start,
                )
            )
            .label("visits_this_month"),
        )
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
            VNextPharmacy.status,
            VNextPharmacy.target_visits_month,
            func.coalesce(visit_stats.c.visits_this_month, 0).label("visits_this_month"),
            visit_stats.c.last_visit_at,
            priority.c.management_priority,
        )
        .outerjoin(VNextTerritory, VNextTerritory.id == VNextPharmacy.territory_id)
        .outerjoin(VNextUser, VNextUser.id == VNextPharmacy.assigned_delegate_id)
        .outerjoin(visit_stats, visit_stats.c.pharmacy_id == VNextPharmacy.id)
        .outerjoin(
            priority,
            and_(
                priority.c.pharmacy_id == VNextPharmacy.id,
                priority.c.rn == 1,
            ),
        )
        .order_by(VNextTerritory.name, VNextPharmacy.name)
    ).all()

    return [
        PharmacyVNextListItem(
            id=row.id,
            name=row.name,
            internal_code=row.internal_code,
            territory=row.territory,
            delegate=row.delegate,
            city=row.city,
            latitude=float(row.latitude) if row.latitude is not None else None,
            longitude=float(row.longitude) if row.longitude is not None else None,
            segment=row.segment,
            status=row.status,
            target_visits_month=row.target_visits_month,
            visits_this_month=int(row.visits_this_month or 0),
            last_visit_at=row.last_visit_at,
            management_priority=row.management_priority,
        )
        for row in rows
    ]
