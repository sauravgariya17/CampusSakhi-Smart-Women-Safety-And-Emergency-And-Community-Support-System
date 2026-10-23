from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.common import ApiResponse
from app.schemas.map import MapConfigResponse, SafeZoneResponse
from app.services.map_service import MapService

router = APIRouter()

@router.get("/config", response_model=ApiResponse[MapConfigResponse])
def get_map_config():
    data = MapService.get_map_config()
    return ApiResponse(success=True, message="Request successful", data=data)

@router.get("/safe-zones", response_model=ApiResponse[List[SafeZoneResponse]])
def get_safe_zones(db: Session = Depends(get_db)):
    data = MapService.get_safe_zones(db)
    return ApiResponse(success=True, message="Request successful", data=data)
