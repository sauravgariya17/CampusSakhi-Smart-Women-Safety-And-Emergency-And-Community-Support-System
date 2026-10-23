from datetime import datetime
from pydantic import BaseModel, EmailStr

class AdminUserResponse(BaseModel):
    id: int
    name: str
    email: str
    role: str
    verified: bool
    active: bool
    createdAt: datetime

    model_config = {"from_attributes": True}

class UpdateUserRoleRequest(BaseModel):
    role: str

class UpdateUserStatusRequest(BaseModel):
    active: bool
