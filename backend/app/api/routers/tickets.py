from fastapi import APIRouter, Depends
from sqlmodel import Session

from app.core.database import get_session
from app.core.security import require_role
from app.models.user import User, UserRole
from app.repositories.ticket_repository import TicketRepository
from app.schemas.tickets import TicketRead
from app.services.ticket_service import TicketService

router = APIRouter(tags=["tickets"])


def get_ticket_service(session: Session = Depends(get_session)) -> TicketService:
    return TicketService(TicketRepository(session))


require_customer = require_role(UserRole.customer)


@router.get("/tickets/mine", response_model=list[TicketRead])
def list_my_tickets(
    service: TicketService = Depends(get_ticket_service),
    user: User = Depends(require_customer),
):
    return service.list_mine(user.id)


@router.get("/tickets/shared/{token}", response_model=TicketRead)
def get_shared_ticket(
    token: str,
    service: TicketService = Depends(get_ticket_service),
):
    return service.get_shared(token)
