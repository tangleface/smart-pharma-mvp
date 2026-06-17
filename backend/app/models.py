from datetime import datetime, timezone
from sqlalchemy import DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class DelegateReport(Base):
    __tablename__ = "delegate_reports"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    delegate_name: Mapped[str] = mapped_column(String(120), nullable=False)
    region: Mapped[str] = mapped_column(String(120), nullable=False, index=True)
    territory: Mapped[str] = mapped_column(String(120), nullable=False, index=True)
    healthcare_provider: Mapped[str] = mapped_column(String(160), nullable=False)
    institution: Mapped[str | None] = mapped_column(String(180), nullable=True)
    report_text: Mapped[str] = mapped_column(Text, nullable=False)
    visit_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    signals: Mapped[list["OperationalSignal"]] = relationship(
        back_populates="report", cascade="all, delete-orphan"
    )


class OperationalSignal(Base):
    __tablename__ = "operational_signals"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    report_id: Mapped[int] = mapped_column(ForeignKey("delegate_reports.id"), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(220), nullable=False)
    summary: Mapped[str] = mapped_column(Text, nullable=False)
    category: Mapped[str] = mapped_column(String(80), nullable=False, index=True)
    severity: Mapped[str] = mapped_column(String(40), nullable=False, index=True)
    confidence_score: Mapped[float] = mapped_column(Float, nullable=False)
    region: Mapped[str] = mapped_column(String(120), nullable=False, index=True)
    territory: Mapped[str] = mapped_column(String(120), nullable=False, index=True)
    detected_entities: Mapped[str] = mapped_column(Text, nullable=False, default="[]")
    recommended_action: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(String(40), nullable=False, default="new", index=True)
    urgency_score: Mapped[float] = mapped_column(Float, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    report: Mapped[DelegateReport] = relationship(back_populates="signals")
    actions: Mapped[list["NextBestAction"]] = relationship(
        back_populates="signal", cascade="all, delete-orphan"
    )


class NextBestAction(Base):
    __tablename__ = "next_best_actions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    signal_id: Mapped[int] = mapped_column(ForeignKey("operational_signals.id"), nullable=False, index=True)
    action_type: Mapped[str] = mapped_column(String(80), nullable=False)
    title: Mapped[str] = mapped_column(String(220), nullable=False)
    rationale: Mapped[str] = mapped_column(Text, nullable=False)
    suggested_owner: Mapped[str] = mapped_column(String(120), nullable=False)
    priority: Mapped[str] = mapped_column(String(40), nullable=False, index=True)
    due_in_days: Mapped[int] = mapped_column(Integer, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    signal: Mapped[OperationalSignal] = relationship(back_populates="actions")

