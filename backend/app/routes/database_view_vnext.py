from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends
from fastapi.encoders import jsonable_encoder
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.database_vnext import get_vnext_db
from app.models import DelegateReport
from app.models_vnext import (
    VNextAction,
    VNextClassification,
    VNextDirective,
    VNextObservation,
    VNextPharmacy,
    VNextProduct,
    VNextTerritory,
    VNextUser,
    VNextVisit,
)

router = APIRouter(prefix="/vnext/database", tags=["vnext-database"])


def _rows(db: Session, model: type[Any], fields: list[str]) -> list[dict[str, Any]]:
    records = db.execute(select(model)).scalars().all()
    return [{field: getattr(record, field, None) for field in fields} for record in records]


@router.get("/overview")
def database_overview(db: Session = Depends(get_vnext_db)) -> dict[str, Any]:
    specs = [
        ("pharmacies", "Pharmacies", VNextPharmacy, [
            "internal_code", "name", "city", "segment", "status", "target_visits_month"
        ]),
        ("products", "Produits", VNextProduct, ["code", "name", "brand", "status"]),
        ("users", "Utilisateurs", VNextUser, ["full_name", "role"]),
        ("territories", "Territoires", VNextTerritory, ["name", "city"]),
        ("visits", "Visites", VNextVisit, ["pharmacy_id", "delegate_id", "status", "scheduled_at", "completed_at"]),
        ("observations", "Observations", VNextObservation, [
            "visit_id", "product_id", "category", "observation_text", "source", "validation_status", "created_at"
        ]),
        ("classifications", "Classifications", VNextClassification, [
            "pharmacy_id", "classification_type", "value", "reason", "valid_from", "valid_until"
        ]),
        ("directives", "Directives", VNextDirective, [
            "territory_id", "pharmacy_id", "product_id", "title", "instruction", "status", "valid_from", "valid_until"
        ]),
        ("actions", "Actions", VNextAction, [
            "pharmacy_id", "title", "action_type", "status", "priority", "source", "due_at"
        ]),
    ]

    datasets = []
    for key, label, model, fields in specs:
        rows = _rows(db, model, fields)
        datasets.append({
            "key": key,
            "label": label,
            "source": "PostgreSQL / Supabase v0.2",
            "count": len(rows),
            "rows": jsonable_encoder(rows),
        })

    legacy = SessionLocal()
    try:
        reports = legacy.execute(select(DelegateReport)).scalars().all()
    finally:
        legacy.close()

    grouped: dict[tuple[str, str | None, str, str], dict[str, Any]] = {}
    for report in reports:
        key = (
            report.healthcare_provider,
            report.institution,
            report.region,
            report.territory,
        )
        item = grouped.setdefault(key, {
            "name": report.healthcare_provider,
            "institution": report.institution,
            "region": report.region,
            "territory": report.territory,
            "reports_count": 0,
            "last_visit": report.visit_date,
        })
        item["reports_count"] += 1
        if report.visit_date > item["last_visit"]:
            item["last_visit"] = report.visit_date

    hcp_rows = sorted(grouped.values(), key=lambda row: row["last_visit"], reverse=True)
    datasets.insert(1, {
        "key": "healthcare_providers_legacy",
        "label": "Médecins / HCP",
        "source": "Rapports historiques — SQLite legacy",
        "count": len(hcp_rows),
        "note": "Les médecins/HCP ne sont pas encore modélisés comme entité dédiée dans PostgreSQL v0.2.",
        "rows": jsonable_encoder(hcp_rows),
    })

    return {
        "status": "ok",
        "mode": "read_only_demo",
        "primary_database": "PostgreSQL / Supabase",
        "datasets": datasets,
    }
