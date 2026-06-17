from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import NextBestAction
from app.schemas import ActionResponse
from app.services.ai_analysis import pharma_next_best_action_for, pharma_signal_title_for


router = APIRouter(prefix="/actions", tags=["actions"])


@router.get("", response_model=list[ActionResponse])
def list_actions(db: Session = Depends(get_db)) -> list[ActionResponse]:
    actions = db.query(NextBestAction).order_by(NextBestAction.created_at.desc()).all()
    responses = []
    for action in actions:
        item = ActionResponse.model_validate(action)
        pharma_action = pharma_next_best_action_for(action.signal.category)
        item.action_type = pharma_action.action_type
        item.title = pharma_action.title
        item.rationale = pharma_action.rationale
        item.suggested_owner = pharma_action.suggested_owner
        item.priority = pharma_action.priority
        item.due_in_days = pharma_action.due_in_days
        item.signal_title = pharma_signal_title_for(action.signal.category, action.signal.territory)
        item.signal_category = action.signal.category
        item.signal_severity = action.signal.severity
        responses.append(item)
    return responses
