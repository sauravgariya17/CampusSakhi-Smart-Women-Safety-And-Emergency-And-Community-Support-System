from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.auth import AuthResponse, LoginRequest, RefreshTokenRequest, RegisterRequest
from app.schemas.common import ApiResponse
from app.services.auth_service import AuthService

router = APIRouter()

@router.post("/register", response_model=ApiResponse[AuthResponse], status_code=status.HTTP_201_CREATED)
def register(request: RegisterRequest, db: Session = Depends(get_db)):
    data = AuthService.register(db, request)
    return ApiResponse(success=True, message="Registration successful", data=data)

@router.post("/login", response_model=ApiResponse[AuthResponse])
def login(request: LoginRequest, db: Session = Depends(get_db)):
    data = AuthService.login(db, request)
    return ApiResponse(success=True, message="Login successful", data=data)

@router.post("/refresh", response_model=ApiResponse[AuthResponse])
def refresh_token(request: RefreshTokenRequest, db: Session = Depends(get_db)):
    data = AuthService.refresh_access_token(db, request.refreshToken)
    return ApiResponse(success=True, message="Request successful", data=data)

@router.post("/logout", response_model=ApiResponse[None])
def logout(request: RefreshTokenRequest, db: Session = Depends(get_db)):
    AuthService.logout(db, request.refreshToken)
    return ApiResponse(success=True, message="Logged out successfully", data=None)
