from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.security import require_roles
from app.db.session import get_db
from app.models.entities import User
from app.schemas.common import ApiResponse, PageResponse
from app.schemas.moderation import ModerationQueueItemResponse, ModerationReviewRequest
from app.services.moderation_service import ModerationService

router = APIRouter()

@router.get("/queue", response_model=ApiResponse[PageResponse[ModerationQueueItemResponse]])
def get_queue(
    page: int = Query(0, ge=0),
    size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(require_roles(["MODERATOR", "ADMIN"])),
    db: Session = Depends(get_db),
):
    data = ModerationService.get_pending_queue(db, page, size)
    return ApiResponse(success=True, message="Request successful", data=data)

@router.post("/queue/{queue_id}/review", response_model=ApiResponse[None])
def review_item(
    queue_id: int,
    request: ModerationReviewRequest,
    current_user: User = Depends(require_roles(["MODERATOR", "ADMIN"])),
    db: Session = Depends(get_db),
):
    ModerationService.review_item(db, current_user.id, queue_id, request)
    return ApiResponse(success=True, message="Review recorded", data=None)
