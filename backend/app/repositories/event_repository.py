from datetime import date, datetime

from sqlmodel import Session, func, select

from app.models.event import Event, EventStatus
from app.models.seat import Seat
from app.schemas.events import EventFilters


class EventRepository:
    def __init__(self, session: Session):
        self.session = session

    def create(self, event: Event) -> Event:
        self.session.add(event)
        self.session.commit()
        self.session.refresh(event)
        return event

    def add_seats(self, seats: list[Seat]) -> None:
        self.session.add_all(seats)
        self.session.commit()

    def get(self, event_id: int) -> Event | None:
        return self.session.get(Event, event_id)

    def seat_count(self, event_id: int) -> int:
        return self.session.exec(
            select(func.count()).select_from(Seat).where(Seat.event_id == event_id)
        ).one()

    def list_by_organizer(self, organizer_id: int) -> list[Event]:
        return list(
            self.session.exec(
                select(Event)
                .where(Event.organizer_id == organizer_id)
                .order_by(Event.starts_at)
            )
        )

    def list_published(self, filters: EventFilters) -> list[Event]:
        query = select(Event).where(Event.status == EventStatus.published)

        if filters.q:
            query = query.where(Event.title.ilike(f"%{filters.q}%"))
        if filters.local:
            query = query.where(Event.local.ilike(f"%{filters.local}%"))
        if filters.price_max is not None:
            query = query.where(Event.price <= filters.price_max)
        if filters.date:
            day = date.fromisoformat(filters.date)
            start = datetime.combine(day, datetime.min.time())
            end = datetime.combine(day, datetime.max.time())
            query = query.where(Event.starts_at.between(start, end))

        query = query.order_by(Event.starts_at)
        return list(self.session.exec(query))

    def publish(self, event: Event) -> Event:
        event.status = EventStatus.published
        self.session.add(event)
        self.session.commit()
        self.session.refresh(event)
        return event
