from app.core.qr import normalize_manual_code, parse_ticket_payload, verify_ticket
from app.models.reservation import ReservationStatus
from app.models.ticket import Ticket, TicketStatus
from app.repositories.gate_repository import GateRepository
from app.schemas.gate import ValidateRequest, ValidationResult


class GateService:
    def __init__(self, repository: GateRepository):
        self.repository = repository

    def _resolve_ticket(self, code: str) -> Ticket | None:
        """Aceita tanto o payload do QR (câmera) quanto o código curto
        (digitação manual). Retorna None se o formato do QR foi reconhecido
        mas a assinatura não confere (QR forjado/adulterado)."""
        parsed = parse_ticket_payload(code)
        if parsed:
            ticket_id, signature = parsed
            if not verify_ticket(ticket_id, signature):
                return None
            return self.repository.get_ticket(ticket_id)

        normalized = normalize_manual_code(code)
        if not normalized:
            return None
        return self.repository.get_by_manual_code(normalized)

    def _resolve_in_scope(
        self, data: ValidateRequest
    ) -> tuple[Ticket, str | None, str | None] | ValidationResult:
        """Resolve o ticket pelo código e confere se ele é de alguma das
        sessões cobertas. Retorna (ticket, seat_label, event_title) se
        seguir em frente, ou já o ValidationResult final se parar aqui
        (código ilegível ou sessão errada)."""
        if not data.event_ids:
            return ValidationResult(result="invalid", message="Selecione ao menos uma sessão pra validar")

        ticket = self._resolve_ticket(data.code)
        if not ticket:
            return ValidationResult(result="invalid", message="Código ilegível ou inválido")

        seat = self.repository.get_seat(ticket.seat_id)
        seat_label = seat.label if seat else None
        event = self.repository.get_event(ticket.event_id)
        event_title = event.title if event else None

        if ticket.event_id not in data.event_ids:
            return ValidationResult(
                result="wrong_event",
                message="Esse ingresso é de outra sessão",
                seat_label=seat_label,
                event_title=event_title,
            )

        return ticket, seat_label, event_title

    def validate(self, data: ValidateRequest, gate_user_id: int) -> ValidationResult:
        resolved = self._resolve_in_scope(data)
        if isinstance(resolved, ValidationResult):
            return resolved
        ticket, seat_label, event_title = resolved

        if ticket.status == TicketStatus.cancelled:
            return ValidationResult(result="invalid", message="Ingresso cancelado", seat_label=seat_label)

        if ticket.status == TicketStatus.used:
            return ValidationResult(
                result="already_used",
                message="Ingresso já foi utilizado",
                seat_label=seat_label,
                event_title=event_title,
                used_at=ticket.used_at,
            )

        reservation = self.repository.get_reservation(ticket.reservation_id)
        if reservation and reservation.status == ReservationStatus.awaiting_door_payment:
            return ValidationResult(
                result="payment_due",
                message="Pagamento pendente — cobrar na entrada",
                seat_label=seat_label,
                event_title=event_title,
                amount_due=reservation.total,
            )

        if self.repository.try_mark_used(ticket.id, gate_user_id):
            return ValidationResult(
                result="valid",
                message="Ingresso válido",
                seat_label=seat_label,
                event_title=event_title,
            )

        return ValidationResult(
            result="already_used",
            message="Ingresso já foi utilizado",
            seat_label=seat_label,
            event_title=event_title,
        )

    def collect_door_payment(self, data: ValidateRequest, gate_user_id: int) -> ValidationResult:
        """'Pagar na hora': cobra e libera a entrada numa ação só. Marca a
        reserva inteira como paga e todos os tickets dela como usados —
        se a reserva tem mais de um assento, o grupo inteiro entra junto."""
        resolved = self._resolve_in_scope(data)
        if isinstance(resolved, ValidationResult):
            return resolved
        ticket, seat_label, event_title = resolved

        if ticket.status == TicketStatus.cancelled:
            return ValidationResult(result="invalid", message="Ingresso cancelado", seat_label=seat_label)

        if ticket.status == TicketStatus.used:
            return ValidationResult(
                result="already_used",
                message="Ingresso já foi utilizado",
                seat_label=seat_label,
                event_title=event_title,
                used_at=ticket.used_at,
            )

        reservation = self.repository.get_reservation(ticket.reservation_id)
        if not reservation or reservation.status != ReservationStatus.awaiting_door_payment:
            return ValidationResult(
                result="invalid",
                message="Esse ingresso não tem pagamento pendente na portaria",
                seat_label=seat_label,
                event_title=event_title,
            )

        if self.repository.collect_door_payment(reservation.id, gate_user_id):
            return ValidationResult(
                result="valid",
                message=f"Pagamento de R$ {reservation.total:.2f} confirmado — entrada liberada",
                seat_label=seat_label,
                event_title=event_title,
            )

        return ValidationResult(
            result="invalid",
            message="Não foi possível cobrar, tente de novo",
            seat_label=seat_label,
            event_title=event_title,
        )

    def undo_validation(self, data: ValidateRequest) -> ValidationResult:
        """Corrige validação por engano na hora: só desfaz um ingresso que
        está 'used', devolvendo pra 'valid'. Não afeta o histórico de quem
        validou originalmente além de limpar validated_by/used_at."""
        resolved = self._resolve_in_scope(data)
        if isinstance(resolved, ValidationResult):
            return resolved
        ticket, seat_label, event_title = resolved

        if ticket.status != TicketStatus.used:
            return ValidationResult(
                result="invalid",
                message="Esse ingresso não está validado — não há o que desfazer",
                seat_label=seat_label,
                event_title=event_title,
            )

        if self.repository.revert_to_valid(ticket.id):
            return ValidationResult(
                result="valid",
                message="Validação desfeita — o ingresso volta a valer",
                seat_label=seat_label,
                event_title=event_title,
            )

        return ValidationResult(
            result="invalid",
            message="Não foi possível desfazer, tente de novo",
            seat_label=seat_label,
            event_title=event_title,
        )
