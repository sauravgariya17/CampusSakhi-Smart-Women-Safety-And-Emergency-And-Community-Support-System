from typing import List
from app.utils.geo import distance_km
from app.schemas.journey import RouteResponse

AVERAGE_WALKING_SPEED_KMH = 4.5

class StraightLineRoutingProvider:
    @staticmethod
    def get_route(start_lat: float, start_lng: float, dest_lat: float, dest_lng: float) -> RouteResponse:
        dist_km = distance_km(start_lat, start_lng, dest_lat, dest_lng)
        duration_seconds = int(round((dist_km / AVERAGE_WALKING_SPEED_KMH) * 3600))

        return RouteResponse(
            waypoints=[
                [start_lat, start_lng],
                [dest_lat, dest_lng]
            ],
            distanceMeters=round(dist_km * 1000.0, 1),
            estimatedDurationSeconds=duration_seconds,
            provider="straight-line-v1"
        )
