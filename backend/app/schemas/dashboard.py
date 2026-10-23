from typing import Dict, List
from pydantic import BaseModel
from app.schemas.analytics import DailyCount

class DashboardSummaryResponse(BaseModel):
    totalIncidents: int = 0
    openIncidents: int = 0
    resolvedIncidents: int = 0
    incidentsByCategory: Dict[str, int] = {}
    incidentsByArea: Dict[str, int] = {}
    incidentTrend: List[DailyCount] = []
    totalEmergencyEvents: int = 0
    activeEmergencyEvents: int = 0
    totalCommunityPosts: int = 0
    pendingModerationPosts: int = 0
    moderationPending: int = 0
    moderationApproved: int = 0
    moderationRemoved: int = 0
    moderationAiFlagged: int = 0
    moderationUserFlagged: int = 0
    windowDays: int = 30
    disclaimer: str = ""
