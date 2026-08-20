"""Garantia: o mesmo ingresso não é validado duas vezes (requisito crítico #3),
e os quatro retornos da portaria são distintos e corretos.

A trava é um único UPDATE atômico (`UPDATE ticket SET status='used' ...
WHERE status='valid' RETURNING *`): voltou linha = validou agora, não
voltou = já estava usado. Sem essa atomicidade, duas validações
simultâneas do mesmo ingresso poderiam ambas "ganhar".
"""

from app.core.qr import sign_ticket, ticket_payload
from app.models.reservation import ReservationStatus
from app.models.ticket import TicketStatus
from app.models.user import UserRole
from app.repositories.gate_repository import GateRepository
from app.schemas.gate import ValidateRequest
from app.services.gate_service import GateService


def _service(session) -> GateService:
    return GateService(GateRepository(session))


def test_try_mark_used_is_atomic_second_call_loses(
    session, make_user, make_event, make_seat, make_reservation, make_ticket
):
    organizer = make_user(UserRole.organizer, "org@teste.local")
    gate_user = make_user(UserRole.gate, "portaria@teste.local")
    customer = make_user(UserRole.customer, "cliente@teste.local")
    event = make_event(organizer.id)
    seat = make_seat(event.id)
    reservation = make_reservation(customer.id, event.id, status=ReservationStatus.paid)
    ticket = make_ticket(reservation.id, event.id, seat.id)

    repo = GateRepository(session)
    assert repo.try_mark_used(ticket.id, gate_user.id) is True
    assert repo.try_mark_used(ticket.id, gate_user.id) is False  # já usado, não revalida


def test_gate_service_returns_valid_on_first_scan(
    session, make_user, make_event, make_seat, make_reservation, make_ticket
):
    organizer = make_user(UserRole.organizer, "org@teste.local")
    gate_user = make_user(UserRole.gate, "portaria@teste.local")
    customer = make_user(UserRole.customer, "cliente@teste.local")
    event = make_event(organizer.id)
    seat = make_seat(event.id, "B3")
    reservation = make_reservation(customer.id, event.id, status=ReservationStatus.paid)
    ticket = make_ticket(reservation.id, event.id, seat.id)
    code = ticket_payload(ticket.id, sign_ticket(ticket.id))

    result = _service(session).validate(ValidateRequest(code=code, event_ids=[event.id]), gate_user.id)

    assert result.result == "valid"
    assert result.seat_label == "B3"


def test_gate_service_returns_already_used_on_second_scan(
    session, make_user, make_event, make_seat, make_reservation, make_ticket
):
    organizer = make_user(UserRole.organizer, "org@teste.local")
    gate_user = make_user(UserRole.gate, "portaria@teste.local")
    customer = make_user(UserRole.customer, "cliente@teste.local")
    event = make_event(organizer.id)
    seat = make_seat(event.id)
    reservation = make_reservation(customer.id, event.id, status=ReservationStatus.paid)
    ticket = make_ticket(reservation.id, event.id, seat.id)
    code = ticket_payload(ticket.id, sign_ticket(ticket.id))
    request = ValidateRequest(code=code, event_ids=[event.id])

    service = _service(session)
    first = service.validate(request, gate_user.id)
    second = service.validate(request, gate_user.id)

    assert first.result == "valid"
    assert second.result == "already_used"
    assert second.used_at is not None


def test_gate_service_returns_wrong_event_and_does_not_consume_the_ticket(
    session, make_user, make_event, make_seat, make_reservation, make_ticket
):
    organizer = make_user(UserRole.organizer, "org@teste.local")
    gate_user = make_user(UserRole.gate, "portaria@teste.local")
    customer = make_user(UserRole.customer, "cliente@teste.local")
    event = make_event(organizer.id, title="Sessão A")
    other_event = make_event(organizer.id, title="Sessão B", local="Sala B")
    seat = make_seat(event.id)
    reservation = make_reservation(customer.id, event.id, status=ReservationStatus.paid)
    ticket = make_ticket(reservation.id, event.id, seat.id)
    code = ticket_payload(ticket.id, sign_ticket(ticket.id))

    service = _service(session)
    wrong = service.validate(ValidateRequest(code=code, event_ids=[other_event.id]), gate_user.id)
    assert wrong.result == "wrong_event"

    # o ingresso continua válido pra sessão certa depois da tentativa errada.
    right = service.validate(ValidateRequest(code=code, event_ids=[event.id]), gate_user.id)
    assert right.result == "valid"


def test_gate_service_returns_invalid_for_forged_qr_signature(
    session, make_user, make_event, make_seat, make_reservation, make_ticket
):
    organizer = make_user(UserRole.organizer, "org@teste.local")
    gate_user = make_user(UserRole.gate, "portaria@teste.local")
    customer = make_user(UserRole.customer, "cliente@teste.local")
    event = make_event(organizer.id)
    seat = make_seat(event.id)
    reservation = make_reservation(customer.id, event.id, status=ReservationStatus.paid)
    ticket = make_ticket(reservation.id, event.id, seat.id)
    forged = ticket_payload(ticket.id, "0" * 64)

    result = _service(session).validate(ValidateRequest(code=forged, event_ids=[event.id]), gate_user.id)

    assert result.result == "invalid"


def test_gate_service_manual_code_validates_same_ticket_as_qr(
    session, make_user, make_event, make_seat, make_reservation
):
    from app.core.qr import generate_manual_code

    organizer = make_user(UserRole.organizer, "org@teste.local")
    gate_user = make_user(UserRole.gate, "portaria@teste.local")
    customer = make_user(UserRole.customer, "cliente@teste.local")
    event = make_event(organizer.id)
    seat = make_seat(event.id)
    reservation = make_reservation(customer.id, event.id, status=ReservationStatus.paid)

    from app.models.ticket import Ticket

    ticket = Ticket(
        reservation_id=reservation.id,
        event_id=event.id,
        seat_id=seat.id,
        manual_code=generate_manual_code(),
    )
    session.add(ticket)
    session.commit()
    session.refresh(ticket)

    result = _service(session).validate(
        ValidateRequest(code=ticket.manual_code, event_ids=[event.id]), gate_user.id
    )
    assert result.result == "valid"


def test_undo_then_revalidate(session, make_user, make_event, make_seat, make_reservation, make_ticket):
    organizer = make_user(UserRole.organizer, "org@teste.local")
    gate_user = make_user(UserRole.gate, "portaria@teste.local")
    customer = make_user(UserRole.customer, "cliente@teste.local")
    event = make_event(organizer.id)
    seat = make_seat(event.id)
    reservation = make_reservation(customer.id, event.id, status=ReservationStatus.paid)
    ticket = make_ticket(reservation.id, event.id, seat.id)
    code = ticket_payload(ticket.id, sign_ticket(ticket.id))
    request = ValidateRequest(code=code, event_ids=[event.id])

    service = _service(session)
    service.validate(request, gate_user.id)
    undo = service.undo_validation(request)
    assert undo.result == "valid"
    assert undo.message.startswith("Validação desfeita")

    revalidated = service.validate(request, gate_user.id)
    assert revalidated.result == "valid"


def test_undo_with_nothing_to_undo_is_reported_as_invalid(
    session, make_user, make_event, make_seat, make_reservation, make_ticket
):
    organizer = make_user(UserRole.organizer, "org@teste.local")
    gate_user = make_user(UserRole.gate, "portaria@teste.local")
    customer = make_user(UserRole.customer, "cliente@teste.local")
    event = make_event(organizer.id)
    seat = make_seat(event.id)
    reservation = make_reservation(customer.id, event.id, status=ReservationStatus.paid)
    ticket = make_ticket(reservation.id, event.id, seat.id)
    code = ticket_payload(ticket.id, sign_ticket(ticket.id))

    undo = _service(session).undo_validation(ValidateRequest(code=code, event_ids=[event.id]))
    assert undo.result == "invalid"


def test_gate_scan_of_pay_at_door_ticket_returns_payment_due_instead_of_valid(
    session, make_user, make_event, make_seat, make_reservation, make_ticket
):
    organizer = make_user(UserRole.organizer, "org@teste.local")
    gate_user = make_user(UserRole.gate, "portaria@teste.local")
    customer = make_user(UserRole.customer, "cliente@teste.local")
    event = make_event(organizer.id)
    seat = make_seat(event.id)
    reservation = make_reservation(
        customer.id, event.id, status=ReservationStatus.awaiting_door_payment, total=55.0
    )
    ticket = make_ticket(reservation.id, event.id, seat.id)
    code = ticket_payload(ticket.id, sign_ticket(ticket.id))

    result = _service(session).validate(ValidateRequest(code=code, event_ids=[event.id]), gate_user.id)

    assert result.result == "payment_due"
    assert result.amount_due == 55.0
    session.refresh(ticket)
    assert ticket.status == TicketStatus.valid  # não libera a entrada sem cobrar


def test_collect_door_payment_charges_and_lets_in_atomically(
    session, make_user, make_event, make_seat, make_reservation, make_ticket
):
    organizer = make_user(UserRole.organizer, "org@teste.local")
    gate_user = make_user(UserRole.gate, "portaria@teste.local")
    customer = make_user(UserRole.customer, "cliente@teste.local")
    event = make_event(organizer.id)
    seat = make_seat(event.id)
    reservation = make_reservation(
        customer.id, event.id, status=ReservationStatus.awaiting_door_payment, total=55.0
    )
    ticket = make_ticket(reservation.id, event.id, seat.id)
    code = ticket_payload(ticket.id, sign_ticket(ticket.id))
    request = ValidateRequest(code=code, event_ids=[event.id])

    service = _service(session)
    charged = service.collect_door_payment(request, gate_user.id)
    assert charged.result == "valid"

    session.refresh(reservation)
    session.refresh(ticket)
    assert reservation.status == ReservationStatus.paid
    assert ticket.status == TicketStatus.used

    charged_again = service.collect_door_payment(request, gate_user.id)
    assert charged_again.result == "already_used"
