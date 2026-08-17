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
from app.models.event import Event, EventStatus
from app.models.seat import Seat
from app.models.user import User, UserRole

SEED_PASSWORD = "senha123"

USERS = [
    ("Organizador Teste", "organizador@teste.com", UserRole.organizer),
    ("Cliente Um", "cliente1@teste.com", UserRole.customer),
    ("Cliente Dois", "cliente2@teste.com", UserRole.customer),
    ("Portaria Teste", "portaria@teste.com", UserRole.gate),
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

ROOMS = ["Sala 1", "Sala 2", "Sala IMAX", "Sala VIP"]


def build_layout(rows: int, seats_per_row: int, aisle_after: int) -> list[dict]:
    """Gera fileiras com um corredor no meio e os dois assentos das pontas
    da última fileira (a de baixo no mapa) marcados como acessíveis."""
    layout = []
    for i in range(rows):
        label = chr(ord("A") + i)
        slots = ["seat"] * seats_per_row
        slots.insert(aisle_after, "gap")
        if i == rows - 1:
            slots[0] = "accessible"
            slots[-1] = "accessible"
        layout.append({"label": label, "slots": slots})
    return layout


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

        event = Event(
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
            local=f"Cine Verzel - {ROOMS[i % len(ROOMS)]}",
            starts_at=datetime.utcnow() + timedelta(days=(i % 7) + 1, hours=(i % 4) * 2),
            price=round(28 + (i % 5) * 6.5, 2),
            status=EventStatus.published,
        )
        session.add(event)
        session.commit()
        session.refresh(event)

        layout = build_layout(rows=6, seats_per_row=10, aisle_after=5)
        seats = []
        for row in layout:
            seat_number = 0
            for col, kind in enumerate(row["slots"]):
                if kind == "gap":
                    continue
                seat_number += 1
                seats.append(
                    Seat(
                        event_id=event.id,
                        label=f"{row['label']}{seat_number}",
                        row_label=row["label"],
                        col=col,
                        accessible=kind == "accessible",
                    )
                )
        session.add_all(seats)
        session.commit()
        print(f"Criado evento publicado: {movie.title} ({len(seats)} assentos)")


def seed() -> None:
    with Session(engine) as session:
        users = seed_users(session)
        seed_events(session, users[UserRole.organizer])

    print("\nSeed concluído. Credenciais de teste:")
    for name, email, role in USERS:
        print(f"  {role.value}: {email} / {SEED_PASSWORD}")


if __name__ == "__main__":
    seed()
