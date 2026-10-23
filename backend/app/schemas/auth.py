import re
from typing import Optional
from pydantic import BaseModel, EmailStr, Field, field_validator

class RegisterRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=120)
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=64)
    phone: Optional[str] = None

    @field_validator("password")
    @classmethod
    def validate_password_strength(cls, v: str) -> str:
        # Matches ^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&]).+$
        if not re.search(r"[A-Za-z]", v):
            raise ValueError("Password must contain at least one letter")
        if not re.search(r"\d", v):
            raise ValueError("Password must contain at least one digit")
        if not re.search(r"[@$!%*#?&]", v):
            raise ValueError("Password must contain at least one special character (@$!%*#?&)")
        return v

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: Optional[str]) -> Optional[str]:
        if v and not re.match(r"^$|^[0-9+\-\s]{7,20}$", v):
            raise ValueError("Phone number format is invalid")
        return v

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class RefreshTokenRequest(BaseModel):
    refreshToken: str

class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    anonymousHandle: str
    role: str
    verified: bool

    model_config = {"from_attributes": True}

class AuthResponse(BaseModel):
    accessToken: str
    refreshToken: str
    tokenType: str = "Bearer"
    user: UserResponse
