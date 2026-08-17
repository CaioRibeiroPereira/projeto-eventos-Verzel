from datetime import datetime

from sqlmodel import SQLModel

from app.models.reservation import ReservationStatus


class ReservationCreate(SQLModel):
    seat_id: int


class ReservationRead(SQLModel):
    id: int
    event_id: int
    seat_id: int
    seat_label: str
    status: ReservationStatus
    total: float
    expires_at: datetime


class SeatState(SQLModel):
    id: int
    label: str
    row_label: str
    col: int
    occupied: bool
