import math
from typing import Optional
from sqlalchemy.orm import Session

from app.models.entities import AuditLog, User
from app.schemas.audit import AuditLogResponse
from app.schemas.common import PageResponse

class AuditService:
    @staticmethod
    def record(
        db: Session,
        actor_user_id: int,
        action_type: str,
        target_type: Optional[str] = None,
        target_id: Optional[int] = None,
        reason: Optional[str] = None,
    ) -> AuditLog:
        entry = AuditLog(
            actor_user_id=actor_user_id,
            action_type=action_type,
            target_type=target_type,
            target_id=target_id,
            reason=reason,
        )
        db.add(entry)
        db.flush()
        return entry

    @staticmethod
    def search(
        db: Session,
        action_type: Optional[str] = None,
        page: int = 0,
        size: int = 30,
    ) -> PageResponse[AuditLogResponse]:
        query = db.query(AuditLog).join(User, AuditLog.actor_user_id == User.id)
        if action_type and action_type.strip():
            query = query.filter(AuditLog.action_type == action_type.strip())

        total = query.count()
        total_pages = math.ceil(total / size) if size > 0 else 0
        items = (
            query.order_by(AuditLog.timestamp.desc())
            .offset(page * size)
            .limit(size)
            .all()
        )

        content = [
            AuditLogResponse(
                id=item.id,
                actorName=item.actor.name if item.actor else f"User#{item.actor_user_id}",
                actionType=item.action_type,
                targetType=item.target_type,
                targetId=item.target_id,
                reason=item.reason,
                timestamp=item.timestamp,
            )
            for item in items
        ]

        return PageResponse(
            content=content,
            page=page,
            size=size,
            totalElements=total,
            totalPages=total_pages,
            last=(page + 1 >= total_pages) if total_pages > 0 else True,
        )
