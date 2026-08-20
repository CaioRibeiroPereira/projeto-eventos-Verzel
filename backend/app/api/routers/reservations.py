from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect
from sqlmodel import Session

from app.core.database import get_session
from app.core.security import require_role
from app.core.ws import broadcaster
from app.models.user import User, UserRole
from app.repositories.reservation_repository import ReservationRepository
from app.schemas.reservations import ReservationCreate, ReservationRead, SeatState
from app.services.reservation_service import ReservationService

router = APIRouter(tags=["reservations"])


@router.websocket("/ws/events/{event_id}/seats")
async def seat_map_updates(websocket: WebSocket, event_id: int):
    """Avisa quem está com o mapa de assentos aberto quando algum lugar
    muda de ocupação — o cliente reage buscando o mapa atualizado de novo,
    esse socket só carrega o aviso ("mudou algo"), não o estado inteiro."""
    await broadcaster.connect(event_id, websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        broadcaster.disconnect(event_id, websocket)


def get_reservation_service(session: Session = Depends(get_session)) -> ReservationService:
    return ReservationService(ReservationRepository(session))


require_customer = require_role(UserRole.customer)


@router.get("/events/{event_id}/seats", response_model=list[SeatState])
def get_seat_map(
    event_id: int,
    service: ReservationService = Depends(get_reservation_service),
):
    return service.get_seat_map(event_id)


@router.get("/events/{event_id}/reservations/pending", response_model=list[ReservationRead])
def get_my_pending_reservations(
    event_id: int,
    service: ReservationService = Depends(get_reservation_service),
    user: User = Depends(require_customer),
):
    """Reservas do próprio cliente nesse evento que ainda estão `pending`
    (abriu o checkout, não pagou nem recusou) — pra ele ver e cancelar em
    vez de ficar preso, sem saber, até os 10 minutos de espera passarem."""
    return service.get_my_pending_reservations(user.id, event_id)


@router.post("/events/{event_id}/reservations", response_model=ReservationRead, status_code=201)
def create_reservation(
    event_id: int,
    data: ReservationCreate,
    service: ReservationService = Depends(get_reservation_service),
    user: User = Depends(require_customer),
):
    return service.create_reservation(user.id, event_id, data)


@router.post("/reservations/{reservation_id}/pay-at-door", response_model=ReservationRead)
def pay_at_door(
    reservation_id: int,
    service: ReservationService = Depends(get_reservation_service),
    user: User = Depends(require_customer),
):
    return service.pay_at_door(user.id, reservation_id)


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
