"""Bug real encontrado testando a aplicação: o formulário de criar evento
deixava marcar uma sessão no passado. Não tinha checagem nenhuma no
service, só no `min` do input de data no front (fácil de burlar)."""

from datetime import datetime, timedelta

import pytest
from fastapi import HTTPException

from app.repositories.event_repository import EventRepository
from app.schemas.events import EventCreate
from app.services.event_service import EventService
from app.models.user import UserRole


def test_cannot_create_event_in_the_past(session, make_user):
    organizer = make_user(UserRole.organizer, "org@teste.local")
    service = EventService(EventRepository(session))
    data = EventCreate(
        tmdb_movie_id=603,
        local="Sala A",
        starts_at=datetime.utcnow() - timedelta(hours=1),
        price=30.0,
        format="2D",
        language="Dublado",
    )

    with pytest.raises(HTTPException) as exc_info:
        service.create_event(organizer.id, data)
    assert exc_info.value.status_code == 400


def test_can_create_event_in_the_future(session, make_user, monkeypatch):
    from app.services import event_service as event_service_module

    class FakeMovie:
        id = 603
        title = "Matrix"
        poster_path = None
        backdrop_path = None
        overview = None
        genres = []
        runtime = 120
        director = None
        cast = []
        tagline = None
        vote_average = None
        youtube_key = None

    monkeypatch.setattr(event_service_module.tmdb, "get_movie", lambda movie_id: FakeMovie())

    organizer = make_user(UserRole.organizer, "org@teste.local")
    service = EventService(EventRepository(session))
    data = EventCreate(
        tmdb_movie_id=603,
        local="Sala A",
        starts_at=datetime.utcnow() + timedelta(days=3),
        price=30.0,
        format="2D",
        language="Dublado",
    )

    result = service.create_event(organizer.id, data)
    assert result.title == "Matrix"
    assert result.status == "draft"
