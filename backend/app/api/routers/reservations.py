from fastapi import APIRouter, Depends
from sqlmodel import Session

from app.core.database import get_session
from app.core.security import require_role
from app.models.user import User, UserRole
from app.repositories.reservation_repository import ReservationRepository
from app.schemas.reservations import ReservationCreate, ReservationRead, SeatState
from app.services.reservation_service import ReservationService

router = APIRouter(tags=["reservations"])


def get_reservation_service(session: Session = Depends(get_session)) -> ReservationService:
    return ReservationService(ReservationRepository(session))


require_customer = require_role(UserRole.customer)


@router.get("/events/{event_id}/seats", response_model=list[SeatState])
def get_seat_map(
    event_id: int,
    service: ReservationService = Depends(get_reservation_service),
):
    return service.get_seat_map(event_id)


@router.post("/events/{event_id}/reservations", response_model=ReservationRead, status_code=201)
def create_reservation(
    event_id: int,
    data: ReservationCreate,
    service: ReservationService = Depends(get_reservation_service),
    user: User = Depends(require_customer),
):
    return service.create_reservation(user.id, event_id, data)


@router.post("/reservations/{reservation_id}/confirm", response_model=ReservationRead)
def confirm_payment(
    reservation_id: int,
    service: ReservationService = Depends(get_reservation_service),
    user: User = Depends(require_customer),
):
    return service.confirm_payment(user.id, reservation_id)


@router.post("/reservations/{reservation_id}/decline", response_model=ReservationRead)
def decline_payment(
    reservation_id: int,
    service: ReservationService = Depends(get_reservation_service),
    user: User = Depends(require_customer),
):
    return service.decline_payment(user.id, reservation_id)


@router.post("/reservations/{reservation_id}/cancel", response_model=ReservationRead)
def cancel_reservation(
    reservation_id: int,
    service: ReservationService = Depends(get_reservation_service),
    user: User = Depends(require_customer),
):
    return service.cancel_reservation(user.id, reservation_id)
