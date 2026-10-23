from datetime import datetime, timedelta
from typing import List, Optional
from sqlalchemy.orm import Session

from app.core.config import settings
from app.exceptions.handlers import BadRequestException, ResourceNotFoundException
from app.models.entities import SosAlert, SosCategoryEnum, SosStatusEnum, TrustedContact, User
from app.schemas.sos import ResolveSosRequest, SosManagementResponse, SosResponse, TriggerSosRequest
from app.services.audit_service import AuditService
from app.services.notification_service import NotificationService

NON_TERMINAL_STATUSES = [
    SosStatusEnum.PENDING_CONFIRMATION.value,
    SosStatusEnum.TRIGGERED.value,
    SosStatusEnum.ACKNOWLEDGED.value,
]

DASHBOARD_STATUSES = [
    SosStatusEnum.TRIGGERED.value,
    SosStatusEnum.ACKNOWLEDGED.value,
]

VALID_CATEGORIES = {e.value for e in SosCategoryEnum}

class SosService:
    @staticmethod
    def expire_unconfirmed_alerts(db: Session) -> int:
        """Auto-cancels any PENDING_CONFIRMATION alert whose confirmation window has expired."""
        now = datetime.now()
        expired = (
            db.query(SosAlert)
            .filter(
                SosAlert.status == SosStatusEnum.PENDING_CONFIRMATION.value,
                SosAlert.confirmation_expires_at < now,
            )
            .all()
        )
        for alert in expired:
            alert.status = SosStatusEnum.CANCELLED.value
        if expired:
            db.commit()
        return len(expired)

    @staticmethod
    def trigger(db: Session, user_id: int, request: TriggerSosRequest) -> SosResponse:
        SosService.expire_unconfirmed_alerts(db)

        active = (
            db.query(SosAlert)
            .filter(SosAlert.user_id == user_id, SosAlert.status.in_(NON_TERMINAL_STATUSES))
            .first()
        )
        if active:
            raise BadRequestException("You already have an active SOS in progress")

        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise ResourceNotFoundException("User not found")

        category = request.category if request.category in VALID_CATEGORIES else SosCategoryEnum.PERSONAL_SAFETY.value
        now = datetime.now()
        alert = SosAlert(
            user_id=user_id,
            category=category,
            lat=request.lat,
            lng=request.lng,
            status=SosStatusEnum.PENDING_CONFIRMATION.value,
            confirmation_expires_at=now + timedelta(seconds=settings.SOS_CONFIRMATION_WINDOW_SECONDS),
            created_at=now,
        )
        db.add(alert)
        db.flush()

        AuditService.record(
            db,
            user_id,
            "SOS_TRIGGER_INITIATED",
            "SOS_ALERT",
            alert.id,
            f"Awaiting confirmation within {settings.SOS_CONFIRMATION_WINDOW_SECONDS}s",
        )
        db.commit()
        db.refresh(alert)
        return SosService.to_response(alert)

    @staticmethod
    def confirm(db: Session, user_id: int, sos_id: int) -> SosResponse:
        alert = db.query(SosAlert).filter(SosAlert.id == sos_id, SosAlert.user_id == user_id).first()
        if not alert:
            raise ResourceNotFoundException("SOS event not found")

        if alert.status != SosStatusEnum.PENDING_CONFIRMATION.value:
            raise BadRequestException(f"This SOS cannot be confirmed in its current state ({alert.status})")

        if alert.confirmation_expires_at and alert.confirmation_expires_at < datetime.now():
            alert.status = SosStatusEnum.CANCELLED.value
            db.commit()
            raise BadRequestException("Confirmation window expired. Please trigger SOS again.")

        alert.status = SosStatusEnum.TRIGGERED.value
        alert.triggered_at = datetime.now()
        db.flush()

        contacts = (
            db.query(TrustedContact)
            .filter(TrustedContact.user_id == user_id)
            .order_by(TrustedContact.priority.asc())
            .all()
        )
        sent_count, sim_count = NotificationService.notify_contacts_of_sos(db, alert, contacts)
        if len(contacts) == 0:
            note = "No trusted contacts configured; alerted campus security dashboard"
        elif sent_count > 0:
            note = f"Email sent to {sent_count} contact(s)" + (f", {sim_count} simulated" if sim_count else "")
        else:
            note = f"Simulated notification logged for {sim_count} contact(s) (SMTP disabled)"

        alert.notes = SosService._append_note(alert.notes, note)

        AuditService.record(
            db,
            user_id,
            "SOS_CONFIRMED_AND_TRIGGERED",
            "SOS_ALERT",
            alert.id,
            f"Notified {len(contacts)} trusted contact(s)",
        )
        db.commit()
        db.refresh(alert)
        return SosService.to_response(alert)

    @staticmethod
    def cancel(db: Session, user_id: int, sos_id: int) -> SosResponse:
        alert = db.query(SosAlert).filter(SosAlert.id == sos_id, SosAlert.user_id == user_id).first()
        if not alert:
            raise ResourceNotFoundException("SOS event not found")

        if alert.status not in NON_TERMINAL_STATUSES:
            raise BadRequestException("This SOS is already closed")

        if alert.status == SosStatusEnum.PENDING_CONFIRMATION.value:
            alert.status = SosStatusEnum.CANCELLED.value
        else:
            alert.status = SosStatusEnum.FALSE_ALARM.value
            alert.resolved_at = datetime.now()
            alert.notes = SosService._append_note(alert.notes, "Cancelled by user - marked safe")

        AuditService.record(db, user_id, "SOS_CANCELLED_BY_USER", "SOS_ALERT", alert.id, None)
        db.commit()
        db.refresh(alert)
        return SosService.to_response(alert)

    @staticmethod
    def get_my_active(db: Session, user_id: int) -> SosResponse:
        SosService.expire_unconfirmed_alerts(db)
        alert = (
            db.query(SosAlert)
            .filter(SosAlert.user_id == user_id, SosAlert.status.in_(NON_TERMINAL_STATUSES))
            .order_by(SosAlert.created_at.desc())
            .first()
        )
        if not alert:
            raise ResourceNotFoundException("No active SOS")
        return SosService.to_response(alert)

    @staticmethod
    def get_my_history(db: Session, user_id: int) -> List[SosResponse]:
        SosService.expire_unconfirmed_alerts(db)
        alerts = (
            db.query(SosAlert)
            .filter(SosAlert.user_id == user_id)
            .order_by(SosAlert.created_at.desc())
            .all()
        )
        return [SosService.to_response(a) for a in alerts]

    @staticmethod
    def get_active_queue(db: Session) -> List[SosManagementResponse]:
        SosService.expire_unconfirmed_alerts(db)
        alerts = (
            db.query(SosAlert)
            .filter(SosAlert.status.in_(DASHBOARD_STATUSES))
            .order_by(SosAlert.created_at.asc())
            .all()
        )
        return [SosService.to_management_response(a) for a in alerts]

    @staticmethod
    def acknowledge(db: Session, staff_user_id: int, sos_id: int) -> SosManagementResponse:
        alert = db.query(SosAlert).filter(SosAlert.id == sos_id).first()
        if not alert:
            raise ResourceNotFoundException("SOS event not found")

        if alert.status != SosStatusEnum.TRIGGERED.value:
            raise BadRequestException(f"Only a TRIGGERED alert can be acknowledged (current: {alert.status})")

        staff = db.query(User).filter(User.id == staff_user_id).first()
        if not staff:
            raise ResourceNotFoundException("User not found")

        alert.status = SosStatusEnum.ACKNOWLEDGED.value
        alert.acknowledged_by_id = staff.id
        alert.acknowledged_at = datetime.now()

        AuditService.record(db, staff_user_id, "SOS_ACKNOWLEDGED", "SOS_ALERT", alert.id, None)
        db.commit()
        db.refresh(alert)
        return SosService.to_management_response(alert)

    @staticmethod
    def resolve(db: Session, staff_user_id: int, sos_id: int, request: ResolveSosRequest) -> SosManagementResponse:
        alert = db.query(SosAlert).filter(SosAlert.id == sos_id).first()
        if not alert:
            raise ResourceNotFoundException("SOS event not found")

        if alert.status != SosStatusEnum.ACKNOWLEDGED.value:
            raise BadRequestException(f"Only an acknowledged alert can be resolved (current: {alert.status})")

        if request.outcome not in (SosStatusEnum.RESOLVED.value, SosStatusEnum.FALSE_ALARM.value):
            raise BadRequestException("Outcome must be RESOLVED or FALSE_ALARM")

        alert.status = request.outcome
        alert.resolved_at = datetime.now()
        alert.notes = SosService._append_note(alert.notes, request.notes)

        AuditService.record(db, staff_user_id, f"SOS_{request.outcome}", "SOS_ALERT", alert.id, request.notes)
        db.commit()
        db.refresh(alert)
        return SosService.to_management_response(alert)

    @staticmethod
    def _append_note(existing: Optional[str], addition: Optional[str]) -> Optional[str]:
        if not addition or not addition.strip():
            return existing
        addition = addition.strip()
        if not existing or not existing.strip():
            return addition
        return f"{existing} | {addition}"

    @staticmethod
    def to_response(alert: SosAlert) -> SosResponse:
        return SosResponse(
            id=alert.id,
            category=alert.category,
            lat=alert.lat,
            lng=alert.lng,
            status=alert.status,
            confirmationExpiresAt=alert.confirmation_expires_at,
            triggeredAt=alert.triggered_at,
            createdAt=alert.created_at,
            acknowledgedAt=alert.acknowledged_at,
            resolvedAt=alert.resolved_at,
            notes=alert.notes,
        )

    @staticmethod
    def to_management_response(alert: SosAlert) -> SosManagementResponse:
        return SosManagementResponse(
            id=alert.id,
            requesterUserId=alert.user_id,
            requesterName=alert.user.name if alert.user else f"User#{alert.user_id}",
            requesterPhone=alert.user.phone_encrypted if alert.user else None,
            category=alert.category,
            lat=alert.lat,
            lng=alert.lng,
            status=alert.status,
            triggeredAt=alert.triggered_at,
            acknowledgedByName=alert.acknowledged_by.name if alert.acknowledged_by else None,
            acknowledgedAt=alert.acknowledged_at,
            resolvedAt=alert.resolved_at,
            notes=alert.notes,
        )
