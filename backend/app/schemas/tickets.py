from datetime import datetime

from sqlmodel import SQLModel

from app.models.ticket import TicketStatus


class TicketRead(SQLModel):
    id: int
    reservation_id: int
    event_id: int
    event_title: str
    event_poster_path: str | None
    event_local: str
    event_starts_at: datetime
    seat_label: str
    status: TicketStatus
    qr_payload: str
    share_token: str
    manual_code: str
    used_at: datetime | None
    awaiting_door_payment: bool


class SharedTicketRead(SQLModel):
    """Só o suficiente pra exibir na página pública de compartilhamento —
    nunca `qr_payload` nem `manual_code`: quem tem o link só pode ver que
    o ingresso existe e o status dele, não usar isso pra entrar no lugar
    do dono (nem escaneando, nem digitando o código)."""

    event_title: str
    event_poster_path: str | None
    event_local: str
    event_starts_at: datetime
    seat_label: str
    status: TicketStatus
    used_at: datetime | None
    awaiting_door_payment: bool
