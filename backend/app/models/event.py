from datetime import datetime
from enum import Enum

from sqlalchemy import JSON, Column
from sqlalchemy import Enum as SAEnum
from sqlmodel import Field, SQLModel


class EventStatus(str, Enum):
    draft = "draft"
    published = "published"


class EventFormat(str, Enum):
    format_2d = "2D"
    format_3d = "3D"


class EventLanguage(str, Enum):
    dubbed = "Dublado"
    subtitled = "Legendado"


class Event(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    organizer_id: int = Field(foreign_key="user.id")

    tmdb_movie_id: int
    title: str
    poster_path: str | None = None
    backdrop_path: str | None = None
    overview: str | None = None
    genres: str | None = None
    runtime_minutes: int | None = None
    director: str | None = None
    cast: list[dict] | None = Field(default=None, sa_column=Column(JSON))
    tagline: str | None = None
    vote_average: float | None = None
    youtube_key: str | None = None

    local: str
    starts_at: datetime
    price: float
    format: EventFormat = Field(
        default=EventFormat.format_2d,
        sa_column=Column(SAEnum(EventFormat, values_callable=lambda enum: [e.value for e in enum])),
    )
    language: EventLanguage = Field(
        default=EventLanguage.dubbed,
        sa_column=Column(SAEnum(EventLanguage, values_callable=lambda enum: [e.value for e in enum])),
    )

    status: EventStatus = EventStatus.draft
    created_at: datetime = Field(default_factory=datetime.utcnow)
