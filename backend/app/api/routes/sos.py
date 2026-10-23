from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.security import get_current_user, require_roles
from app.db.session import get_db
from app.models.entities import User
from app.schemas.common import ApiResponse
from app.schemas.sos import (
    ResolveSosRequest,
    SosManagementResponse,
    SosResponse,
    TriggerSosRequest,
)
from app.services.sos_service import SosService

router = APIRouter()

@router.post("/trigger", response_model=ApiResponse[SosResponse], status_code=status.HTTP_201_CREATED)
def trigger_sos(
    request: TriggerSosRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    data = SosService.trigger(db, current_user.id, request)
    return ApiResponse(
        success=True,
        message="SOS initiated - confirm within countdown to notify your contacts",
        data=data,
    )

@router.post("/{sos_id}/confirm", response_model=ApiResponse[SosResponse])
def confirm_sos(
    sos_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    data = SosService.confirm(db, current_user.id, sos_id)
    return ApiResponse(success=True, message="SOS confirmed - notifications dispatched", data=data)

@router.post("/{sos_id}/cancel", response_model=ApiResponse[SosResponse])
def cancel_sos(
    sos_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    data = SosService.cancel(db, current_user.id, sos_id)
    return ApiResponse(success=True, message="SOS cancelled", data=data)

@router.get("/active", response_model=ApiResponse[SosResponse])
def get_active_sos(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    data = SosService.get_my_active(db, current_user.id)
    return ApiResponse(success=True, message="Request successful", data=data)

@router.get("/history", response_model=ApiResponse[List[SosResponse]])
def get_sos_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    data = SosService.get_my_history(db, current_user.id)
    return ApiResponse(success=True, message="Request successful", data=data)

# Security Staff & Admin Management Endpoints
@router.get("/manage/active", response_model=ApiResponse[List[SosManagementResponse]])
def get_active_queue(
    current_user: User = Depends(require_roles(["SECURITY_STAFF", "ADMIN"])),
    db: Session = Depends(get_db),
):
    data = SosService.get_active_queue(db)
    return ApiResponse(success=True, message="Request successful", data=data)

@router.post("/manage/{sos_id}/acknowledge", response_model=ApiResponse[SosManagementResponse])
def acknowledge_sos(
    sos_id: int,
    current_user: User = Depends(require_roles(["SECURITY_STAFF", "ADMIN"])),
    db: Session = Depends(get_db),
):
    data = SosService.acknowledge(db, current_user.id, sos_id)
    return ApiResponse(success=True, message="SOS acknowledged", data=data)

@router.post("/manage/{sos_id}/resolve", response_model=ApiResponse[SosManagementResponse])
def resolve_sos(
    sos_id: int,
    request: ResolveSosRequest,
    current_user: User = Depends(require_roles(["SECURITY_STAFF", "ADMIN"])),
    db: Session = Depends(get_db),
):
    data = SosService.resolve(db, current_user.id, sos_id, request)
    return ApiResponse(success=True, message="SOS closed", data=data)
