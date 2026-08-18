from fastapi import APIRouter, Depends, Query
from sqlmodel import Session

from app.core.database import get_session
from app.core.security import require_role
from app.models.user import User, UserRole
from app.repositories.event_repository import EventRepository
from app.schemas.events import EventCreate, EventFilters, EventRead
from app.schemas.movies import MovieResult
from app.services.event_service import EventService

router = APIRouter(tags=["events"])


def get_event_service(session: Session = Depends(get_session)) -> EventService:
    return EventService(EventRepository(session))


require_organizer = require_role(UserRole.organizer)


@router.get("/movies/search", response_model=list[MovieResult])
def search_movies(
    query: str,
    service: EventService = Depends(get_event_service),
    _: User = Depends(require_organizer),
):
    return service.search_movies(query)


@router.post("/events", response_model=EventRead, status_code=201)
def create_event(
    data: EventCreate,
    service: EventService = Depends(get_event_service),
    user: User = Depends(require_organizer),
):
    return service.create_event(user.id, data)


@router.post("/events/{event_id}/publish", response_model=EventRead)
def publish_event(
    event_id: int,
    service: EventService = Depends(get_event_service),
    user: User = Depends(require_organizer),
):
    return service.publish_event(user.id, event_id)


@router.get("/events/mine", response_model=list[EventRead])
def list_my_events(
    service: EventService = Depends(get_event_service),
    user: User = Depends(require_organizer),
):
    return service.list_my_events(user.id)


@router.get("/events", response_model=list[EventRead])
def list_public_events(
    q: str | None = None,
    date: str | None = None,
    local: str | None = None,
    price_max: float | None = Query(default=None),
    service: EventService = Depends(get_event_service),
):
    filters = EventFilters(q=q, date=date, local=local, price_max=price_max)
    return service.list_public_events(filters)


@router.get("/events/{event_id}", response_model=EventRead)
def get_public_event(
    event_id: int,
    service: EventService = Depends(get_event_service),
):
    return service.get_public_event(event_id)


@router.get("/events/{event_id}/sessions", response_model=list[EventRead])
def get_event_sessions(
    event_id: int,
    service: EventService = Depends(get_event_service),
):
    return service.get_event_sessions(event_id)
