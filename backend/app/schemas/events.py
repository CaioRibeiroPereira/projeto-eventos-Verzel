from datetime import datetime

from sqlmodel import SQLModel

from app.models.event import EventStatus


class SeatRowInput(SQLModel):
    label: str
    slots: list[bool]
    """Um slot por posição na fileira; True = assento, False = corredor/vão."""


class EventCreate(SQLModel):
    tmdb_movie_id: int
    local: str
    starts_at: datetime
    price: float
    seat_layout: list[SeatRowInput]


class EventRead(SQLModel):
    id: int
    organizer_id: int
    tmdb_movie_id: int
    title: str
    poster_path: str | None
    backdrop_path: str | None
    local: str
    starts_at: datetime
    price: float
    status: EventStatus
    seat_count: int


class EventFilters(SQLModel):
    q: str | None = None
    date: str | None = None
    local: str | None = None
    price_max: float | None = None
