from datetime import datetime

from fastapi import HTTPException, status

from app.core.qr import generate_share_token, sign_ticket
from app.models.event import EventStatus
from app.models.reservation import Reservation, ReservationStatus
from app.repositories.reservation_repository import (
    ReservationRepository,
    SeatTakenError,
)
from app.schemas.reservations import ReservationCreate, ReservationRead, SeatState


class ReservationService:
    def __init__(self, repository: ReservationRepository):
        self.repository = repository

    def get_seat_map(self, event_id: int) -> list[SeatState]:
        event = self.repository.get_event(event_id)
        if not event or event.status != EventStatus.published:
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
        event = self.repository.get_event(event_id)
        if not event or event.status != EventStatus.published:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Evento não encontrado")

        seat = self.repository.get_seat(data.seat_id)
        if not seat or seat.event_id != event_id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assento não encontrado")

        try:
            reservation, ticket = self.repository.create_reservation_with_ticket(
                customer_id, event, seat
            )
        except SeatTakenError:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Esse assento acabou de ser reservado por outra pessoa",
            )

        return ReservationRead(
            id=reservation.id,
            event_id=reservation.event_id,
            seat_id=seat.id,
            seat_label=seat.label,
            status=reservation.status,
            total=reservation.total,
            expires_at=reservation.expires_at,
        )

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
            ticket = self.repository.get_ticket_for_reservation(reservation.id)
            if ticket:
                self.repository.mark_failed(reservation, ticket)
            raise HTTPException(
                status_code=status.HTTP_410_GONE,
                detail="O tempo para pagar essa reserva expirou, o assento foi liberado",
            )

        return reservation

    def confirm_payment(self, customer_id: int, reservation_id: int) -> ReservationRead:
        reservation = self._get_owned_pending_reservation(customer_id, reservation_id)
        ticket = self.repository.get_ticket_for_reservation(reservation.id)
        reservation = self.repository.mark_paid(reservation)
        self.repository.issue_ticket(ticket, sign_ticket(ticket.id), generate_share_token())
        return ReservationRead(
            id=reservation.id,
            event_id=reservation.event_id,
            seat_id=ticket.seat_id,
            seat_label=self.repository.get_seat(ticket.seat_id).label,
            status=reservation.status,
            total=reservation.total,
            expires_at=reservation.expires_at,
        )

    def decline_payment(self, customer_id: int, reservation_id: int) -> ReservationRead:
        reservation = self._get_owned_pending_reservation(customer_id, reservation_id)
        ticket = self.repository.get_ticket_for_reservation(reservation.id)
        reservation = self.repository.mark_failed(reservation, ticket)
        return ReservationRead(
            id=reservation.id,
            event_id=reservation.event_id,
            seat_id=ticket.seat_id,
            seat_label=self.repository.get_seat(ticket.seat_id).label,
            status=reservation.status,
            total=reservation.total,
            expires_at=reservation.expires_at,
        )
