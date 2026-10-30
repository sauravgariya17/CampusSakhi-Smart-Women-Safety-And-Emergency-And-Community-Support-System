from datetime import datetime, timedelta
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import (
    create_access_token,
    create_raw_refresh_token,
    hash_password,
    verify_password,
)
from app.exceptions.handlers import (
    BadRequestException,
    DuplicateResourceException,
    ResourceNotFoundException,
    UnauthorizedException,
)
from app.models.entities import RefreshToken, RoleEnum, User
from app.schemas.auth import AuthResponse, LoginRequest, RegisterRequest, UserResponse
from app.utils.handle_generator import generate_unique_handle

class AuthService:
    @staticmethod
    def bootstrap_admin(db: Session) -> bool:
        values = (
            settings.BOOTSTRAP_ADMIN_NAME,
            settings.BOOTSTRAP_ADMIN_EMAIL,
            settings.BOOTSTRAP_ADMIN_PASSWORD,
        )
        if not any(values):
            return False
        if not all(values):
            raise RuntimeError(
                "Set BOOTSTRAP_ADMIN_NAME, BOOTSTRAP_ADMIN_EMAIL, and "
                "BOOTSTRAP_ADMIN_PASSWORD together, or leave all three unset"
            )

        name, email, password = values
        email = email.lower().strip()
        user = db.query(User).filter(User.email == email).first()
        if user is None:
            user = User(
                name=name.strip(),
                email=email,
                password_hash=hash_password(password),
                anonymous_handle=generate_unique_handle(db),
                role=RoleEnum.ADMIN.value,
                is_verified=True,
                is_active=True,
            )
            db.add(user)
        else:
            user.name = name.strip()
            user.password_hash = hash_password(password)
            user.role = RoleEnum.ADMIN.value
            user.is_verified = True
            user.is_active = True

        db.commit()
        return True

    @staticmethod
    def to_user_response(user: User) -> UserResponse:
        return UserResponse(
            id=user.id,
            name=user.name,
            email=user.email,
            anonymousHandle=user.anonymous_handle,
            role=str(user.role),
            verified=bool(user.is_verified),
        )

    @staticmethod
    def _build_auth_response(db: Session, user: User) -> AuthResponse:
        access_token = create_access_token(user.id, user.email, str(user.role))
        raw_refresh_token = create_raw_refresh_token()

        refresh_entity = RefreshToken(
            user_id=user.id,
            token=raw_refresh_token,
            expires_at=datetime.now() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
            revoked=False,
        )
        db.add(refresh_entity)
        db.commit()
        db.refresh(user)

        return AuthResponse(
            accessToken=access_token,
            refreshToken=raw_refresh_token,
            tokenType="Bearer",
            user=AuthService.to_user_response(user),
        )

    @staticmethod
    def register(db: Session, request: RegisterRequest) -> AuthResponse:
        existing = db.query(User).filter(User.email == request.email.lower().strip()).first()
        if existing:
            raise DuplicateResourceException("An account with this email already exists")

        user = User(
            name=request.name.strip(),
            email=request.email.lower().strip(),
            password_hash=hash_password(request.password),
            phone_encrypted=request.phone.strip() if request.phone else None,
            role=RoleEnum.USER.value,
            anonymous_handle=generate_unique_handle(db),
            is_verified=False,
            is_active=True,
        )
        db.add(user)
        db.flush()
        return AuthService._build_auth_response(db, user)

    @staticmethod
    def login(db: Session, request: LoginRequest) -> AuthResponse:
        user = db.query(User).filter(User.email == request.email.lower().strip()).first()
        if not user or not verify_password(request.password, user.password_hash):
            raise UnauthorizedException("Invalid email or password")

        if not user.is_active:
            raise UnauthorizedException("Account is suspended. Please contact an administrator.")

        return AuthService._build_auth_response(db, user)

    @staticmethod
    def refresh_access_token(db: Session, raw_refresh_token: str) -> AuthResponse:
        stored = db.query(RefreshToken).filter(RefreshToken.token == raw_refresh_token).first()
        if not stored:
            raise BadRequestException("Invalid refresh token")

        if stored.revoked or stored.expires_at < datetime.now():
            raise BadRequestException("Refresh token expired or revoked. Please log in again.")

        user = stored.user
        if not user or not user.is_active:
            raise UnauthorizedException("User account is inactive")

        new_access_token = create_access_token(user.id, user.email, str(user.role))
        return AuthResponse(
            accessToken=new_access_token,
            refreshToken=raw_refresh_token,
            tokenType="Bearer",
            user=AuthService.to_user_response(user),
        )

    @staticmethod
    def logout(db: Session, raw_refresh_token: str) -> None:
        stored = db.query(RefreshToken).filter(RefreshToken.token == raw_refresh_token).first()
        if stored:
            stored.revoked = True
            db.commit()

    @staticmethod
    def get_my_profile(db: Session, user_id: int) -> UserResponse:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise ResourceNotFoundException("User not found")
        return AuthService.to_user_response(user)
