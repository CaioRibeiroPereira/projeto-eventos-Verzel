from datetime import datetime
from enum import Enum

from sqlmodel import Field, SQLModel


class EventStatus(str, Enum):
    draft = "draft"
    published = "published"


class Event(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    organizer_id: int = Field(foreign_key="user.id")

    tmdb_movie_id: int
    title: str
    poster_path: str | None = None

    local: str
    starts_at: datetime
    price: float

    status: EventStatus = EventStatus.draft
