import math
from typing import Optional
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.exceptions.handlers import BadRequestException, ResourceNotFoundException
from app.models.entities import RoleEnum, User
from app.schemas.common import PageResponse
from app.schemas.user import AdminUserResponse
from app.services.audit_service import AuditService

VALID_ROLES = {e.value for e in RoleEnum}

class AdminService:
    @staticmethod
    def to_response(u: User) -> AdminUserResponse:
        return AdminUserResponse(
            id=u.id,
            name=u.name,
            email=u.email,
            role=str(u.role),
            verified=bool(u.is_verified),
            active=bool(u.is_active),
            createdAt=u.created_at,
        )

    @staticmethod
    def list_users(
        db: Session,
        role: Optional[str] = None,
        keyword: Optional[str] = None,
        page: int = 0,
        size: int = 20,
    ) -> PageResponse[AdminUserResponse]:
        query = db.query(User)
        if role and role.strip():
            query = query.filter(User.role == role.strip().upper())
        if keyword and keyword.strip():
            kw = f"%{keyword.strip()}%"
            query = query.filter(or_(User.name.ilike(kw), User.email.ilike(kw)))

        total = query.count()
        total_pages = math.ceil(total / size) if size > 0 else 0
        users = query.order_by(User.created_at.desc()).offset(page * size).limit(size).all()

        content = [AdminService.to_response(u) for u in users]
        return PageResponse(
            content=content,
            page=page,
            size=size,
            totalElements=total,
            totalPages=total_pages,
            last=(page + 1 >= total_pages) if total_pages > 0 else True,
        )

    @staticmethod
    def update_role(db: Session, actor_user_id: int, target_user_id: int, new_role: str) -> AdminUserResponse:
        if actor_user_id == target_user_id:
            raise BadRequestException("You cannot change your own role. Ask another admin to do this.")

        role_val = new_role.strip().upper()
        if role_val not in VALID_ROLES:
            raise BadRequestException(f"Invalid role: {new_role}")

        target = db.query(User).filter(User.id == target_user_id).first()
        if not target:
            raise ResourceNotFoundException("User not found")

        old_role = target.role
        target.role = role_val
        AuditService.record(
            db, actor_user_id, "USER_ROLE_CHANGED", "USER", target_user_id, f"{old_role} -> {role_val}"
        )
        db.commit()
        db.refresh(target)
        return AdminService.to_response(target)

    @staticmethod
    def update_status(db: Session, actor_user_id: int, target_user_id: int, active: bool) -> AdminUserResponse:
        if actor_user_id == target_user_id:
            raise BadRequestException("You cannot suspend/activate your own account.")

        target = db.query(User).filter(User.id == target_user_id).first()
        if not target:
            raise ResourceNotFoundException("User not found")

        target.is_active = bool(active)
        AuditService.record(
            db,
            actor_user_id,
            "USER_ACTIVATED" if active else "USER_SUSPENDED",
            "USER",
            target_user_id,
            None,
        )
        db.commit()
        db.refresh(target)
        return AdminService.to_response(target)
