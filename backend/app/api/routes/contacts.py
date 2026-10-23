from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.db.session import get_db
from app.models.entities import User
from app.schemas.common import ApiResponse
from app.schemas.contact import TrustedContactRequest, TrustedContactResponse
from app.services.contact_service import ContactService

router = APIRouter()

@router.post("", response_model=ApiResponse[TrustedContactResponse], status_code=status.HTTP_201_CREATED)
def add_contact(
    request: TrustedContactRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    data = ContactService.add_contact(db, current_user.id, request)
    return ApiResponse(success=True, message="Trusted contact added", data=data)

@router.get("", response_model=ApiResponse[List[TrustedContactResponse]])
def get_contacts(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    data = ContactService.get_contacts(db, current_user.id)
    return ApiResponse(success=True, message="Request successful", data=data)

@router.put("/{contact_id}", response_model=ApiResponse[TrustedContactResponse])
def update_contact(
    contact_id: int,
    request: TrustedContactRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    data = ContactService.update_contact(db, current_user.id, contact_id, request)
    return ApiResponse(success=True, message="Trusted contact updated", data=data)

@router.delete("/{contact_id}", response_model=ApiResponse[None])
def delete_contact(
    contact_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ContactService.delete_contact(db, current_user.id, contact_id)
    return ApiResponse(success=True, message="Trusted contact removed", data=None)
