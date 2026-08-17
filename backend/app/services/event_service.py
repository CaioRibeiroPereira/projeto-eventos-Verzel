from fastapi import HTTPException, status

from app.integrations import tmdb
from app.models.event import Event
from app.models.seat import Seat
from app.repositories.event_repository import EventRepository
from app.schemas.events import EventCreate, EventFilters, EventRead


def _to_read(event: Event, seat_count: int) -> EventRead:
    return EventRead(
        id=event.id,
        organizer_id=event.organizer_id,
        tmdb_movie_id=event.tmdb_movie_id,
        title=event.title,
        poster_path=event.poster_path,
        backdrop_path=event.backdrop_path,
        overview=event.overview,
        genres=event.genres,
        runtime_minutes=event.runtime_minutes,
        local=event.local,
        starts_at=event.starts_at,
        price=event.price,
        status=event.status,
        seat_count=seat_count,
    )


def _build_seats(event_id: int, layout: list) -> list[Seat]:
    seats: list[Seat] = []
    for row in layout:
        seat_number = 0
        for col, is_seat in enumerate(row.slots):
            if not is_seat:
                continue
            seat_number += 1
            seats.append(
                Seat(
                    event_id=event_id,
                    label=f"{row.label}{seat_number}",
                    row_label=row.label,
                    col=col,
                )
            )
    if not seats:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="O layout precisa ter ao menos um assento",
        )
    return seats


class EventService:
    def __init__(self, repository: EventRepository):
        self.repository = repository

    def search_movies(self, query: str):
        return tmdb.search_movies(query)

    def create_event(self, organizer_id: int, data: EventCreate) -> EventRead:
        movie = tmdb.get_movie(data.tmdb_movie_id)
        event = self.repository.create(
            Event(
                organizer_id=organizer_id,
                tmdb_movie_id=movie.id,
                title=movie.title,
                poster_path=movie.poster_path,
                backdrop_path=movie.backdrop_path,
                overview=movie.overview,
                genres=", ".join(movie.genres) or None,
                runtime_minutes=movie.runtime,
                local=data.local,
                starts_at=data.starts_at,
                price=data.price,
            )
        )
        seats = _build_seats(event.id, data.seat_layout)
        self.repository.add_seats(seats)
        return _to_read(event, len(seats))

    def publish_event(self, organizer_id: int, event_id: int) -> EventRead:
        event = self.repository.get(event_id)
        if not event or event.organizer_id != organizer_id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Evento não encontrado")
        event = self.repository.publish(event)
        return _to_read(event, self.repository.seat_count(event.id))

    def list_my_events(self, organizer_id: int) -> list[EventRead]:
        events = self.repository.list_by_organizer(organizer_id)
        return [_to_read(e, self.repository.seat_count(e.id)) for e in events]

    def list_public_events(self, filters: EventFilters) -> list[EventRead]:
        events = self.repository.list_published(filters)
        return [_to_read(e, self.repository.seat_count(e.id)) for e in events]

    def get_public_event(self, event_id: int) -> EventRead:
        event = self.repository.get(event_id)
        if not event or event.status.value != "published":
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Evento não encontrado")
        return _to_read(event, self.repository.seat_count(event.id))
