from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.security import require_roles
from app.db.session import get_db
from app.models.entities import User
from app.schemas.analytics import SafetyAnalyticsResponse
from app.schemas.common import ApiResponse
from app.services.analytics_service import AnalyticsService

router = APIRouter()

@router.get("/safety", response_model=ApiResponse[SafetyAnalyticsResponse])
def get_safety_analytics(
    windowDays: int = Query(30, ge=1, le=365),
    current_user: User = Depends(require_roles(["MODERATOR", "ADMIN"])),
    db: Session = Depends(get_db),
):
    data = AnalyticsService.get_analytics(db, windowDays)
    return ApiResponse(success=True, message="Request successful", data=data)
