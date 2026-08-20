"""Garantia: o mesmo lugar não é vendido duas vezes (requisito crítico #1).

A trava é o índice único parcial `uq_ticket_event_seat_active` (event_id,
seat_id) WHERE status != 'cancelled' — o banco recusa o segundo insert,
não um `if` da aplicação. `ReservationRepository.create_reservation_with_tickets`
traduz esse IntegrityError em `SeatTakenError`.
"""

from datetime import datetime, timedelta

import pytest
from sqlmodel import Session

from app.models.reservation import ReservationStatus
from app.models.ticket import TicketStatus
from app.models.user import UserRole
from app.repositories.reservation_repository import ReservationRepository, SeatTakenError


def test_second_customer_cannot_book_an_already_sold_seat(session: Session, make_user, make_event, make_seat):
    organizer = make_user(UserRole.organizer, "org@teste.local")
    customer1 = make_user(UserRole.customer, "cliente1@teste.local")
    customer2 = make_user(UserRole.customer, "cliente2@teste.local")
    event = make_event(organizer.id)
    seat = make_seat(event.id)

    repo = ReservationRepository(session)
    repo.create_reservation_with_tickets(customer1.id, event, [seat])

    with pytest.raises(SeatTakenError):
        repo.create_reservation_with_tickets(customer2.id, event, [seat])


def test_batch_reservation_is_all_or_nothing(session: Session, make_user, make_event, make_seat):
    """Reserva de 2 assentos numa transação só: se um dos dois já está
    ocupado, a reserva inteira falha — nunca fica parcialmente feita."""
    organizer = make_user(UserRole.organizer, "org@teste.local")
    customer1 = make_user(UserRole.customer, "cliente1@teste.local")
    customer2 = make_user(UserRole.customer, "cliente2@teste.local")
    event = make_event(organizer.id)
    seat_a = make_seat(event.id, "A1")
    seat_b = make_seat(event.id, "A2")

    repo = ReservationRepository(session)
    repo.create_reservation_with_tickets(customer1.id, event, [seat_a])

    with pytest.raises(SeatTakenError):
        repo.create_reservation_with_tickets(customer2.id, event, [seat_a, seat_b])

    # seat_b não pode ter ficado "meio reservada" pelo lote que falhou.
    _, occupied_b = next(s for s in repo.seat_map(event.id) if s[0].id == seat_b.id)
    assert occupied_b is False


def test_cancelling_a_reservation_frees_the_seat_for_resale(
    session: Session, make_user, make_event, make_seat
):
    organizer = make_user(UserRole.organizer, "org@teste.local")
    customer1 = make_user(UserRole.customer, "cliente1@teste.local")
    customer2 = make_user(UserRole.customer, "cliente2@teste.local")
    event = make_event(organizer.id)
    seat = make_seat(event.id)

    repo = ReservationRepository(session)
    reservation, tickets = repo.create_reservation_with_tickets(customer1.id, event, [seat])
    repo.cancel(reservation, tickets)

    # devolvido ao estoque: outro cliente consegue comprar o mesmo lugar agora.
    reservation2, tickets2 = repo.create_reservation_with_tickets(customer2.id, event, [seat])
    assert tickets2[0].seat_id == seat.id
    assert tickets2[0].status == TicketStatus.valid


def test_expired_pending_hold_is_reaped_so_the_seat_can_be_resold(
    session: Session, make_user, make_event, make_seat, make_reservation, make_ticket
):
    """Bug real encontrado testando o pagamento na hora do filme: uma
    reserva `pending` que expira sem o cliente confirmar nem recusar
    travava o assento pra sempre, porque o índice único só olha o status
    do ticket, não o `expires_at` da reserva. `create_reservation_with_tickets`
    agora libera holds vencidos antes de tentar vender de novo."""
    organizer = make_user(UserRole.organizer, "org@teste.local")
    customer1 = make_user(UserRole.customer, "cliente1@teste.local")
    customer2 = make_user(UserRole.customer, "cliente2@teste.local")
    event = make_event(organizer.id)
    seat = make_seat(event.id)

    stale = make_reservation(
        customer1.id,
        event.id,
        status=ReservationStatus.pending,
        expires_at=datetime.utcnow() - timedelta(minutes=5),
    )
    make_ticket(stale.id, event.id, seat.id, status=TicketStatus.valid)

    repo = ReservationRepository(session)
    reservation2, tickets2 = repo.create_reservation_with_tickets(customer2.id, event, [seat])

    assert tickets2[0].seat_id == seat.id
    assert tickets2[0].status == TicketStatus.valid

    session.refresh(stale)
    assert stale.status == ReservationStatus.failed


def test_non_expired_pending_hold_still_blocks_the_seat(
    session: Session, make_user, make_event, make_seat, make_reservation, make_ticket
):
    """Contraprova do teste acima: um hold que ainda não venceu continua
    segurando o assento normalmente — a limpeza só vale pra reserva vencida."""
    organizer = make_user(UserRole.organizer, "org@teste.local")
    customer1 = make_user(UserRole.customer, "cliente1@teste.local")
    customer2 = make_user(UserRole.customer, "cliente2@teste.local")
    event = make_event(organizer.id)
    seat = make_seat(event.id)

    active = make_reservation(
        customer1.id,
        event.id,
        status=ReservationStatus.pending,
        expires_at=datetime.utcnow() + timedelta(minutes=10),
    )
    make_ticket(active.id, event.id, seat.id, status=TicketStatus.valid)

    repo = ReservationRepository(session)
    with pytest.raises(SeatTakenError):
        repo.create_reservation_with_tickets(customer2.id, event, [seat])
