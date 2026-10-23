from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.db.session import get_db
from app.models.entities import User
from app.schemas.common import ApiResponse
from app.schemas.incident import (
    CreateIncidentAnalyzeRequest,
    CreateIncidentRequest,
    IncidentAnalysisResponse,
    IncidentResponse,
)
from app.services.incident_service import IncidentService

router = APIRouter()

@router.post("/analyze", response_model=ApiResponse[IncidentAnalysisResponse])
def analyze_incident(
    request: CreateIncidentAnalyzeRequest,
    current_user: User = Depends(get_current_user),
):
    data = IncidentService.analyze(request)
    return ApiResponse(success=True, message="Request successful", data=data)

@router.post("", response_model=ApiResponse[IncidentResponse], status_code=status.HTTP_201_CREATED)
def create_incident(
    request: CreateIncidentRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    data = IncidentService.create_incident(db, current_user.id, request)
    return ApiResponse(success=True, message="Incident report submitted", data=data)

@router.get("/mine", response_model=ApiResponse[List[IncidentResponse]])
def get_my_incidents(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    data = IncidentService.get_my_incidents(db, current_user.id)
    return ApiResponse(success=True, message="Request successful", data=data)
