from typing import Dict, List
from pydantic import BaseModel

class DailyCount(BaseModel):
    date: str
    count: int

class SafetyAnalyticsResponse(BaseModel):
    reportsByCategory: Dict[str, int] = {}
    reportsByArea: Dict[str, int] = {}
    trend: List[DailyCount] = []
    windowDays: int
    disclaimer: str
