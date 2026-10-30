from typing import List
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.entities import SafeZone, User
from app.schemas.map import MapConfigResponse, SafeZoneResponse

DEFAULT_SAFE_ZONES = [
    {
        "name": "GEHU Main Gate Security Post",
        "type": "SECURITY_POST",
        "lat": 30.2682,
        "lng": 77.9964,
        "description": "24/7 manned security checkpoint at Clement Town main campus gate.",
    },
    {
        "name": "Campus Medical & Helpdesk Center",
        "type": "HELPDESK",
        "lat": 30.2671,
        "lng": 77.9952,
        "description": "Emergency first-aid and student helpdesk staff on duty.",
    },
    {
        "name": "Women's Hostel Warden Office (Block A)",
        "type": "WARDEN_OFFICE",
        "lat": 30.2665,
        "lng": 77.9948,
        "description": "Safe shelter and immediate warden assistance for female students.",
    },
    {
        "name": "Central Library 24x7 Reading Hall",
        "type": "SAFE_LANDMARK",
        "lat": 30.2677,
        "lng": 77.9958,
        "description": "Well-lit, CCTV-monitored academic block with security guard presence.",
    },
]

class MapService:
    LEGACY_DEMO_EMAILS = (
        "student@gehu.ac.in",
        "moderator@gehu.ac.in",
        "security@gehu.ac.in",
        "admin@gehu.ac.in",
    )

    @staticmethod
    def disable_legacy_demo_accounts(db: Session) -> None:
        """Disable accounts created by older releases with publicly known credentials."""
        db.query(User).filter(
            User.email.in_(MapService.LEGACY_DEMO_EMAILS),
            User.is_active.is_(True),
        ).update({User.is_active: False}, synchronize_session=False)
        db.commit()

    @staticmethod
    def get_map_config() -> MapConfigResponse:
        return MapConfigResponse(
            centerLat=settings.MAP_CENTER_LAT,
            centerLng=settings.MAP_CENTER_LNG,
            boundsRadiusKm=settings.MAP_BOUNDS_RADIUS_KM,
        )

    @staticmethod
    def get_safe_zones(db: Session) -> List[SafeZoneResponse]:
        zones = db.query(SafeZone).order_by(SafeZone.id.asc()).all()
        return [
            SafeZoneResponse(
                id=z.id,
                name=z.name,
                type=z.type,
                lat=z.lat,
                lng=z.lng,
                description=z.description,
            )
            for z in zones
        ]

    @staticmethod
    def seed_defaults_if_empty(db: Session) -> None:
        if db.query(SafeZone).count() == 0:
            for z in DEFAULT_SAFE_ZONES:
                db.add(SafeZone(**z))
            db.commit()
