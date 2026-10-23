import re
from typing import Optional
from pydantic import BaseModel, EmailStr, Field, field_validator

class TrustedContactRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=120)
    phone: str = Field(..., min_length=7, max_length=20)
    email: Optional[EmailStr] = None
    relation: Optional[str] = Field(None, max_length=50)
    priority: Optional[int] = 1

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        if not re.match(r"^[0-9+\-\s]{7,20}$", v):
            raise ValueError("Phone number format is invalid")
        return v

class TrustedContactResponse(BaseModel):
    id: int
    name: str
    phone: str
    email: Optional[str] = None
    relation: Optional[str] = None
    priority: int = 1
    verified: bool = False

    model_config = {"from_attributes": True}
