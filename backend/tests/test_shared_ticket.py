"""Achado real do avaliador: a rota pública de ingresso compartilhado
devolvia o TicketRead inteiro, incluindo qr_payload (QR válido) e
manual_code — ou seja, qualquer um com o link conseguia entrar no lugar
do dono, escaneando ou digitando. A rota pública só pode mostrar dados
de exibição, nunca o que permite validar/usar o ingresso."""

from app.models.reservation import ReservationStatus
from app.models.ticket import Ticket, TicketStatus
from app.models.user import UserRole
from app.repositories.ticket_repository import TicketRepository
from app.schemas.tickets import SharedTicketRead
from app.services.ticket_service import TicketService


def test_shared_ticket_never_exposes_qr_or_manual_code(
    session, make_user, make_event, make_seat, make_reservation
):
    organizer = make_user(UserRole.organizer, "org@teste.local")
    customer = make_user(UserRole.customer, "cliente@teste.local")
    event = make_event(organizer.id)
    seat = make_seat(event.id, "B7")
    reservation = make_reservation(customer.id, event.id, status=ReservationStatus.paid)

    ticket = Ticket(
        reservation_id=reservation.id,
        event_id=event.id,
        seat_id=seat.id,
        status=TicketStatus.valid,
        qr_signature="assinatura-bem-secreta",
        share_token="token-publico-de-compartilhamento",
        manual_code="ABCD1234",
    )
    session.add(ticket)
    session.commit()

    service = TicketService(TicketRepository(session))
    result = service.get_shared(ticket.share_token)

    assert isinstance(result, SharedTicketRead)
    assert result.seat_label == "B7"
    assert not hasattr(result, "qr_payload")
    assert not hasattr(result, "manual_code")
    assert not hasattr(result, "share_token")
    # garante que o schema em si não tem como carregar esses campos,
    # não só que o service "esqueceu" de preencher.
    assert "qr_payload" not in SharedTicketRead.model_fields
    assert "manual_code" not in SharedTicketRead.model_fields
