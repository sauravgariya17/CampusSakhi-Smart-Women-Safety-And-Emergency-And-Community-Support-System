import base64
import secrets
from datetime import datetime, timedelta
from typing import List
from sqlalchemy.orm import Session

from app.core.config import settings
from app.exceptions.handlers import BadRequestException, ResourceNotFoundException
from app.models.entities import Journey, JourneyStatusEnum, TrustedContact, User
from app.schemas.journey import (
    JourneyPingRequest,
    JourneyResponse,
    JourneyShareResponse,
    StartJourneyRequest,
)
from app.utils.geo import ensure_within_campus_scope
from app.utils.routing import StraightLineRoutingProvider

class JourneyService:
    @staticmethod
    def escalate_overdue_journeys(db: Session) -> int:
        cutoff = datetime.now() - timedelta(minutes=settings.JOURNEY_CHECKIN_GRACE_MINUTES)
        overdue = (
            db.query(Journey)
            .filter(
                Journey.status == JourneyStatusEnum.ACTIVE.value,
                Journey.expected_arrival < cutoff,
            )
            .all()
        )
        for j in overdue:
            j.status = JourneyStatusEnum.ESCALATED.value
        if overdue:
            db.commit()
        return len(overdue)

    @staticmethod
    def _generate_tracking_token() -> str:
        raw = secrets.token_bytes(24)
        return base64.urlsafe_b64encode(raw).decode("utf-8").rstrip("=")

    @staticmethod
    def start_journey(db: Session, user_id: int, request: StartJourneyRequest) -> JourneyResponse:
        JourneyService.escalate_overdue_journeys(db)
        ensure_within_campus_scope(request.startLat, request.startLng)
        ensure_within_campus_scope(request.destLat, request.destLng)

        active = (
            db.query(Journey)
            .filter(Journey.user_id == user_id, Journey.status == JourneyStatusEnum.ACTIVE.value)
            .first()
        )
        if active:
            raise BadRequestException("You already have an active journey. End it before starting a new one.")

        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise ResourceNotFoundException("User not found")

        contacts: List[TrustedContact] = []
        if request.trustedContactIds:
            for cid in set(request.trustedContactIds):
                contact = (
                    db.query(TrustedContact)
                    .filter(TrustedContact.id == cid, TrustedContact.user_id == user_id)
                    .first()
                )
                if not contact:
                    raise BadRequestException(f"Trusted contact {cid} does not belong to you")
                contacts.append(contact)

        now = datetime.now()
        journey = Journey(
            user_id=user_id,
            start_lat=request.startLat,
            start_lng=request.startLng,
            dest_lat=request.destLat,
            dest_lng=request.destLng,
            start_time=now,
            expected_arrival=now + timedelta(minutes=request.expectedDurationMinutes),
            status=JourneyStatusEnum.ACTIVE.value,
            last_known_lat=request.startLat,
            last_known_lng=request.startLng,
            last_ping_at=now,
            tracking_token=JourneyService._generate_tracking_token(),
            notified_contacts=contacts,
        )
        db.add(journey)
        db.commit()
        db.refresh(journey)
        return JourneyService.to_response(journey)

    @staticmethod
    def _get_owned_active_journey(db: Session, user_id: int, journey_id: int) -> Journey:
        journey = db.query(Journey).filter(Journey.id == journey_id, Journey.user_id == user_id).first()
        if not journey:
            raise ResourceNotFoundException("Journey not found")
        if journey.status != JourneyStatusEnum.ACTIVE.value:
            raise BadRequestException("This journey is no longer active")
        return journey

    @staticmethod
    def ping(db: Session, user_id: int, journey_id: int, request: JourneyPingRequest) -> JourneyResponse:
        journey = JourneyService._get_owned_active_journey(db, user_id, journey_id)
        journey.last_known_lat = request.lat
        journey.last_known_lng = request.lng
        journey.last_ping_at = datetime.now()
        db.commit()
        db.refresh(journey)
        return JourneyService.to_response(journey)

    @staticmethod
    def check_in(db: Session, user_id: int, journey_id: int) -> JourneyResponse:
        journey = JourneyService._get_owned_active_journey(db, user_id, journey_id)
        journey.status = JourneyStatusEnum.COMPLETED.value
        db.commit()
        db.refresh(journey)
        return JourneyService.to_response(journey)

    @staticmethod
    def cancel_journey(db: Session, user_id: int, journey_id: int) -> JourneyResponse:
        journey = JourneyService._get_owned_active_journey(db, user_id, journey_id)
        journey.status = JourneyStatusEnum.CANCELLED.value
        db.commit()
        db.refresh(journey)
        return JourneyService.to_response(journey)

    @staticmethod
    def get_active_journey(db: Session, user_id: int) -> JourneyResponse:
        JourneyService.escalate_overdue_journeys(db)
        journey = (
            db.query(Journey)
            .filter(Journey.user_id == user_id, Journey.status == JourneyStatusEnum.ACTIVE.value)
            .first()
        )
        if not journey:
            raise ResourceNotFoundException("No active journey")
        return JourneyService.to_response(journey)

    @staticmethod
    def get_history(db: Session, user_id: int) -> List[JourneyResponse]:
        JourneyService.escalate_overdue_journeys(db)
        journeys = (
            db.query(Journey)
            .filter(Journey.user_id == user_id)
            .order_by(Journey.start_time.desc())
            .all()
        )
        return [JourneyService.to_response(j) for j in journeys]

    @staticmethod
    def get_share_view(db: Session, tracking_token: str) -> JourneyShareResponse:
        JourneyService.escalate_overdue_journeys(db)
        journey = db.query(Journey).filter(Journey.tracking_token == tracking_token).first()
        if not journey:
            raise ResourceNotFoundException("Invalid tracking link")
        if journey.status != JourneyStatusEnum.ACTIVE.value:
            raise ResourceNotFoundException("This tracking link has expired")

        return JourneyShareResponse(
            status=journey.status,
            destLat=journey.dest_lat,
            destLng=journey.dest_lng,
            expectedArrival=journey.expected_arrival,
            lastKnownLat=journey.last_known_lat,
            lastKnownLng=journey.last_known_lng,
            lastPingAt=journey.last_ping_at,
        )

    @staticmethod
    def to_response(journey: Journey) -> JourneyResponse:
        route = StraightLineRoutingProvider.get_route(
            journey.start_lat, journey.start_lng, journey.dest_lat, journey.dest_lng
        )
        return JourneyResponse(
            id=journey.id,
            startLat=journey.start_lat,
            startLng=journey.start_lng,
            destLat=journey.dest_lat,
            destLng=journey.dest_lng,
            startTime=journey.start_time,
            expectedArrival=journey.expected_arrival,
            status=journey.status,
            lastKnownLat=journey.last_known_lat,
            lastKnownLng=journey.last_known_lng,
            lastPingAt=journey.last_ping_at,
            trackingToken=journey.tracking_token,
            shareUrl=f"/journey/track/{journey.tracking_token}",
            route=route,
            notifiedContactNames=[c.name for c in (journey.notified_contacts or [])],
        )
