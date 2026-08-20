"""Fixtures compartilhadas dos testes.

As garantias que a gente quer provar (assento não vendido 2x, validação
única na portaria) vivem em constraints e updates atômicos do banco de
verdade — testar contra SQLite ou mocks não provaria nada, porque o índice
único parcial (`WHERE status != 'cancelled'`) é sintaxe do Postgres. Por
isso os testes rodam contra um banco Postgres de teste de verdade
(`eventos_test`, no mesmo servidor do `docker-compose.yml`), cada teste
numa transação própria que é desfeita no final.
"""

import os
from collections.abc import Iterator
from datetime import datetime, timedelta

import pytest
from sqlalchemy import create_engine, text
from sqlalchemy.engine import Engine
from sqlmodel import Session, SQLModel

# Import necessário pra registrar todas as tabelas no metadata antes do create_all.
from app.models import event as _event  # noqa: F401
from app.models import reservation as _reservation  # noqa: F401
from app.models import seat as _seat  # noqa: F401
from app.models import ticket as _ticket  # noqa: F401
from app.models import user as _user  # noqa: F401
from app.models.event import Event, EventFormat, EventLanguage, EventStatus
from app.models.reservation import Reservation, ReservationStatus
from app.models.seat import Seat
from app.models.ticket import Ticket, TicketStatus
from app.models.user import User, UserRole

TEST_DATABASE_URL = os.environ.get(
    "TEST_DATABASE_URL",
    "postgresql+psycopg2://postgres:postgres@localhost:5433/eventos_test",
)


def _ensure_database_exists(url: str) -> None:
    db_name = url.rsplit("/", 1)[-1]
    admin_url = url.rsplit("/", 1)[0] + "/postgres"
    admin_engine = create_engine(admin_url, isolation_level="AUTOCOMMIT")
    with admin_engine.connect() as conn:
        exists = conn.execute(
            text("SELECT 1 FROM pg_database WHERE datname = :name"), {"name": db_name}
        ).first()
        if not exists:
            conn.execute(text(f'CREATE DATABASE "{db_name}"'))
    admin_engine.dispose()


@pytest.fixture(scope="session")
def engine() -> Iterator[Engine]:
    _ensure_database_exists(TEST_DATABASE_URL)
    eng = create_engine(TEST_DATABASE_URL)
    SQLModel.metadata.drop_all(eng)
    SQLModel.metadata.create_all(eng)
    yield eng
    eng.dispose()


@pytest.fixture()
def session(engine: Engine) -> Iterator[Session]:
    connection = engine.connect()
    transaction = connection.begin()
    db_session = Session(bind=connection, join_transaction_mode="create_savepoint")
    try:
        yield db_session
    finally:
        db_session.close()
        transaction.rollback()
        connection.close()


# ---- Factories: montam só o que cada teste precisa, sem passar pelo TMDb. ----


@pytest.fixture()
def make_user(session: Session):
    def _make(role: UserRole, email: str, name: str = "Teste") -> User:
        user = User(name=name, email=email, password_hash="x", role=role)
        session.add(user)
        session.commit()
        session.refresh(user)
        return user

    return _make


@pytest.fixture()
def make_event(session: Session):
    def _make(
        organizer_id: int,
        *,
        starts_at: datetime | None = None,
        status: EventStatus = EventStatus.published,
        price: float = 30.0,
        local: str = "Sala A",
        title: str = "Filme de Teste",
    ) -> Event:
        event = Event(
            organizer_id=organizer_id,
            tmdb_movie_id=1,
            title=title,
            local=local,
            starts_at=starts_at or datetime.utcnow() + timedelta(days=3),
            price=price,
            format=EventFormat.format_2d,
            language=EventLanguage.dubbed,
            status=status,
        )
        session.add(event)
        session.commit()
        session.refresh(event)
        return event

    return _make


@pytest.fixture()
def make_seat(session: Session):
    def _make(event_id: int, label: str = "A1") -> Seat:
        seat = Seat(event_id=event_id, label=label, row_label=label[0], col=0)
        session.add(seat)
        session.commit()
        session.refresh(seat)
        return seat

    return _make


@pytest.fixture()
def make_reservation(session: Session):
    def _make(
        customer_id: int,
        event_id: int,
        *,
        status: ReservationStatus = ReservationStatus.paid,
        total: float = 30.0,
        expires_at: datetime | None = None,
    ) -> Reservation:
        reservation = Reservation(
            customer_id=customer_id,
            event_id=event_id,
            status=status,
            total=total,
            expires_at=expires_at or datetime.utcnow() + timedelta(minutes=10),
        )
        session.add(reservation)
        session.commit()
        session.refresh(reservation)
        return reservation

    return _make


@pytest.fixture()
def make_ticket(session: Session):
    def _make(
        reservation_id: int,
        event_id: int,
        seat_id: int,
        *,
        status: TicketStatus = TicketStatus.valid,
    ) -> Ticket:
        ticket = Ticket(
            reservation_id=reservation_id, event_id=event_id, seat_id=seat_id, status=status
        )
        session.add(ticket)
        session.commit()
        session.refresh(ticket)
        return ticket

    return _make
