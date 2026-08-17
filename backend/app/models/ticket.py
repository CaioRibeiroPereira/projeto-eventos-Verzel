from datetime import datetime
from enum import Enum

import sqlalchemy as sa
from sqlmodel import Field, Index, SQLModel


class TicketStatus(str, Enum):
    valid = "valid"
    used = "used"
    cancelled = "cancelled"


class Ticket(SQLModel, table=True):
    __table_args__ = (
        Index(
            "uq_ticket_event_seat_active",
            "event_id",
            "seat_id",
            unique=True,
            postgresql_where=sa.text("status != 'cancelled'"),
        ),
    )

    id: int | None = Field(default=None, primary_key=True)
    reservation_id: int = Field(foreign_key="reservation.id")
    event_id: int = Field(foreign_key="event.id")
    seat_id: int = Field(foreign_key="seat.id")

    qr_signature: str | None = None
    share_token: str | None = None
    status: TicketStatus = TicketStatus.valid
    used_at: datetime | None = None
    validated_by: int | None = Field(default=None, foreign_key="user.id")
