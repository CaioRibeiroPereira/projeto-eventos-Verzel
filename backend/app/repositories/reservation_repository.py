from datetime import datetime, timedelta

from sqlalchemy.exc import IntegrityError
from sqlmodel import Session, select

from app.models.event import Event
from app.models.reservation import Reservation, ReservationStatus
from app.models.seat import Seat
from app.models.ticket import Ticket, TicketStatus

RESERVATION_HOLD_MINUTES = 10


class SeatTakenError(Exception):
    pass


class ReservationRepository:
    def __init__(self, session: Session):
        self.session = session

    def get_seat(self, seat_id: int) -> Seat | None:
        return self.session.get(Seat, seat_id)

    def get_event(self, event_id: int) -> Event | None:
        return self.session.get(Event, event_id)

    def get_reservation(self, reservation_id: int) -> Reservation | None:
        return self.session.get(Reservation, reservation_id)

    def get_tickets_for_reservation(self, reservation_id: int) -> list[Ticket]:
        return list(
            self.session.exec(
                select(Ticket).where(Ticket.reservation_id == reservation_id)
            )
        )

    def seat_map(self, event_id: int) -> list[tuple[Seat, bool]]:
        seats = self.session.exec(
            select(Seat)
            .where(Seat.event_id == event_id)
            .order_by(Seat.row_label, Seat.col)
        ).all()

        rows = self.session.exec(
            select(Ticket, Reservation)
            .join(Reservation, Ticket.reservation_id == Reservation.id)
            .where(Ticket.event_id == event_id, Ticket.status != TicketStatus.cancelled)
        ).all()

        now = datetime.utcnow()
        blocked_seat_ids: set[int] = set()
        for ticket, reservation in rows:
            if reservation.status == ReservationStatus.paid:
                blocked_seat_ids.add(ticket.seat_id)
            elif (
                reservation.status == ReservationStatus.pending
                and reservation.expires_at > now
            ):
                blocked_seat_ids.add(ticket.seat_id)

        return [(seat, seat.id in blocked_seat_ids) for seat in seats]

    def count_active_tickets_for_customer(self, customer_id: int, event_id: int) -> int:
        rows = self.session.exec(
            select(Ticket, Reservation)
            .join(Reservation, Ticket.reservation_id == Reservation.id)
            .where(
                Ticket.event_id == event_id,
                Reservation.customer_id == customer_id,
                Ticket.status != TicketStatus.cancelled,
            )
        ).all()

        now = datetime.utcnow()
        count = 0
        for ticket, reservation in rows:
            if reservation.status == ReservationStatus.paid:
                count += 1
            elif reservation.status == ReservationStatus.pending and reservation.expires_at > now:
                count += 1
        return count

    def create_reservation_with_tickets(
        self, customer_id: int, event: Event, seats: list[Seat]
    ) -> tuple[Reservation, list[Ticket]]:
        reservation = Reservation(
            customer_id=customer_id,
            event_id=event.id,
            status=ReservationStatus.pending,
            total=event.price * len(seats),
            expires_at=datetime.utcnow() + timedelta(minutes=RESERVATION_HOLD_MINUTES),
        )
        self.session.add(reservation)
        self.session.flush()

        tickets = [
            Ticket(reservation_id=reservation.id, event_id=event.id, seat_id=seat.id)
            for seat in seats
        ]
        self.session.add_all(tickets)
        try:
            self.session.commit()
        except IntegrityError:
            self.session.rollback()
            raise SeatTakenError()

        self.session.refresh(reservation)
        for ticket in tickets:
            self.session.refresh(ticket)
        return reservation, tickets

    def mark_paid(self, reservation: Reservation) -> Reservation:
        reservation.status = ReservationStatus.paid
        self.session.add(reservation)
        self.session.commit()
        self.session.refresh(reservation)
        return reservation

    def issue_ticket(self, ticket: Ticket, qr_signature: str, share_token: str) -> Ticket:
        ticket.qr_signature = qr_signature
        ticket.share_token = share_token
        self.session.add(ticket)
        self.session.commit()
        self.session.refresh(ticket)
        return ticket

    def mark_failed(self, reservation: Reservation, tickets: list[Ticket]) -> Reservation:
        reservation.status = ReservationStatus.failed
        for ticket in tickets:
            ticket.status = TicketStatus.cancelled
            self.session.add(ticket)
        self.session.add(reservation)
        self.session.commit()
        self.session.refresh(reservation)
        return reservation
