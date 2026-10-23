from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field

class ModerationReviewRequest(BaseModel):
    decision: str = Field(..., description="APPROVED or REMOVED")

class ModerationQueueItemResponse(BaseModel):
    queueId: int
    targetType: str
    targetId: int
    reason: Optional[str] = None
    flaggedBy: str
    status: str
    contentPreview: str
    contentAuthorHandle: str
    createdAt: datetime

    model_config = {"from_attributes": True}
