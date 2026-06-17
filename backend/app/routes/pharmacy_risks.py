from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas import PharmacyRiskResponse
from app.services.pharmacy_risk import build_pharmacy_risk_intelligence


router = APIRouter(prefix="/pharmacy-risks", tags=["pharmacy-risks"])


@router.get("", response_model=PharmacyRiskResponse)
def get_pharmacy_risks(db: Session = Depends(get_db)) -> PharmacyRiskResponse:
    return build_pharmacy_risk_intelligence(db)
