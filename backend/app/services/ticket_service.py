from fastapi import HTTPException, status

from app.core.qr import (
    format_manual_code,
    generate_manual_code,
    generate_share_token,
    sign_ticket,
    ticket_payload,
)
from app.models.event import Event
from app.models.seat import Seat
from app.models.ticket import Ticket
from app.repositories.ticket_repository import TicketRepository
from app.schemas.tickets import TicketRead


def _ensure_issued(repository: TicketRepository, ticket: Ticket) -> Ticket:
    if ticket.qr_signature and ticket.share_token and ticket.manual_code:
        return ticket
    ticket.qr_signature = ticket.qr_signature or sign_ticket(ticket.id)
    ticket.share_token = ticket.share_token or generate_share_token()
    ticket.manual_code = ticket.manual_code or generate_manual_code()
    return repository.save(ticket)


def _to_read(repository: TicketRepository, ticket: Ticket, event: Event, seat: Seat) -> TicketRead:
    ticket = _ensure_issued(repository, ticket)
    return TicketRead(
        id=ticket.id,
        event_id=event.id,
        event_title=event.title,
        event_poster_path=event.poster_path,
        event_local=event.local,
        event_starts_at=event.starts_at,
        seat_label=seat.label,
        status=ticket.status,
        qr_payload=ticket_payload(ticket.id, ticket.qr_signature),
        share_token=ticket.share_token,
        manual_code=format_manual_code(ticket.manual_code),
        used_at=ticket.used_at,
    )


class TicketService:
    def __init__(self, repository: TicketRepository):
        self.repository = repository

    def list_mine(self, customer_id: int) -> list[TicketRead]:
        rows = self.repository.list_for_customer(customer_id)
        return [_to_read(self.repository, ticket, event, seat) for ticket, event, seat in rows]

    def get_shared(self, token: str) -> TicketRead:
        row = self.repository.get_by_share_token(token)
        if not row:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ingresso não encontrado")
        ticket, event, seat = row
        return _to_read(self.repository, ticket, event, seat)
