"""Garantia (opcional): cancelamento devolve o assento ao estoque.

Cobre os dois caminhos que existem no produto: o cliente cancela uma
reserva paga (ou aguardando pagamento na portaria), e o organizador
cancela o evento inteiro, cancelando em cascata as reservas ativas.
Em ambos, "devolver ao estoque" é reaproveitar o mesmo filtro que já
protege contra vender o lugar duas vezes: marcar o ticket como
`cancelled` já libera o assento, porque o índice único ignora linhas
`cancelled`.
"""

from datetime import datetime, timedelta

import pytest
from fastapi import HTTPException

from app.models.reservation import ReservationStatus
from app.models.ticket import TicketStatus
from app.models.user import UserRole
from app.repositories.event_repository import EventRepository
from app.repositories.reservation_repository import ReservationRepository
from app.services.event_service import EventService
from app.services.reservation_service import ReservationService


def test_cancelling_a_paid_reservation_frees_the_seat(
    session, make_user, make_event, make_seat, make_reservation, make_ticket
):
    organizer = make_user(UserRole.organizer, "org@teste.local")
    customer1 = make_user(UserRole.customer, "cliente1@teste.local")
    customer2 = make_user(UserRole.customer, "cliente2@teste.local")
    event = make_event(organizer.id)
    seat = make_seat(event.id)
    reservation = make_reservation(customer1.id, event.id, status=ReservationStatus.paid)
    make_ticket(reservation.id, event.id, seat.id)

    service = ReservationService(ReservationRepository(session))
    cancelled = service.cancel_reservation(customer1.id, reservation.id)
    assert cancelled.status == "cancelled"

    # devolvido ao estoque: outro cliente consegue comprar o mesmo lugar.
    repo = ReservationRepository(session)
    _, tickets2 = repo.create_reservation_with_tickets(customer2.id, event, [seat])
    assert tickets2[0].seat_id == seat.id


def test_cannot_cancel_a_reservation_that_was_already_validated_at_the_gate(
    session, make_user, make_event, make_seat, make_reservation, make_ticket
):
    organizer = make_user(UserRole.organizer, "org@teste.local")
    customer = make_user(UserRole.customer, "cliente@teste.local")
    event = make_event(organizer.id)
    seat = make_seat(event.id)
    reservation = make_reservation(customer.id, event.id, status=ReservationStatus.paid)
    make_ticket(reservation.id, event.id, seat.id, status=TicketStatus.used)

    service = ReservationService(ReservationRepository(session))
    with pytest.raises(HTTPException) as exc_info:
        service.cancel_reservation(customer.id, reservation.id)
    assert exc_info.value.status_code == 409


def test_cancelling_an_abandoned_pending_reservation_frees_the_seat(
    session, make_user, make_event, make_seat, make_reservation, make_ticket
):
    """Cliente abriu o checkout (assento fica pending, segurado por 10min)
    e desistiu sem pagar nem recusar — precisa conseguir cancelar na hora
    em vez de só esperar expirar, senão o assento fica "preso" contando
    pro limite de 2 por pessoa sem o cliente conseguir liberar."""
    organizer = make_user(UserRole.organizer, "org@teste.local")
    customer1 = make_user(UserRole.customer, "cliente1@teste.local")
    customer2 = make_user(UserRole.customer, "cliente2@teste.local")
    event = make_event(organizer.id)
    seat = make_seat(event.id)
    reservation = make_reservation(customer1.id, event.id, status=ReservationStatus.pending)
    make_ticket(reservation.id, event.id, seat.id)

    service = ReservationService(ReservationRepository(session))
    cancelled = service.cancel_reservation(customer1.id, reservation.id)
    assert cancelled.status == "cancelled"

    repo = ReservationRepository(session)
    _, tickets2 = repo.create_reservation_with_tickets(customer2.id, event, [seat])
    assert tickets2[0].seat_id == seat.id


def test_pending_reservation_is_listed_for_the_customer_to_resolve(
    session, make_user, make_event, make_seat, make_reservation, make_ticket
):
    organizer = make_user(UserRole.organizer, "org@teste.local")
    customer = make_user(UserRole.customer, "cliente@teste.local")
    event = make_event(organizer.id)
    seat = make_seat(event.id, "C7")
    reservation = make_reservation(customer.id, event.id, status=ReservationStatus.pending)
    make_ticket(reservation.id, event.id, seat.id)

    service = ReservationService(ReservationRepository(session))
    pending = service.get_my_pending_reservations(customer.id, event.id)

    assert len(pending) == 1
    assert pending[0].id == reservation.id
    assert pending[0].seats[0].seat_label == "C7"


def test_cannot_cancel_a_reservation_already_finalized(
    session, make_user, make_event, make_seat, make_reservation, make_ticket
):
    organizer = make_user(UserRole.organizer, "org@teste.local")
    customer = make_user(UserRole.customer, "cliente@teste.local")
    event = make_event(organizer.id)
    seat = make_seat(event.id)
    reservation = make_reservation(customer.id, event.id, status=ReservationStatus.failed)
    make_ticket(reservation.id, event.id, seat.id, status=TicketStatus.cancelled)

    service = ReservationService(ReservationRepository(session))
    with pytest.raises(HTTPException) as exc_info:
        service.cancel_reservation(customer.id, reservation.id)
    assert exc_info.value.status_code == 409


def test_cancelling_a_pay_at_door_reservation_frees_the_seat(
    session, make_user, make_event, make_seat, make_reservation, make_ticket
):
    organizer = make_user(UserRole.organizer, "org@teste.local")
    customer1 = make_user(UserRole.customer, "cliente1@teste.local")
    customer2 = make_user(UserRole.customer, "cliente2@teste.local")
    event = make_event(organizer.id)
    seat = make_seat(event.id)
    reservation = make_reservation(
        customer1.id, event.id, status=ReservationStatus.awaiting_door_payment
    )
    make_ticket(reservation.id, event.id, seat.id)

    service = ReservationService(ReservationRepository(session))
    cancelled = service.cancel_reservation(customer1.id, reservation.id)
    assert cancelled.status == "cancelled"

    repo = ReservationRepository(session)
    _, tickets2 = repo.create_reservation_with_tickets(customer2.id, event, [seat])
    assert tickets2[0].seat_id == seat.id


def test_cancelling_an_event_cascades_to_paid_reservations_and_frees_seats(
    session, make_user, make_event, make_seat, make_reservation, make_ticket
):
    organizer = make_user(UserRole.organizer, "org@teste.local")
    customer = make_user(UserRole.customer, "cliente@teste.local")
    event = make_event(organizer.id, starts_at=datetime.utcnow() + timedelta(days=5))
    seat = make_seat(event.id)
    reservation = make_reservation(customer.id, event.id, status=ReservationStatus.paid)
    ticket = make_ticket(reservation.id, event.id, seat.id)

    service = EventService(EventRepository(session))
    result = service.cancel_event(organizer.id, event.id)

    assert result.event.status == "cancelled"
    assert result.cancelled_reservations == 1

    session.refresh(reservation)
    session.refresh(ticket)
    assert reservation.status == ReservationStatus.cancelled
    assert ticket.status == TicketStatus.cancelled

    # assento devolvido ao estoque: dá pra vender de novo (embora o evento
    # esteja cancelado, a garantia de não duplicar venda é a mesma checada).
    repo = ReservationRepository(session)
    other_customer = make_user(UserRole.customer, "outro@teste.local")
    _, new_tickets = repo.create_reservation_with_tickets(other_customer.id, event, [seat])
    assert new_tickets[0].seat_id == seat.id


def test_cannot_cancel_event_less_than_24h_before_it_starts(
    session, make_user, make_event, make_seat
):
    organizer = make_user(UserRole.organizer, "org@teste.local")
    event = make_event(organizer.id, starts_at=datetime.utcnow() + timedelta(hours=5))

    service = EventService(EventRepository(session))
    with pytest.raises(HTTPException) as exc_info:
        service.cancel_event(organizer.id, event.id)
    assert exc_info.value.status_code == 409


def test_cannot_cancel_an_already_cancelled_event(session, make_user, make_event):
    from app.models.event import EventStatus

    organizer = make_user(UserRole.organizer, "org@teste.local")
    event = make_event(
        organizer.id, starts_at=datetime.utcnow() + timedelta(days=5), status=EventStatus.cancelled
    )

    service = EventService(EventRepository(session))
    with pytest.raises(HTTPException) as exc_info:
        service.cancel_event(organizer.id, event.id)
    assert exc_info.value.status_code == 409
