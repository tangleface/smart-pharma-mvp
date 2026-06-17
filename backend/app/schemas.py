from datetime import datetime
from typing import Literal
from pydantic import BaseModel, ConfigDict, Field


CATEGORIES = (
    "competitor_activity",
    "product_feedback",
    "stock_issue",
    "pricing_pressure",
    "prescriber_sentiment",
    "market_access",
    "safety_concern",
    "opportunity",
)

SEVERITIES = ("low", "medium", "high", "critical")


class ReportCreate(BaseModel):
    delegate_name: str = Field(min_length=2, max_length=120)
    region: str = Field(min_length=2, max_length=120)
    territory: str = Field(min_length=2, max_length=120)
    healthcare_provider: str = Field(min_length=2, max_length=160)
    institution: str | None = Field(default=None, max_length=180)
    report_text: str = Field(min_length=20)
    visit_date: datetime


class ReportResponse(BaseModel):
    id: int
    delegate_name: str
    region: str
    territory: str
    healthcare_provider: str
    institution: str | None
    report_text: str
    visit_date: datetime
    created_at: datetime
    signal_count: int = 0

    model_config = ConfigDict(from_attributes=True)


class NextBestActionPayload(BaseModel):
    action_type: str
    title: str
    rationale: str
    suggested_owner: str
    priority: str
    due_in_days: int


class AnalysisPayload(BaseModel):
    title: str
    summary: str
    category: str
    severity: str
    confidence_score: float
    urgency_score: float
    detected_entities: list[str]
    recommended_action: str
    next_best_action: NextBestActionPayload


class SignalResponse(BaseModel):
    id: int
    report_id: int
    title: str
    summary: str
    category: str
    severity: str
    confidence_score: float
    region: str
    territory: str
    detected_entities: list[str]
    recommended_action: str
    status: str
    urgency_score: float
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ActionResponse(BaseModel):
    id: int
    signal_id: int
    action_type: str
    title: str
    rationale: str
    suggested_owner: str
    priority: str
    due_in_days: int
    created_at: datetime
    signal_title: str | None = None
    signal_category: str | None = None
    signal_severity: str | None = None

    model_config = ConfigDict(from_attributes=True)


class SignalDetailResponse(BaseModel):
    signal: SignalResponse
    source_report: ReportResponse
    next_best_actions: list[ActionResponse]


class DashboardSummary(BaseModel):
    total_reports: int
    total_signals: int
    critical_alerts: int
    unresolved_signals: int
    average_urgency_score: float


class TrendPoint(BaseModel):
    date: str
    signals: int


class BreakdownPoint(BaseModel):
    name: str
    value: int


UrgencyLevel = Literal["low", "medium", "high", "critical"]
PotentialLevel = Literal["low", "medium", "high"]


class PharmacyRiskSummary(BaseModel):
    critical_pharmacies: int
    high_risk_pharmacies: int
    zones_requiring_action: int
    suggested_visits_this_week: int


class PharmacyScoreBreakdown(BaseModel):
    label: str
    value: int
    reason: str


class PharmacyRiskItem(BaseModel):
    id: str
    pharmacy_name: str
    zone: str
    city: str
    last_visit_days: int
    risk_score: int
    urgency_level: UrgencyLevel
    score_breakdown: list[PharmacyScoreBreakdown]
    main_issue: str
    priority_explanation: str
    suggested_delegate: str
    delegate_zone: str
    delegate_strength: str
    delegate_workload: str
    delegate_explanation: str
    recommended_action: str
    recommended_timeframe: str
    rotation_reason: str
    assignment_criteria: list[str]
    confidence_level: str
    signals_count: int
    potential_level: PotentialLevel
    risk_factors: list[str]


class PharmacyRiskZone(BaseModel):
    zone: str
    city: str
    risk_score: int
    urgency_level: UrgencyLevel
    pharmacies_count: int
    main_issue: str
    suggested_delegate: str
    recommended_action: str
    top_pharmacy: str
    risk_drivers: list[str]
    action_timeframe: str


class PharmacyRiskResponse(BaseModel):
    summary: PharmacyRiskSummary
    pharmacies: list[PharmacyRiskItem]
    zones: list[PharmacyRiskZone]
