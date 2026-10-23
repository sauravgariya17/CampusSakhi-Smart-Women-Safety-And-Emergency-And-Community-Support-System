from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.db.session import get_db
from app.models.entities import User
from app.schemas.common import ApiResponse
from app.schemas.journey import (
    JourneyPingRequest,
    JourneyResponse,
    JourneyShareResponse,
    StartJourneyRequest,
)
from app.services.journey_service import JourneyService

router = APIRouter()

@router.post("", response_model=ApiResponse[JourneyResponse], status_code=status.HTTP_201_CREATED)
def start_journey(
    request: StartJourneyRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    data = JourneyService.start_journey(db, current_user.id, request)
    return ApiResponse(success=True, message="Journey started", data=data)

@router.post("/{journey_id}/ping", response_model=ApiResponse[JourneyResponse])
def ping_journey(
    journey_id: int,
    request: JourneyPingRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    data = JourneyService.ping(db, current_user.id, journey_id, request)
    return ApiResponse(success=True, message="Request successful", data=data)

@router.post("/{journey_id}/checkin", response_model=ApiResponse[JourneyResponse])
def check_in_journey(
    journey_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    data = JourneyService.check_in(db, current_user.id, journey_id)
    return ApiResponse(success=True, message="Checked in safely - journey completed", data=data)

@router.post("/{journey_id}/cancel", response_model=ApiResponse[JourneyResponse])
def cancel_journey(
    journey_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    data = JourneyService.cancel_journey(db, current_user.id, journey_id)
    return ApiResponse(success=True, message="Journey cancelled", data=data)

@router.get("/active", response_model=ApiResponse[JourneyResponse])
def get_active_journey(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    data = JourneyService.get_active_journey(db, current_user.id)
    return ApiResponse(success=True, message="Request successful", data=data)

@router.get("/history", response_model=ApiResponse[List[JourneyResponse]])
def get_journey_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    data = JourneyService.get_history(db, current_user.id)
    return ApiResponse(success=True, message="Request successful", data=data)

@router.get("/track/{token}", response_model=ApiResponse[JourneyShareResponse])
def track_shared_journey(
    token: str,
    db: Session = Depends(get_db),
):
    data = JourneyService.get_share_view(db, token)
    return ApiResponse(success=True, message="Request successful", data=data)
