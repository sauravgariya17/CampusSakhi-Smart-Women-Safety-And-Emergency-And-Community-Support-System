import math
from app.core.config import settings
from fastapi import HTTPException, status

EARTH_RADIUS_KM = 6371.0

def distance_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Great-circle distance between two points in kilometers using Haversine formula."""
    d_lat = math.radians(lat2 - lat1)
    d_lng = math.radians(lng2 - lng1)
    a = (math.sin(d_lat / 2.0) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(d_lng / 2.0) ** 2)
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return EARTH_RADIUS_KM * c

def ensure_within_campus_scope(lat: float, lng: float):
    """Enforce campus radius for journey start/dest points."""
    dist = distance_km(settings.MAP_CENTER_LAT, settings.MAP_CENTER_LNG, lat, lng)
    if dist > settings.MAP_BOUNDS_RADIUS_KM:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"Selected location is outside the GEHU campus service area ({settings.MAP_BOUNDS_RADIUS_KM} km radius). "
                f"This platform is scoped to GEHU Clement Town and its immediate surroundings only."
            )
        )
