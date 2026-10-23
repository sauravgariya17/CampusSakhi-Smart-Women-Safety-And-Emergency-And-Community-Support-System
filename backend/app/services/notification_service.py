import logging
import smtplib
from email.message import EmailMessage
from typing import List, Tuple
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.entities import (
    NotificationChannelEnum,
    NotificationLog,
    NotificationLogStatusEnum,
    SosAlert,
    TrustedContact,
)

logger = logging.getLogger(__name__)

class NotificationService:
    @staticmethod
    def notify_contacts_of_sos(
        db: Session,
        sos_alert: SosAlert,
        contacts: List[TrustedContact],
    ) -> Tuple[int, int]:
        """
        Notifies trusted contacts of a confirmed SOS alert.
        Returns (sent_count, simulated_count).
        - If NOTIFICATION_EMAIL_ENABLED is True and SMTP succeeds: logs EMAIL / SENT.
        - Otherwise (disabled or SMTP error or missing contact email): logs CONSOLE_SIMULATION / SIMULATED.
        """
        subject = "[CampusSakhi GEHU Safety Alert] Emergency Notification"
        body = NotificationService._build_message(sos_alert)
        sent_count = 0
        simulated_count = 0

        for contact in contacts:
            recipient = (contact.email or "").strip()
            if not recipient:
                NotificationService._save_log(
                    db,
                    sos_alert.id,
                    contact.id,
                    NotificationChannelEnum.CONSOLE_SIMULATION.value,
                    f"(no email on file for {contact.name})",
                    NotificationLogStatusEnum.SIMULATED.value,
                )
                simulated_count += 1
                logger.warning(
                    "SOS %s: trusted contact %s has no email on file, notification simulated only",
                    sos_alert.id,
                    contact.name,
                )
                continue

            if settings.NOTIFICATION_EMAIL_ENABLED and settings.SMTP_USERNAME and settings.SMTP_PASSWORD:
                try:
                    NotificationService._send_email(recipient, subject, body)
                    NotificationService._save_log(
                        db,
                        sos_alert.id,
                        contact.id,
                        NotificationChannelEnum.EMAIL.value,
                        recipient,
                        NotificationLogStatusEnum.SENT.value,
                    )
                    sent_count += 1
                    continue
                except Exception as exc:
                    logger.error(
                        "SOS %s: real email to %s failed (%s), falling back to simulation",
                        sos_alert.id,
                        recipient,
                        exc,
                    )

            logger.info("[SIMULATED NOTIFICATION] To: %s | Subject: %s", recipient, subject)
            NotificationService._save_log(
                db,
                sos_alert.id,
                contact.id,
                NotificationChannelEnum.CONSOLE_SIMULATION.value,
                recipient,
                NotificationLogStatusEnum.SIMULATED.value,
            )
            simulated_count += 1

        return sent_count, simulated_count

    @staticmethod
    def _send_email(to_addr: str, subject: str, body: str) -> None:
        msg = EmailMessage()
        msg["Subject"] = subject
        msg["From"] = settings.SMTP_USERNAME
        msg["To"] = to_addr
        msg.set_content(body)

        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10) as server:
            server.starttls()
            server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
            server.send_message(msg)

    @staticmethod
    def _build_message(sos_alert: SosAlert) -> str:
        requester_name = sos_alert.user.name if sos_alert.user else f"User #{sos_alert.user_id}"
        return (
            f"{requester_name} has triggered a safety alert on the CampusSakhi GEHU Smart Safety platform.\n"
            f"Category: {sos_alert.category}\n"
            f"Location (approx.): {sos_alert.lat:.6f}, {sos_alert.lng:.6f}\n"
            f"Time: {sos_alert.triggered_at}\n\n"
            "This is an automated notification. Please try to reach them directly."
        )

    @staticmethod
    def _save_log(
        db: Session,
        sos_id: int,
        contact_id: int,
        channel: str,
        recipient: str,
        status: str,
    ) -> None:
        log_entry = NotificationLog(
            sos_id=sos_id,
            contact_id=contact_id,
            channel=channel,
            recipient=recipient,
            status=status,
        )
        db.add(log_entry)
        db.flush()
