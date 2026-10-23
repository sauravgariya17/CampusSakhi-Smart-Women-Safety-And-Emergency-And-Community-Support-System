from datetime import datetime
from typing import Optional
from pydantic import BaseModel

class AuditLogResponse(BaseModel):
    id: int
    actorName: str
    actionType: str
    targetType: Optional[str] = None
    targetId: Optional[int] = None
    reason: Optional[str] = None
    timestamp: datetime

    model_config = {"from_attributes": True}
