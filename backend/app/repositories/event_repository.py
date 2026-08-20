from datetime import date, datetime

from sqlmodel import Session, delete, func, select

from app.models.event import Event, EventStatus
from app.models.reservation import Reservation, ReservationStatus
from app.models.seat import Seat
from app.models.ticket import Ticket, TicketStatus
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

    def seats_sold(self, event_id: int) -> int:
        return self.session.exec(
            select(func.count())
            .select_from(Ticket)
            .join(Reservation, Ticket.reservation_id == Reservation.id)
            .where(
                Ticket.event_id == event_id,
                Ticket.status != TicketStatus.cancelled,
                Reservation.status == ReservationStatus.paid,
            )
        ).one()

    def list_active_in_room(self, organizer_id: int, local: str) -> list[Event]:
        """Eventos não cancelados do organizador nessa sala — usado pra
        checar conflito de horário na criação de uma sessão nova."""
        return list(
            self.session.exec(
                select(Event).where(
                    Event.organizer_id == organizer_id,
                    Event.local == local,
                    Event.status != EventStatus.cancelled,
                )
            )
        )

    def list_by_organizer(self, organizer_id: int) -> list[Event]:
        return list(
            self.session.exec(
                select(Event)
                .where(Event.organizer_id == organizer_id)
                .order_by(Event.starts_at)
            )
        )

    def list_published(self, filters: EventFilters) -> list[Event]:
        query = select(Event).where(
            Event.status == EventStatus.published, Event.starts_at > datetime.utcnow()
        )

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

    def list_sessions(self, event: Event) -> list[Event]:
        """Outras sessões do mesmo organizador, filme, sala, formato e
        idioma — usado pra agrupar horários na página do filme. Trava por
        organizador pra sessões de organizadores diferentes não se
        misturarem só por usarem o nome de sala."""
        return list(
            self.session.exec(
                select(Event)
                .where(
                    Event.organizer_id == event.organizer_id,
                    Event.tmdb_movie_id == event.tmdb_movie_id,
                    Event.local == event.local,
                    Event.format == event.format,
                    Event.language == event.language,
                    Event.status == EventStatus.published,
                    Event.starts_at > datetime.utcnow(),
                )
                .order_by(Event.starts_at)
            )
        )

    def publish(self, event: Event) -> Event:
        event.status = EventStatus.published
        self.session.add(event)
        self.session.commit()
        self.session.refresh(event)
        return event

    def cancel_with_active_reservations(self, event: Event) -> tuple[int, list[int]]:
        """Cancela o evento e, na mesma transação, cancela toda reserva paga
        ou aguardando pagamento na portaria (e seus tickets) desse evento —
        a sessão não vai mais acontecer, os ingressos deixam de valer.
        Retorna quantas reservas foram afetadas e os ids dos assentos
        liberados (pro broadcast do mapa em tempo real)."""
        event.status = EventStatus.cancelled
        self.session.add(event)

        reservations = list(
            self.session.exec(
                select(Reservation).where(
                    Reservation.event_id == event.id,
                    Reservation.status.in_(
                        [ReservationStatus.paid, ReservationStatus.awaiting_door_payment]
                    ),
                )
            )
        )
        freed_seat_ids: list[int] = []
        for reservation in reservations:
            reservation.status = ReservationStatus.cancelled
            self.session.add(reservation)
            tickets = self.session.exec(
                select(Ticket).where(Ticket.reservation_id == reservation.id)
            )
            for ticket in tickets:
                ticket.status = TicketStatus.cancelled
                self.session.add(ticket)
                freed_seat_ids.append(ticket.seat_id)

        self.session.commit()
        self.session.refresh(event)
        return len(reservations), freed_seat_ids

    def delete(self, event: Event) -> None:
        """Apaga o evento de vez — só chamado depois que o service já
        garantiu que ele está cancelado (nenhuma reserva ativa pendurada
        nele). Reservas/tickets de um evento cancelado já foram todos
        marcados cancelled, mas as linhas continuam no banco; apagar
        precisa limpar elas primeiro por causa da FK."""
        self.session.execute(delete(Ticket).where(Ticket.event_id == event.id))
        self.session.execute(delete(Reservation).where(Reservation.event_id == event.id))
        self.session.execute(delete(Seat).where(Seat.event_id == event.id))
        self.session.delete(event)
        self.session.commit()
