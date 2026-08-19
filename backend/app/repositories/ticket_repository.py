from sqlmodel import Session, select

from app.models.event import Event
from app.models.reservation import Reservation
from app.models.seat import Seat
from app.models.ticket import Ticket


class TicketRepository:
    def __init__(self, session: Session):
        self.session = session

    def list_for_customer(self, customer_id: int) -> list[tuple[Ticket, Event, Seat]]:
        # qr_signature só existe em ingresso que chegou a ser emitido (pagamento
        # confirmado). Reserva recusada/expirada também vira status=cancelled,
        # mas nunca foi emitida — não deve aparecer aqui. Um ingresso que o
        # próprio cliente cancelou DEPOIS de emitido continua aparecendo,
        # agora com status=cancelled, pra manter o histórico visível.
        rows = self.session.exec(
            select(Ticket, Event, Seat)
            .join(Reservation, Ticket.reservation_id == Reservation.id)
            .join(Event, Ticket.event_id == Event.id)
            .join(Seat, Ticket.seat_id == Seat.id)
            .where(
                Reservation.customer_id == customer_id,
                Ticket.qr_signature.is_not(None),
            )
            .order_by(Event.starts_at)
        ).all()
        return list(rows)

    def get_by_share_token(self, token: str) -> tuple[Ticket, Event, Seat] | None:
        return self.session.exec(
            select(Ticket, Event, Seat)
            .join(Event, Ticket.event_id == Event.id)
            .join(Seat, Ticket.seat_id == Seat.id)
            .where(Ticket.share_token == token)
        ).first()

    def save(self, ticket: Ticket) -> Ticket:
        self.session.add(ticket)
        self.session.commit()
        self.session.refresh(ticket)
        return ticket
