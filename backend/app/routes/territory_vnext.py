from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database_vnext import get_vnext_db
from app.schemas_vnext import TerritoryMapResponse
from app.services.territory_intelligence import build_territory_map


router = APIRouter(prefix="/vnext/territory", tags=["vnext-territory"])


@router.get("/map", response_model=TerritoryMapResponse)
def territory_map(db: Session = Depends(get_vnext_db)) -> TerritoryMapResponse:
    return build_territory_map(db)
