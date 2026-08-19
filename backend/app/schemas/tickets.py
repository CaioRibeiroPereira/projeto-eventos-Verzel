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
