from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field

class TriggerSosRequest(BaseModel):
    category: str = Field(default="PERSONAL_SAFETY")
    lat: float = Field(..., ge=-90.0, le=90.0)
    lng: float = Field(..., ge=-180.0, le=180.0)

class ResolveSosRequest(BaseModel):
    outcome: str = Field(..., description="Must be RESOLVED or FALSE_ALARM")
    notes: Optional[str] = Field(None, max_length=1000)

class SosResponse(BaseModel):
    id: int
    category: str
    lat: float
    lng: float
    status: str
    confirmationExpiresAt: Optional[datetime] = None
    triggeredAt: Optional[datetime] = None
    createdAt: datetime
    acknowledgedAt: Optional[datetime] = None
    resolvedAt: Optional[datetime] = None
    notes: Optional[str] = None

    model_config = {"from_attributes": True}

class SosManagementResponse(BaseModel):
    id: int
    requesterUserId: int
    requesterName: str
    requesterPhone: Optional[str] = None
    category: str
    lat: float
    lng: float
    status: str
    triggeredAt: Optional[datetime] = None
    acknowledgedByName: Optional[str] = None
    acknowledgedAt: Optional[datetime] = None
    resolvedAt: Optional[datetime] = None
    notes: Optional[str] = None

    model_config = {"from_attributes": True}
