from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.db.session import get_db
from app.models.entities import User
from app.schemas.auth import UserResponse
from app.schemas.common import ApiResponse
from app.services.auth_service import AuthService

router = APIRouter()

@router.get("/me", response_model=ApiResponse[UserResponse])
def get_my_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    data = AuthService.get_my_profile(db, current_user.id)
    return ApiResponse(success=True, message="Request successful", data=data)
