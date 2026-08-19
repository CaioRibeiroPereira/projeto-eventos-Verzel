from datetime import datetime, timedelta

from fastapi import HTTPException, status

from app.integrations import tmdb
from app.models.event import Event, EventStatus
from app.models.seat import Seat
from app.repositories.event_repository import EventRepository
from app.schemas.events import EventCancelResult, EventCreate, EventFilters, EventRead, SeatRowInput
from app.services.seat_layouts import ROOM_LAYOUTS

CANCEL_MIN_NOTICE = timedelta(days=1)


def _to_read(event: Event, seat_count: int, seats_sold: int) -> EventRead:
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
        director=event.director,
        cast=event.cast,
        tagline=event.tagline,
        vote_average=event.vote_average,
        youtube_key=event.youtube_key,
        local=event.local,
        starts_at=event.starts_at,
        price=event.price,
        format=event.format,
        language=event.language,
        status=event.status,
        seat_count=seat_count,
        seats_sold=seats_sold,
        created_at=event.created_at,
    )


def _build_seats(event_id: int, layout: list[SeatRowInput]) -> list[Seat]:
    seats: list[Seat] = []
    for row in layout:
        seat_number = 0
        for col, kind in enumerate(row.slots):
            if kind == "gap":
                continue
            seat_number += 1
            seats.append(
                Seat(
                    event_id=event_id,
                    label=f"{row.label}{seat_number}",
                    row_label=row.label,
                    col=col,
                    accessible=kind == "accessible",
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

    def get_room_layouts(self) -> dict[str, list[SeatRowInput]]:
        return ROOM_LAYOUTS

    def create_event(self, organizer_id: int, data: EventCreate) -> EventRead:
        layout = ROOM_LAYOUTS.get(data.local)
        if not layout:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Sala inválida")

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
                director=movie.director,
                cast=[
                    {"name": c.name, "character": c.character, "profile_path": c.profile_path}
                    for c in movie.cast
                ]
                or None,
                tagline=movie.tagline,
                vote_average=movie.vote_average,
                youtube_key=movie.youtube_key,
                local=data.local,
                starts_at=data.starts_at,
                price=data.price,
                format=data.format,
                language=data.language,
                status=EventStatus.published if data.publish_now else EventStatus.draft,
            )
        )
        seats = _build_seats(event.id, layout)
        self.repository.add_seats(seats)
        return _to_read(event, len(seats), 0)

    def publish_event(self, organizer_id: int, event_id: int) -> EventRead:
        event = self.repository.get(event_id)
        if not event or event.organizer_id != organizer_id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Evento não encontrado")
        if event.status == EventStatus.cancelled:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Evento cancelado não pode ser republicado",
            )
        event = self.repository.publish(event)
        return _to_read(event, self.repository.seat_count(event.id), self.repository.seats_sold(event.id))

    def cancel_event(self, organizer_id: int, event_id: int) -> EventCancelResult:
        event = self.repository.get(event_id)
        if not event or event.organizer_id != organizer_id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Evento não encontrado")
        if event.status == EventStatus.cancelled:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Evento já está cancelado")
        if event.starts_at - datetime.utcnow() < CANCEL_MIN_NOTICE:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Só é possível cancelar até 1 dia antes da sessão",
            )

        cancelled_reservations = self.repository.cancel_with_active_reservations(event)
        event_read = _to_read(
            event, self.repository.seat_count(event.id), self.repository.seats_sold(event.id)
        )
        return EventCancelResult(event=event_read, cancelled_reservations=cancelled_reservations)

    def list_my_events(self, organizer_id: int) -> list[EventRead]:
        events = self.repository.list_by_organizer(organizer_id)
        return [
            _to_read(e, self.repository.seat_count(e.id), self.repository.seats_sold(e.id)) for e in events
        ]

    def list_public_events(self, filters: EventFilters) -> list[EventRead]:
        events = self.repository.list_published(filters)
        return [
            _to_read(e, self.repository.seat_count(e.id), self.repository.seats_sold(e.id)) for e in events
        ]

    def get_public_event(self, event_id: int) -> EventRead:
        event = self.repository.get(event_id)
        if not event or event.status.value != "published":
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Evento não encontrado")
        return _to_read(event, self.repository.seat_count(event.id), self.repository.seats_sold(event.id))

    def get_event_sessions(self, event_id: int) -> list[EventRead]:
        event = self.repository.get(event_id)
        if not event or event.status.value != "published":
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Evento não encontrado")
        sessions = self.repository.list_sessions(event)
        return [
            _to_read(e, self.repository.seat_count(e.id), self.repository.seats_sold(e.id)) for e in sessions
        ]
