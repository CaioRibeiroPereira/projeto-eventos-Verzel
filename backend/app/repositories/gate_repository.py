from datetime import datetime

from sqlalchemy import update
from sqlmodel import Session, select

from app.models.event import Event
from app.models.seat import Seat
from app.models.ticket import Ticket, TicketStatus


class GateRepository:
    def __init__(self, session: Session):
        self.session = session

    def get_event(self, event_id: int) -> Event | None:
        return self.session.get(Event, event_id)

    def get_ticket(self, ticket_id: int) -> Ticket | None:
        return self.session.get(Ticket, ticket_id)

    def get_by_manual_code(self, code: str) -> Ticket | None:
        return self.session.exec(select(Ticket).where(Ticket.manual_code == code)).first()

    def get_seat(self, seat_id: int) -> Seat | None:
        return self.session.get(Seat, seat_id)

    def try_mark_used(self, ticket_id: int, validated_by: int) -> bool:
        """UPDATE atômico: só marca como usado se ainda estiver 'valid'.
        Retornou linha = validou agora; não retornou = outra validação já
        ganhou a corrida (ou o ticket não está mais 'valid')."""
        stmt = (
            update(Ticket)
            .where(Ticket.id == ticket_id, Ticket.status == TicketStatus.valid)
            .values(status=TicketStatus.used, used_at=datetime.utcnow(), validated_by=validated_by)
            .returning(Ticket.id)
        )
        result = self.session.execute(stmt)
        updated = result.first() is not None
        self.session.commit()
        return updated
