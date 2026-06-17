import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import OperationalSignal
from app.schemas import ActionResponse, ReportResponse, SignalDetailResponse, SignalResponse
from app.services.ai_analysis import (
    pharma_next_best_action_for,
    pharma_recommended_action_for,
    pharma_signal_summary_for,
    pharma_signal_title_for,
)


router = APIRouter(prefix="/signals", tags=["signals"])


@router.get("", response_model=list[SignalResponse])
def list_signals(db: Session = Depends(get_db)) -> list[SignalResponse]:
    signals = db.query(OperationalSignal).order_by(OperationalSignal.created_at.desc()).all()
    return [_signal_response(signal) for signal in signals]


@router.get("/{signal_id}", response_model=SignalDetailResponse)
def get_signal(signal_id: int, db: Session = Depends(get_db)) -> SignalDetailResponse:
    signal = db.get(OperationalSignal, signal_id)
    if not signal:
        raise HTTPException(status_code=404, detail="Signal not found")

    report = ReportResponse.model_validate(signal.report)
    report.signal_count = len(signal.report.signals)

    actions = []
    for action in signal.actions:
        item = ActionResponse.model_validate(action)
        pharma_action = pharma_next_best_action_for(signal.category)
        item.action_type = pharma_action.action_type
        item.title = pharma_action.title
        item.rationale = pharma_action.rationale
        item.suggested_owner = pharma_action.suggested_owner
        item.priority = pharma_action.priority
        item.due_in_days = pharma_action.due_in_days
        item.signal_title = pharma_signal_title_for(signal.category, signal.territory)
        item.signal_category = signal.category
        item.signal_severity = signal.severity
        actions.append(item)

    return SignalDetailResponse(
        signal=_signal_response(signal),
        source_report=report,
        next_best_actions=actions,
    )


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
