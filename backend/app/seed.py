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
from app.models.credential import StaffCredential
from app.models.event import Event, EventFormat, EventLanguage, EventStatus
from app.models.seat import Seat
from app.models.user import User, UserRole
from app.services.seat_layouts import ROOM_LAYOUTS

SEED_PASSWORD = "senha123"

USERS = [
    ("Organizador Teste", "organizador@teste.com", UserRole.organizer),
    ("Cliente Um", "cliente1@teste.com", UserRole.customer),
    ("Cliente Dois", "cliente2@teste.com", UserRole.customer),
    ("Portaria Teste", "portaria@teste.com", UserRole.gate),
]

# Credenciais de crachá ainda não reivindicadas — usadas para testar o
# autocadastro de organizador/portaria (o papel vem do código, não de uma
# escolha na tela). Cada uma só pode virar uma conta uma vez.
CREDENTIALS = [
    ("ORG-001", UserRole.organizer, "João"),
    ("ORG-002", UserRole.organizer, "Maria"),
    ("ORG-003", UserRole.organizer, "Julio"),
    ("GATE-001", UserRole.gate, "Ana"),
    ("GATE-002", UserRole.gate, "Bruno"),
    ("GATE-003", UserRole.gate, "Carla"),
    ("GATE-004", UserRole.gate, "Diego"),
    ("GATE-005", UserRole.gate, "Elisa"),
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


def seed_users(session: Session) -> dict[UserRole, User]:
    users: dict[UserRole, User] = {}
    for name, email, role in USERS:
        existing = session.exec(select(User).where(User.email == email)).first()
        if existing:
            users[role] = existing
            continue
        user = User(name=name, email=email, password_hash=hash_password(SEED_PASSWORD), role=role)
        session.add(user)
        session.commit()
        session.refresh(user)
        users[role] = user
        print(f"Criado usuário {role.value}: {email}")
    return users


def seed_credentials(session: Session) -> None:
    for code, role, holder_name in CREDENTIALS:
        existing = session.exec(
            select(StaffCredential).where(StaffCredential.code == code)
        ).first()
        if existing:
            continue
        session.add(StaffCredential(code=code, role=role, holder_name=holder_name))
        session.commit()
        print(f"Criada credencial {role.value}: {code} ({holder_name})")


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
        users = seed_users(session)
        seed_credentials(session)
        seed_events(session, users[UserRole.organizer])

    print("\nSeed concluído. Contas de teste (login direto):")
    for name, email, role in USERS:
        print(f"  {role.value}: {email} / {SEED_PASSWORD}")

    print("\nCrachás disponíveis pra autocadastro (organizador/portaria):")
    for code, role, holder_name in CREDENTIALS:
        print(f"  {role.value}: {code} ({holder_name})")


if __name__ == "__main__":
    seed()
