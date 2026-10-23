from typing import List
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import hash_password
from app.models.entities import CommunityPost, RoleEnum, SafeZone, User
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

        # Ensure demo role accounts exist in both MySQL and SQLite fallback
        demo_specs = [
            {
                "name": "Ananya Sharma",
                "email": "student@gehu.ac.in",
                "phone_encrypted": "+91-9876543210",
                "role": RoleEnum.USER.value,
                "anonymous_handle": "brave_sparrow_482",
            },
            {
                "name": "Meera Rawat (Moderator)",
                "email": "moderator@gehu.ac.in",
                "phone_encrypted": "+91-9876543211",
                "role": RoleEnum.MODERATOR.value,
                "anonymous_handle": "calm_lotus_109",
            },
            {
                "name": "Chief Security Officer Negi",
                "email": "security@gehu.ac.in",
                "phone_encrypted": "+91-9876543212",
                "role": RoleEnum.SECURITY_STAFF.value,
                "anonymous_handle": "steady_falcon_771",
            },
            {
                "name": "Dr. Kavita Joshi (Admin)",
                "email": "admin@gehu.ac.in",
                "phone_encrypted": "+91-9876543213",
                "role": RoleEnum.ADMIN.value,
                "anonymous_handle": "wise_banyan_901",
            },
        ]

        added_any = False
        for spec in demo_specs:
            existing = db.query(User).filter(User.email == spec["email"]).first()
            if not existing:
                handle = spec["anonymous_handle"]
                if db.query(User).filter(User.anonymous_handle == handle).first():
                    handle = f"{handle}_x"
                db.add(
                    User(
                        name=spec["name"],
                        email=spec["email"],
                        password_hash=hash_password("Safety@123"),
                        phone_encrypted=spec["phone_encrypted"],
                        role=spec["role"],
                        anonymous_handle=handle,
                        is_verified=True,
                        is_active=True,
                    )
                )
                added_any = True
        if added_any:
            db.commit()

        student = db.query(User).filter(User.email == "student@gehu.ac.in").first()
        if student and db.query(CommunityPost).count() == 0:
            db.add_all([
                CommunityPost(
                    author_user_id=student.id,
                    anonymous_handle_snapshot=student.anonymous_handle,
                    title="Streetlights restored along Back Gate Lane near CS Block",
                    body="Just wanted to share that the maintenance team replaced the flickering streetlights between CS Block and Gate 2. Still recommend walking in pairs after 8 PM!",
                    category="SAFETY_TIP",
                    area_label="Gate 2 / CS Block Lane",
                    moderation_status="PUBLISHED",
                    upvote_count=5,
                ),
                CommunityPost(
                    author_user_id=student.id,
                    anonymous_handle_snapshot="calm_lotus_109",
                    title="Evening shuttle timing reminder for Hostel residents",
                    body="The campus security escort van departs from Central Library at 7:30 PM, 8:15 PM, and 9:00 PM daily for Girls Hostel Blocks A & B.",
                    category="SUPPORT",
                    area_label="Central Library",
                    moderation_status="PUBLISHED",
                    upvote_count=8,
                ),
            ])
            db.commit()
