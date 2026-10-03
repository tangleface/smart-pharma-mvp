from datetime import datetime
from uuid import UUID

from sqlalchemy import DateTime, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class VNextBase(DeclarativeBase):
    """Mapping-only base for the existing Supabase v0.2 schema.

    Important: this metadata is never used with create_all(); Supabase migrations
    remain the source of truth for schema creation and evolution.
    """

    pass


class VNextUser(VNextBase):
    __tablename__ = "users"

    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True)
    organization_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), nullable=False)
    full_name: Mapped[str] = mapped_column(String, nullable=False)
    role: Mapped[str] = mapped_column(String, nullable=False)


class VNextTerritory(VNextBase):
    __tablename__ = "territories"

    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True)
    organization_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), nullable=False)
    name: Mapped[str] = mapped_column(String, nullable=False)
    city: Mapped[str | None] = mapped_column(String, nullable=True)


class VNextPharmacy(VNextBase):
    __tablename__ = "pharmacies"

    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True)
    organization_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), nullable=False)
    territory_id: Mapped[UUID | None] = mapped_column(PGUUID(as_uuid=True), ForeignKey("territories.id"), nullable=True)
    assigned_delegate_id: Mapped[UUID | None] = mapped_column(PGUUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    internal_code: Mapped[str | None] = mapped_column(String, nullable=True)
    address: Mapped[str | None] = mapped_column(Text, nullable=True)
    city: Mapped[str | None] = mapped_column(String, nullable=True)
    latitude: Mapped[float | None] = mapped_column(Numeric(9, 6), nullable=True)
    longitude: Mapped[float | None] = mapped_column(Numeric(9, 6), nullable=True)
    segment: Mapped[str | None] = mapped_column(String, nullable=True)
    status: Mapped[str] = mapped_column(String, nullable=False)
    target_visits_month: Mapped[int | None] = mapped_column(Integer, nullable=True)


class VNextProduct(VNextBase):
    __tablename__ = "products"

    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True)
    organization_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), nullable=False)
    name: Mapped[str] = mapped_column(String, nullable=False)
    code: Mapped[str | None] = mapped_column(String, nullable=True)
    brand: Mapped[str | None] = mapped_column(String, nullable=True)
    status: Mapped[str] = mapped_column(String, nullable=False)


class VNextVisit(VNextBase):
    __tablename__ = "visits"

    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True)
    organization_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), nullable=False)
    pharmacy_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("pharmacies.id"), nullable=False)
    delegate_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    scheduled_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    status: Mapped[str] = mapped_column(String, nullable=False)


class VNextObservation(VNextBase):
    __tablename__ = "observations"

    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True)
    organization_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), nullable=False)
    visit_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("visits.id"), nullable=False)
    product_id: Mapped[UUID | None] = mapped_column(PGUUID(as_uuid=True), ForeignKey("products.id"), nullable=True)
    category: Mapped[str] = mapped_column(String, nullable=False)
    observation_text: Mapped[str] = mapped_column(Text, nullable=False)
    source: Mapped[str] = mapped_column(String, nullable=False)
    validation_status: Mapped[str] = mapped_column(String, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    validated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    validated_by: Mapped[UUID | None] = mapped_column(PGUUID(as_uuid=True), ForeignKey("users.id"), nullable=True)


class VNextClassification(VNextBase):
    __tablename__ = "classifications"

    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True)
    organization_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), nullable=False)
    pharmacy_id: Mapped[UUID | None] = mapped_column(PGUUID(as_uuid=True), ForeignKey("pharmacies.id"), nullable=True)
    classification_type: Mapped[str] = mapped_column(String, nullable=False)
    value: Mapped[str] = mapped_column(String, nullable=False)
    reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    valid_from: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    valid_until: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class VNextDirective(VNextBase):
    __tablename__ = "directives"

    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True)
    organization_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), nullable=False)
    territory_id: Mapped[UUID | None] = mapped_column(PGUUID(as_uuid=True), ForeignKey("territories.id"), nullable=True)
    pharmacy_id: Mapped[UUID | None] = mapped_column(PGUUID(as_uuid=True), ForeignKey("pharmacies.id"), nullable=True)
    product_id: Mapped[UUID | None] = mapped_column(PGUUID(as_uuid=True), ForeignKey("products.id"), nullable=True)
    title: Mapped[str] = mapped_column(String, nullable=False)
    instruction: Mapped[str] = mapped_column(Text, nullable=False)
    reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_by: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    valid_from: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    valid_until: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    status: Mapped[str] = mapped_column(String, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)


class VNextAction(VNextBase):
    __tablename__ = "actions"

    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True)
    organization_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), nullable=False)
    pharmacy_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("pharmacies.id"), nullable=False)
    visit_id: Mapped[UUID | None] = mapped_column(PGUUID(as_uuid=True), ForeignKey("visits.id"), nullable=True)
    observation_id: Mapped[UUID | None] = mapped_column(PGUUID(as_uuid=True), ForeignKey("observations.id"), nullable=True)
    title: Mapped[str] = mapped_column(String, nullable=False)
    action_type: Mapped[str] = mapped_column(String, nullable=False)
    status: Mapped[str] = mapped_column(String, nullable=False)
    priority: Mapped[str] = mapped_column(String, nullable=False)
    assigned_to: Mapped[UUID | None] = mapped_column(PGUUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    created_by: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    source: Mapped[str] = mapped_column(String, nullable=False)
    rationale: Mapped[str | None] = mapped_column(Text, nullable=True)
    due_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
