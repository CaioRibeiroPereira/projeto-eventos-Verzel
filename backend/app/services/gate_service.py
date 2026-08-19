from app.core.qr import normalize_manual_code, parse_ticket_payload, verify_ticket
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

    def validate(self, event_id: int, data: ValidateRequest, gate_user_id: int) -> ValidationResult:
        event = self.repository.get_event(event_id)
        if not event:
            return ValidationResult(result="invalid", message="Evento não encontrado")

        ticket = self._resolve_ticket(data.code)
        if not ticket:
            return ValidationResult(result="invalid", message="Código ilegível ou inválido")

        seat = self.repository.get_seat(ticket.seat_id)
        seat_label = seat.label if seat else None

        if ticket.event_id != event_id:
            return ValidationResult(
                result="wrong_event",
                message="Esse ingresso é de outro evento",
                seat_label=seat_label,
            )

        if ticket.status == TicketStatus.cancelled:
            return ValidationResult(result="invalid", message="Ingresso cancelado", seat_label=seat_label)

        if ticket.status == TicketStatus.used:
            return ValidationResult(
                result="already_used",
                message="Ingresso já foi utilizado",
                seat_label=seat_label,
                event_title=event.title,
                used_at=ticket.used_at,
            )

        if self.repository.try_mark_used(ticket.id, gate_user_id):
            return ValidationResult(
                result="valid",
                message="Ingresso válido",
                seat_label=seat_label,
                event_title=event.title,
            )

        return ValidationResult(
            result="already_used",
            message="Ingresso já foi utilizado",
            seat_label=seat_label,
            event_title=event.title,
        )
