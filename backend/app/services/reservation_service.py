from datetime import datetime

from fastapi import HTTPException, status

from app.core.qr import generate_share_token, sign_ticket
from app.core.ws import broadcaster
from app.models.event import EventStatus
from app.models.reservation import Reservation, ReservationStatus
from app.models.seat import Seat
from app.models.ticket import Ticket, TicketStatus
from app.repositories.reservation_repository import (
    ReservationRepository,
    SeatTakenError,
)
from app.schemas.reservations import (
    MAX_SEATS_PER_RESERVATION,
    ReservationCreate,
    ReservationRead,
    SeatState,
    SeatSummary,
)


def _to_read(reservation: Reservation, tickets: list[Ticket], seats_by_id: dict[int, Seat]) -> ReservationRead:
    return ReservationRead(
        id=reservation.id,
        event_id=reservation.event_id,
        seats=[
            SeatSummary(seat_id=t.seat_id, seat_label=seats_by_id[t.seat_id].label)
            for t in tickets
        ],
        status=reservation.status,
        total=reservation.total,
        expires_at=reservation.expires_at,
    )


class ReservationService:
    def __init__(self, repository: ReservationRepository):
        self.repository = repository

    def get_seat_map(self, event_id: int) -> list[SeatState]:
        event = self.repository.get_event(event_id)
        if not event or event.status != EventStatus.published or event.starts_at <= datetime.utcnow():
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Evento não encontrado")

        return [
            SeatState(
                id=seat.id,
                label=seat.label,
                row_label=seat.row_label,
                col=seat.col,
                accessible=seat.accessible,
                occupied=occupied,
            )
            for seat, occupied in self.repository.seat_map(event_id)
        ]

    def create_reservation(self, customer_id: int, event_id: int, data: ReservationCreate) -> ReservationRead:
        if not data.seat_ids:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Selecione ao menos um assento")
        if len(data.seat_ids) > MAX_SEATS_PER_RESERVATION:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Máximo de {MAX_SEATS_PER_RESERVATION} assentos por pessoa",
            )
        if len(set(data.seat_ids)) != len(data.seat_ids):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Assento duplicado na seleção")

        event = self.repository.get_event(event_id)
        if not event or event.status != EventStatus.published or event.starts_at <= datetime.utcnow():
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Evento não encontrado")

        already_held = self.repository.count_active_tickets_for_customer(customer_id, event_id)
        if already_held + len(data.seat_ids) > MAX_SEATS_PER_RESERVATION:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    f"Você já tem {already_held} assento(s) reservado(s) para esse evento. "
                    f"Máximo de {MAX_SEATS_PER_RESERVATION} por pessoa."
                ),
            )

        seats = [self.repository.get_seat(seat_id) for seat_id in data.seat_ids]
        for seat in seats:
            if not seat or seat.event_id != event_id:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assento não encontrado")

        try:
            reservation, tickets = self.repository.create_reservation_with_tickets(
                customer_id, event, seats
            )
        except SeatTakenError:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Um ou mais assentos acabaram de ser reservados por outra pessoa",
            )

        seats_by_id = {seat.id: seat for seat in seats}
        broadcaster.notify_seats_changed(event_id, [t.seat_id for t in tickets])
        return _to_read(reservation, tickets, seats_by_id)

    def _get_owned_pending_reservation(self, customer_id: int, reservation_id: int) -> Reservation:
        reservation = self.repository.get_reservation(reservation_id)
        if not reservation or reservation.customer_id != customer_id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Reserva não encontrada")

        if reservation.status != ReservationStatus.pending:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Essa reserva já foi finalizada",
            )

        if reservation.expires_at <= datetime.utcnow():
            tickets = self.repository.get_tickets_for_reservation(reservation.id)
            if tickets:
                self.repository.mark_failed(reservation, tickets)
                broadcaster.notify_seats_changed(reservation.event_id, [t.seat_id for t in tickets])
            raise HTTPException(
                status_code=status.HTTP_410_GONE,
                detail="O tempo para pagar essa reserva expirou, os assentos foram liberados",
            )

        return reservation

    def pay_at_door(self, customer_id: int, reservation_id: int) -> ReservationRead:
        """'Pagar na hora do filme': em vez de confirmar o pagamento agora,
        segura o assento até a sessão e já emite o ingresso — a portaria
        cobra e valida numa ação só quando a pessoa chegar."""
        reservation = self._get_owned_pending_reservation(customer_id, reservation_id)
        event = self.repository.get_event(reservation.event_id)
        tickets = self.repository.get_tickets_for_reservation(reservation.id)
        reservation = self.repository.mark_awaiting_door_payment(reservation, event, tickets)
        seats_by_id = {t.seat_id: self.repository.get_seat(t.seat_id) for t in tickets}
        return _to_read(reservation, tickets, seats_by_id)

    def confirm_payment(self, customer_id: int, reservation_id: int) -> ReservationRead:
        reservation = self._get_owned_pending_reservation(customer_id, reservation_id)
        tickets = self.repository.get_tickets_for_reservation(reservation.id)
        reservation = self.repository.mark_paid(reservation)
        for ticket in tickets:
            self.repository.issue_ticket(ticket, sign_ticket(ticket.id), generate_share_token())
        seats_by_id = {t.seat_id: self.repository.get_seat(t.seat_id) for t in tickets}
        return _to_read(reservation, tickets, seats_by_id)

    def decline_payment(self, customer_id: int, reservation_id: int) -> ReservationRead:
        reservation = self._get_owned_pending_reservation(customer_id, reservation_id)
        tickets = self.repository.get_tickets_for_reservation(reservation.id)
        seats_by_id = {t.seat_id: self.repository.get_seat(t.seat_id) for t in tickets}
        reservation = self.repository.mark_failed(reservation, tickets)
        broadcaster.notify_seats_changed(reservation.event_id, [t.seat_id for t in tickets])
        return _to_read(reservation, tickets, seats_by_id)

    def cancel_reservation(self, customer_id: int, reservation_id: int) -> ReservationRead:
        reservation = self.repository.get_reservation(reservation_id)
        if not reservation or reservation.customer_id != customer_id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Reserva não encontrada")

        if reservation.status not in (ReservationStatus.paid, ReservationStatus.awaiting_door_payment):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Só é possível cancelar reservas pagas ou aguardando pagamento na portaria",
            )

        tickets = self.repository.get_tickets_for_reservation(reservation.id)
        if any(t.status == TicketStatus.used for t in tickets):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Não é possível cancelar: pelo menos um ingresso já foi validado na portaria",
            )

        seats_by_id = {t.seat_id: self.repository.get_seat(t.seat_id) for t in tickets}
        reservation = self.repository.cancel(reservation, tickets)
        broadcaster.notify_seats_changed(reservation.event_id, [t.seat_id for t in tickets])
        return _to_read(reservation, tickets, seats_by_id)
