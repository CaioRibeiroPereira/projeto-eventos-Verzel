from datetime import datetime

from sqlmodel import SQLModel

from app.models.reservation import ReservationStatus

MAX_SEATS_PER_RESERVATION = 2


class ReservationCreate(SQLModel):
    seat_ids: list[int]


class SeatSummary(SQLModel):
    seat_id: int
    seat_label: str


class ReservationRead(SQLModel):
    id: int
    event_id: int
    seats: list[SeatSummary]
    status: ReservationStatus
    total: float
    expires_at: datetime


class SeatState(SQLModel):
    id: int
    label: str
    row_label: str
    col: int
    accessible: bool
    occupied: bool
