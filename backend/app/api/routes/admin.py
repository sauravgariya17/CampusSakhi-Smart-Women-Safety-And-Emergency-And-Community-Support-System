from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.security import require_roles
from app.db.session import get_db
from app.models.entities import User
from app.schemas.audit import AuditLogResponse
from app.schemas.common import ApiResponse, PageResponse
from app.schemas.dashboard import DashboardSummaryResponse
from app.schemas.incident import IncidentAdminResponse, ReviewIncidentRequest
from app.schemas.user import AdminUserResponse, UpdateUserRoleRequest, UpdateUserStatusRequest
from app.services.admin_service import AdminService
from app.services.analytics_service import AnalyticsService
from app.services.audit_service import AuditService
from app.services.incident_service import IncidentService

router = APIRouter()

# Moderator + Admin endpoints
@router.get("/dashboard/summary", response_model=ApiResponse[DashboardSummaryResponse])
def get_dashboard_summary(
    windowDays: int = Query(30, ge=1, le=365),
    current_user: User = Depends(require_roles(["MODERATOR", "ADMIN"])),
    db: Session = Depends(get_db),
):
    data = AnalyticsService.get_dashboard_summary(db, windowDays)
    return ApiResponse(success=True, message="Request successful", data=data)

@router.get("/incidents", response_model=ApiResponse[PageResponse[IncidentAdminResponse]])
def get_all_incidents(
    category: Optional[str] = Query(None),
    priority: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    page: int = Query(0, ge=0),
    size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(require_roles(["MODERATOR", "ADMIN"])),
    db: Session = Depends(get_db),
):
    data = IncidentService.get_all_incidents(db, category, priority, status, page, size)
    return ApiResponse(success=True, message="Request successful", data=data)

@router.patch("/incidents/{incident_id}/review", response_model=ApiResponse[IncidentAdminResponse])
def review_incident(
    incident_id: int,
    request: ReviewIncidentRequest,
    current_user: User = Depends(require_roles(["MODERATOR", "ADMIN"])),
    db: Session = Depends(get_db),
):
    data = IncidentService.review_incident(db, current_user.id, incident_id, request)
    return ApiResponse(success=True, message="Incident updated", data=data)

# Admin-only endpoints
@router.get("/users", response_model=ApiResponse[PageResponse[AdminUserResponse]])
def list_users(
    role: Optional[str] = Query(None),
    keyword: Optional[str] = Query(None),
    page: int = Query(0, ge=0),
    size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(require_roles(["ADMIN"])),
    db: Session = Depends(get_db),
):
    data = AdminService.list_users(db, role, keyword, page, size)
    return ApiResponse(success=True, message="Request successful", data=data)

@router.patch("/users/{user_id}/role", response_model=ApiResponse[AdminUserResponse])
def update_user_role(
    user_id: int,
    request: UpdateUserRoleRequest,
    current_user: User = Depends(require_roles(["ADMIN"])),
    db: Session = Depends(get_db),
):
    data = AdminService.update_role(db, current_user.id, user_id, request.role)
    return ApiResponse(success=True, message="Role updated", data=data)

@router.patch("/users/{user_id}/status", response_model=ApiResponse[AdminUserResponse])
def update_user_status(
    user_id: int,
    request: UpdateUserStatusRequest,
    current_user: User = Depends(require_roles(["ADMIN"])),
    db: Session = Depends(get_db),
):
    data = AdminService.update_status(db, current_user.id, user_id, request.active)
    msg = "User activated" if request.active else "User suspended"
    return ApiResponse(success=True, message=msg, data=data)

@router.get("/audit-logs", response_model=ApiResponse[PageResponse[AuditLogResponse]])
def search_audit_logs(
    actionType: Optional[str] = Query(None),
    page: int = Query(0, ge=0),
    size: int = Query(30, ge=1, le=100),
    current_user: User = Depends(require_roles(["ADMIN"])),
    db: Session = Depends(get_db),
):
    data = AuditService.search(db, actionType, page, size)
    return ApiResponse(success=True, message="Request successful", data=data)
