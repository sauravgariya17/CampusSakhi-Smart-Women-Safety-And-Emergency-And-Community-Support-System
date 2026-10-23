from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field

class CreateIncidentAnalyzeRequest(BaseModel):
    description: str = Field(..., min_length=10, max_length=3000)

class CreateIncidentRequest(BaseModel):
    description: str = Field(..., min_length=10, max_length=3000)
    category: str
    visibilityType: str = Field(default="ANON_PUBLIC")
    lat: Optional[float] = Field(None, ge=-90.0, le=90.0)
    lng: Optional[float] = Field(None, ge=-180.0, le=180.0)
    areaLabel: Optional[str] = Field(None, max_length=120)

class ReviewIncidentRequest(BaseModel):
    category: Optional[str] = None
    priority: Optional[str] = None
    status: Optional[str] = None
    assignedToUserId: Optional[int] = None

class IncidentResponse(BaseModel):
    id: int
    description: str
    category: str
    priority: str
    aiSuggestedCategory: Optional[str] = None
    aiSuggestedPriority: Optional[str] = None
    aiConfidence: Optional[float] = None
    areaLabel: Optional[str] = None
    visibilityType: str
    status: str
    createdAt: datetime

    model_config = {"from_attributes": True}

class IncidentAdminResponse(BaseModel):
    id: int
    reporterName: Optional[str] = None
    description: str
    aiSummary: Optional[str] = None
    category: str
    priority: str
    aiSuggestedCategory: Optional[str] = None
    aiSuggestedPriority: Optional[str] = None
    aiConfidence: Optional[float] = None
    aiReasoning: Optional[str] = None
    assignedToName: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None
    areaLabel: Optional[str] = None
    visibilityType: str
    status: str
    createdAt: datetime

    model_config = {"from_attributes": True}

class IncidentAnalysisResponse(BaseModel):
    suggestedCategory: str
    confidence: float
    categoryReasoning: str
    suggestedPriority: str
    priorityReasoning: str
    summary: Optional[str] = None
