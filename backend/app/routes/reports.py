import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import DelegateReport, NextBestAction, OperationalSignal
from app.schemas import ReportCreate, ReportResponse, SignalResponse
from app.services.ai_analysis import analyze_report, pharma_recommended_action_for, pharma_signal_summary_for, pharma_signal_title_for


router = APIRouter(prefix="/reports", tags=["reports"])


@router.post("", response_model=ReportResponse)
def create_report(payload: ReportCreate, db: Session = Depends(get_db)) -> ReportResponse:
    report = DelegateReport(**payload.model_dump())
    db.add(report)
    db.commit()
    db.refresh(report)
    return _report_response(report)


@router.get("", response_model=list[ReportResponse])
def list_reports(db: Session = Depends(get_db)) -> list[ReportResponse]:
    reports = db.query(DelegateReport).order_by(DelegateReport.created_at.desc()).all()
    return [_report_response(report) for report in reports]


@router.post("/{report_id}/analyze", response_model=SignalResponse)
def analyze(report_id: int, db: Session = Depends(get_db)) -> SignalResponse:
    report = db.get(DelegateReport, report_id)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    payload = analyze_report(report)
    signal = OperationalSignal(
        report_id=report.id,
        title=payload.title,
        summary=payload.summary,
        category=payload.category,
        severity=payload.severity,
        confidence_score=payload.confidence_score,
        region=report.region,
        territory=report.territory,
        detected_entities=json.dumps(payload.detected_entities),
        recommended_action=payload.recommended_action,
        status="new",
        urgency_score=payload.urgency_score,
    )
    db.add(signal)
    db.flush()

    action_payload = payload.next_best_action
    action = NextBestAction(
        signal_id=signal.id,
        action_type=action_payload.action_type,
        title=action_payload.title,
        rationale=action_payload.rationale,
        suggested_owner=action_payload.suggested_owner,
        priority=action_payload.priority,
        due_in_days=action_payload.due_in_days,
    )
    db.add(action)
    db.commit()
    db.refresh(signal)
    return _signal_response(signal)


def _report_response(report: DelegateReport) -> ReportResponse:
    data = ReportResponse.model_validate(report)
    data.signal_count = len(report.signals)
    return data


def _signal_response(signal: OperationalSignal) -> SignalResponse:
    return SignalResponse(
        id=signal.id,
        report_id=signal.report_id,
        title=pharma_signal_title_for(signal.category, signal.territory),
        summary=pharma_signal_summary_for(signal.category, signal.territory, signal.report.healthcare_provider),
        category=signal.category,
        severity=signal.severity,
        confidence_score=signal.confidence_score,
        region=signal.region,
        territory=signal.territory,
        detected_entities=_parse_detected_entities(signal.detected_entities),
        recommended_action=pharma_recommended_action_for(signal.category),
        status=signal.status,
        urgency_score=signal.urgency_score,
        created_at=signal.created_at,
    )


def _parse_detected_entities(value: str | None) -> list[str]:
    try:
        parsed = json.loads(value or "[]")
    except (TypeError, json.JSONDecodeError):
        return []
    if not isinstance(parsed, list):
        return []
    return [item for item in parsed if isinstance(item, str)]
