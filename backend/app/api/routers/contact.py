from fastapi import APIRouter, Depends
from sqlmodel import Session

from app.core.database import get_session
from app.core.security import require_role
from app.models.user import User, UserRole
from app.repositories.contact_message_repository import ContactMessageRepository
from app.schemas.contact_message import ContactMessageCreate, ContactMessageRead
from app.services.contact_service import ContactService

router = APIRouter(tags=["contact"])


def get_contact_service(session: Session = Depends(get_session)) -> ContactService:
    return ContactService(ContactMessageRepository(session))


@router.post("/contact-messages", response_model=ContactMessageRead, status_code=201)
def send_contact_message(
    data: ContactMessageCreate,
    service: ContactService = Depends(get_contact_service),
):
    return service.send(data)


@router.get("/contact-messages", response_model=list[ContactMessageRead])
def list_contact_messages(
    service: ContactService = Depends(get_contact_service),
    _: User = Depends(require_role(UserRole.organizer)),
):
    return service.list_messages()
