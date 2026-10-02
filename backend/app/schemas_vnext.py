from datetime import datetime
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
