from datetime import datetime
from enum import Enum

from sqlmodel import Field, SQLModel


class ReservationStatus(str, Enum):
    pending = "pending"
    paid = "paid"
    failed = "failed"
    cancelled = "cancelled"


class Reservation(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    customer_id: int = Field(foreign_key="user.id")
    event_id: int = Field(foreign_key="event.id")

    status: ReservationStatus = ReservationStatus.pending
    total: float
    expires_at: datetime
