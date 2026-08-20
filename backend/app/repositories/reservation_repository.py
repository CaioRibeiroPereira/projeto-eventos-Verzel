from datetime import datetime, timedelta

from sqlalchemy.exc import IntegrityError
from sqlmodel import Session, select

from app.core.qr import generate_manual_code, generate_share_token, sign_ticket
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

    def list_pending_for_customer(self, customer_id: int, event_id: int) -> list[Reservation]:
        """Reservas `pending` (ainda não pagas, nem recusadas/expiradas) do
        cliente nesse evento — usado pra mostrar "você tem uma reserva em
        aberto" quando ele volta pra tela de reserva em vez de deixar a
        reserva abandonada, invisível, só contando pro limite até expirar."""
        now = datetime.utcnow()
        return list(
            self.session.exec(
                select(Reservation).where(
                    Reservation.customer_id == customer_id,
                    Reservation.event_id == event_id,
                    Reservation.status == ReservationStatus.pending,
                    Reservation.expires_at > now,
                )
            )
        )

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
                reservation.status in (ReservationStatus.pending, ReservationStatus.awaiting_door_payment)
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
            elif (
                reservation.status in (ReservationStatus.pending, ReservationStatus.awaiting_door_payment)
                and reservation.expires_at > now
            ):
                count += 1
        return count

    def _reap_expired_holds(self, event_id: int, seat_ids: list[int]) -> None:
        """Reserva pendente que passou do expires_at sem virar 'paid'/'awaiting_door_payment'
        vigente trava o assento pra sempre, já que o UNIQUE(event_id, seat_id) só olha pro
        status do ticket, não pro prazo da reserva. Antes de tentar reservar, libera esses
        assentos: marca a reserva vencida como 'failed' e o ticket como 'cancelled', na mesma
        transação do insert — a trava de concorrência continua sendo o índice único."""
        now = datetime.utcnow()
        rows = self.session.exec(
            select(Ticket, Reservation)
            .join(Reservation, Ticket.reservation_id == Reservation.id)
            .where(
                Ticket.event_id == event_id,
                Ticket.seat_id.in_(seat_ids),
                Ticket.status != TicketStatus.cancelled,
                Reservation.status.in_([ReservationStatus.pending, ReservationStatus.awaiting_door_payment]),
                Reservation.expires_at <= now,
            )
        ).all()

        expired_reservations: dict[int, Reservation] = {}
        for ticket, reservation in rows:
            ticket.status = TicketStatus.cancelled
            self.session.add(ticket)
            expired_reservations[reservation.id] = reservation

        for reservation in expired_reservations.values():
            reservation.status = ReservationStatus.failed
            self.session.add(reservation)

        if rows:
            self.session.flush()

    def create_reservation_with_tickets(
        self, customer_id: int, event: Event, seats: list[Seat]
    ) -> tuple[Reservation, list[Ticket]]:
        self._reap_expired_holds(event.id, [seat.id for seat in seats])

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

    def mark_awaiting_door_payment(
        self, reservation: Reservation, event: Event, tickets: list[Ticket]
    ) -> Reservation:
        """'Pagar na hora': segura o assento até a sessão (não mais os 10min
        de checkout normal) e já emite o ingresso com QR/código — a portaria
        cobra e libera a entrada numa ação só quando a pessoa chegar."""
        reservation.status = ReservationStatus.awaiting_door_payment
        reservation.expires_at = event.starts_at
        self.session.add(reservation)

        for ticket in tickets:
            ticket.qr_signature = sign_ticket(ticket.id)
            ticket.share_token = generate_share_token()
            ticket.manual_code = generate_manual_code()
            self.session.add(ticket)

        self.session.commit()
        self.session.refresh(reservation)
        return reservation

    def mark_failed(self, reservation: Reservation, tickets: list[Ticket]) -> Reservation:
        reservation.status = ReservationStatus.failed
        for ticket in tickets:
            ticket.status = TicketStatus.cancelled
            self.session.add(ticket)
        self.session.add(reservation)
        self.session.commit()
        self.session.refresh(reservation)
        return reservation

    def cancel(self, reservation: Reservation, tickets: list[Ticket]) -> Reservation:
        """Cancela a reserva e libera os assentos numa transação só: o
        UNIQUE(event_id, seat_id) do Ticket só considera linhas com
        status != cancelled, então marcar os tickets como cancelled aqui
        já devolve o assento pro mapa (seat_map filtra por isso)."""
        reservation.status = ReservationStatus.cancelled
        for ticket in tickets:
            ticket.status = TicketStatus.cancelled
            self.session.add(ticket)
        self.session.add(reservation)
        self.session.commit()
        self.session.refresh(reservation)
        return reservation
