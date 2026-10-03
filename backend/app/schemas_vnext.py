from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel


class PharmacyVNextListItem(BaseModel):
    id: UUID
    name: str
    internal_code: str | None
    territory: str | None
    delegate: str | None
    city: str | None
    latitude: float | None
    longitude: float | None
    segment: str | None
    status: str
    target_visits_month: int | None
    visits_this_month: int
    last_visit_at: datetime | None
    management_priority: str | None


CoverageStatus = Literal["on_target", "watch", "undercovered", "excluded", "unknown"]


class TerritoryMapPoint(BaseModel):
    id: UUID
    name: str
    internal_code: str | None
    territory: str | None
    delegate: str | None
    city: str | None
    latitude: float
    longitude: float
    segment: str | None
    pharmacy_status: str

    target_visits_month: int | None
    visits_last_30_days: int
    coverage_ratio: float | None
    coverage_status: CoverageStatus

    last_visit_at: datetime | None
    days_since_last_visit: int | None

    management_priority: str | None
    observations_last_30_days: int


class TerritoryMapResponse(BaseModel):
    generated_at: datetime
    coverage_window_days: int
    points: list[TerritoryMapPoint]


class PharmacyObservationContext(BaseModel):
    id: UUID
    category: str
    text: str
    product: str | None
    source: str
    validation_status: str
    observed_at: datetime
    validated_at: datetime | None
    validated_by: str | None


class PharmacyDirectiveContext(BaseModel):
    id: UUID
    title: str
    instruction: str
    reason: str | None
    product: str | None
    scope: str
    status: str
    valid_from: datetime
    valid_until: datetime | None
    created_by: str


class PharmacyActionContext(BaseModel):
    id: UUID
    title: str
    action_type: str
    status: str
    priority: str
    source: str
    rationale: str | None
    due_at: datetime | None
    assigned_to: str | None
    created_by: str


class PharmacyContextResponse(BaseModel):
    pharmacy_id: UUID
    name: str
    internal_code: str | None
    territory: str | None
    delegate: str | None
    segment: str | None
    pharmacy_status: str
    management_priority: str | None
    management_priority_reason: str | None
    observations: list[PharmacyObservationContext]
    directives: list[PharmacyDirectiveContext]
    actions: list[PharmacyActionContext]
