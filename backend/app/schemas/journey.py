from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field

class StartJourneyRequest(BaseModel):
    startLat: float = Field(..., ge=-90.0, le=90.0)
    startLng: float = Field(..., ge=-180.0, le=180.0)
    destLat: float = Field(..., ge=-90.0, le=90.0)
    destLng: float = Field(..., ge=-180.0, le=180.0)
    expectedDurationMinutes: int = Field(..., ge=1, le=180)
    trustedContactIds: Optional[List[int]] = []

class JourneyPingRequest(BaseModel):
    lat: float = Field(..., ge=-90.0, le=90.0)
    lng: float = Field(..., ge=-180.0, le=180.0)

class RouteResponse(BaseModel):
    waypoints: List[List[float]] = []
    distanceMeters: float
    estimatedDurationSeconds: int
    provider: str

class JourneyResponse(BaseModel):
    id: int
    startLat: float
    startLng: float
    destLat: float
    destLng: float
    startTime: datetime
    expectedArrival: datetime
    status: str
    lastKnownLat: Optional[float] = None
    lastKnownLng: Optional[float] = None
    lastPingAt: Optional[datetime] = None
    trackingToken: str
    shareUrl: str
    route: Optional[RouteResponse] = None
    notifiedContactNames: List[str] = []

    model_config = {"from_attributes": True}

class JourneyShareResponse(BaseModel):
    status: str
    destLat: float
    destLng: float
    expectedArrival: datetime
    lastKnownLat: Optional[float] = None
    lastKnownLng: Optional[float] = None
    lastPingAt: Optional[datetime] = None

    model_config = {"from_attributes": True}
