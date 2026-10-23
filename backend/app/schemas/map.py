from typing import Optional
from pydantic import BaseModel

class MapConfigResponse(BaseModel):
    centerLat: float
    centerLng: float
    boundsRadiusKm: float

class SafeZoneResponse(BaseModel):
    id: int
    name: str
    type: str
    lat: float
    lng: float
    description: Optional[str] = None

    model_config = {"from_attributes": True}
