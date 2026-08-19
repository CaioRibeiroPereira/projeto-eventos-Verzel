"""Popula o banco com usuários de teste e eventos publicados variados.

Idempotente: roda de novo sem duplicar usuários, e pula a criação de
eventos se o organizador de seed já tiver algum.

Uso: python -m app.seed
"""

from datetime import datetime, timedelta

from sqlmodel import Session, select

from app.core.database import engine
from app.core.security import hash_password
from app.integrations import tmdb
from app.models.event import Event, EventFormat, EventLanguage, EventStatus
from app.models.seat import Seat
from app.models.user import User, UserRole
from app.services.seat_layouts import ROOM_LAYOUTS

SEED_PASSWORD = "senha123"

# Organizador não tem mais autocadastro — só existe via seed/banco. Dois
# organizadores pra deixar claro que o sistema é multi-organizador.
ORGANIZERS = [
    ("Organizador Um", "organizador@teste.com"),
    ("Organizador Dois", "organizador2@teste.com"),
]

CUSTOMERS = [
    ("Cliente Um", "cliente1@teste.com"),
    ("Cliente Dois", "cliente2@teste.com"),
]

# Porteiro não tem mais autocadastro por código — é cadastrado pelo
# organizador no próprio painel. Este aqui fica vinculado ao primeiro
# organizador, só pra já existir uma conta de portaria pronta pra login.
GATE_STAFF = [
    ("Portaria Teste", "portaria@teste.com"),
]

MOVIES = [
    "Matrix",
    "Interestelar",
    "Duna: Parte Dois",
    "Duna",
    "Oppenheimer",
    "Barbie",
    "John Wick 4: Baba Yaga",
    "Homem-Aranha: Através do Aranhaverso",
    "Homem-Aranha: Sem Volta Para Casa",
    "Divertida Mente 2",
    "Coringa: Delírio a Dois",
    "Wicked",
    "Vingadores: Ultimato",
    "Toy Story 4",
    "Frozen 2",
    "Deadpool e Wolverine",
    "Coco",
    "O Rei Leão",
    "Pantera Negra",
]

ROOMS = ["Sala A", "Sala B", "Sala C", "Sala D", "Sala E", "Sala F"]

FORMATS = [EventFormat.format_2d, EventFormat.format_2d, EventFormat.format_3d]
LANGUAGES = [EventLanguage.dubbed, EventLanguage.subtitled]


def _get_or_create_user(session: Session, name: str, email: str, role: UserRole, organizer_id: int | None = None) -> User:
    existing = session.exec(select(User).where(User.email == email)).first()
    if existing:
        return existing
    user = User(
        name=name,
        email=email,
        password_hash=hash_password(SEED_PASSWORD),
        role=role,
        organizer_id=organizer_id,
    )
    session.add(user)
    session.commit()
    session.refresh(user)
    print(f"Criado usuário {role.value}: {email}")
    return user


def seed_users(session: Session) -> list[User]:
    organizers = [_get_or_create_user(session, name, email, UserRole.organizer) for name, email in ORGANIZERS]
    for name, email in CUSTOMERS:
        _get_or_create_user(session, name, email, UserRole.customer)
    for name, email in GATE_STAFF:
        _get_or_create_user(session, name, email, UserRole.gate, organizer_id=organizers[0].id)
    return organizers


def _build_event(
    organizer: User,
    movie,
    local: str,
    starts_at: datetime,
    price: float,
    format: EventFormat,
    language: EventLanguage,
) -> Event:
    return Event(
        organizer_id=organizer.id,
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
        local=local,
        starts_at=starts_at,
        price=price,
        format=format,
        language=language,
        status=EventStatus.published,
    )


def _create_seats(session: Session, event_id: int, local: str) -> int:
    layout = ROOM_LAYOUTS[local]
    seats = []
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
    session.add_all(seats)
    session.commit()
    return len(seats)


def seed_events(session: Session, organizer: User) -> None:
    already = session.exec(select(Event).where(Event.organizer_id == organizer.id)).first()
    if already:
        print("Organizador de seed já tem eventos, pulando criação de eventos.")
        return

    for i, title in enumerate(MOVIES):
        results = tmdb.search_movies(title)
        if not results:
            print(f"Filme não encontrado no TMDb: {title}")
            continue
        movie = tmdb.get_movie(results[0].id)

        local = ROOMS[i % len(ROOMS)]
        format = FORMATS[i % len(FORMATS)]
        language = LANGUAGES[i % len(LANGUAGES)]
        price = round(28 + (i % 5) * 6.5, 2)

        starts_at = (datetime.utcnow() + timedelta(days=(i % 7) + 1)).replace(
            hour=14 + (i % 4) * 2, minute=0, second=0, microsecond=0
        )

        event = _build_event(organizer, movie, local, starts_at, price, format, language)
        session.add(event)
        session.commit()
        session.refresh(event)
        seat_count = _create_seats(session, event.id, local)
        print(
            f"Criado evento publicado: {movie.title} {format.value} {language.value} "
            f"{starts_at:%d/%m %H:%M} ({seat_count} assentos)"
        )


def seed() -> None:
    with Session(engine) as session:
        organizers = seed_users(session)
        seed_events(session, organizers[0])

    print("\nSeed concluído. Contas de teste (login direto):")
    for name, email in ORGANIZERS:
        print(f"  organizer: {email} / {SEED_PASSWORD}")
    for name, email in CUSTOMERS:
        print(f"  customer: {email} / {SEED_PASSWORD}")
    for name, email in GATE_STAFF:
        print(f"  gate: {email} / {SEED_PASSWORD}")


if __name__ == "__main__":
    seed()
