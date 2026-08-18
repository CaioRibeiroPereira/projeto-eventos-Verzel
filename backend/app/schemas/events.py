from datetime import datetime
from typing import Literal

from sqlmodel import SQLModel

from app.models.event import EventFormat, EventLanguage, EventStatus

SlotKind = Literal["seat", "accessible", "gap"]


class SeatRowInput(SQLModel):
    label: str
    slots: list[SlotKind]
    """Um slot por posição na fileira: assento comum, assento acessível
    (cadeirante) ou corredor/vão."""


class EventCreate(SQLModel):
    tmdb_movie_id: int
    local: str
    starts_at: datetime
    price: float
    format: EventFormat
    language: EventLanguage
    seat_layout: list[SeatRowInput]


class CastMember(SQLModel):
    name: str
    character: str | None
    profile_path: str | None


class EventRead(SQLModel):
    id: int
    organizer_id: int
    tmdb_movie_id: int
    title: str
    poster_path: str | None
    backdrop_path: str | None
    overview: str | None
    genres: str | None
    runtime_minutes: int | None
    director: str | None
    cast: list[CastMember] | None
    tagline: str | None
    vote_average: float | None
    youtube_key: str | None
    local: str
    starts_at: datetime
    price: float
    format: EventFormat
    language: EventLanguage
    status: EventStatus
    seat_count: int


class EventFilters(SQLModel):
    q: str | None = None
    date: str | None = None
    local: str | None = None
    price_max: float | None = None
