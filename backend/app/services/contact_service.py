from typing import List
from sqlalchemy.orm import Session

from app.exceptions.handlers import BadRequestException, ResourceNotFoundException
from app.models.entities import TrustedContact, User
from app.schemas.contact import TrustedContactRequest, TrustedContactResponse

MAX_CONTACTS = 5

class ContactService:
    @staticmethod
    def to_response(contact: TrustedContact) -> TrustedContactResponse:
        return TrustedContactResponse(
            id=contact.id,
            name=contact.name,
            phone=contact.phone,
            email=contact.email,
            relation=contact.relation,
            priority=contact.priority,
            verified=bool(contact.is_verified),
        )

    @staticmethod
    def add_contact(db: Session, user_id: int, request: TrustedContactRequest) -> TrustedContactResponse:
        count = db.query(TrustedContact).filter(TrustedContact.user_id == user_id).count()
        if count >= MAX_CONTACTS:
            raise BadRequestException(f"You can add up to {MAX_CONTACTS} trusted contacts only")

        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise ResourceNotFoundException("User not found")

        contact = TrustedContact(
            user_id=user_id,
            name=request.name.strip(),
            phone=request.phone.strip(),
            email=str(request.email).strip() if request.email else None,
            relation=request.relation.strip() if request.relation else None,
            priority=request.priority if request.priority is not None else 1,
            is_verified=False,
        )
        db.add(contact)
        db.commit()
        db.refresh(contact)
        return ContactService.to_response(contact)

    @staticmethod
    def get_contacts(db: Session, user_id: int) -> List[TrustedContactResponse]:
        contacts = (
            db.query(TrustedContact)
            .filter(TrustedContact.user_id == user_id)
            .order_by(TrustedContact.priority.asc(), TrustedContact.id.asc())
            .all()
        )
        return [ContactService.to_response(c) for c in contacts]

    @staticmethod
    def update_contact(
        db: Session, user_id: int, contact_id: int, request: TrustedContactRequest
    ) -> TrustedContactResponse:
        contact = (
            db.query(TrustedContact)
            .filter(TrustedContact.id == contact_id, TrustedContact.user_id == user_id)
            .first()
        )
        if not contact:
            raise ResourceNotFoundException("Trusted contact not found")

        contact.name = request.name.strip()
        contact.phone = request.phone.strip()
        contact.email = str(request.email).strip() if request.email else None
        contact.relation = request.relation.strip() if request.relation else None
        if request.priority is not None:
            contact.priority = request.priority

        db.commit()
        db.refresh(contact)
        return ContactService.to_response(contact)

    @staticmethod
    def delete_contact(db: Session, user_id: int, contact_id: int) -> None:
        contact = (
            db.query(TrustedContact)
            .filter(TrustedContact.id == contact_id, TrustedContact.user_id == user_id)
            .first()
        )
        if not contact:
            raise ResourceNotFoundException("Trusted contact not found")
        db.delete(contact)
        db.commit()
