from datetime import datetime
from typing import Generic, List, Optional, TypeVar
from pydantic import BaseModel, Field

T = TypeVar("T")

class ApiResponse(BaseModel, Generic[T]):
    success: bool = True
    message: str = "Request successful"
    data: Optional[T] = None

class ApiErrorResponse(BaseModel):
    success: bool = False
    message: str
    status: int
    timestamp: datetime = Field(default_factory=datetime.now)
    errors: Optional[List[str]] = None

class PageResponse(BaseModel, Generic[T]):
    content: List[T] = []
    page: int = 0
    size: int = 20
    totalElements: int = 0
    totalPages: int = 0
    last: bool = True
