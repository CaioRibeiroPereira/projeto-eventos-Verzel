from fastapi import APIRouter, Depends
from sqlmodel import Session

from app.core.database import get_session
from app.core.security import require_role
from app.models.user import User, UserRole
from app.repositories.user_repository import UserRepository
from app.schemas.staff import GateStaffCreate, GateStaffRead
from app.services.staff_service import StaffService

router = APIRouter(prefix="/organizador/porteiros", tags=["staff"])

require_organizer = require_role(UserRole.organizer)


def get_staff_service(session: Session = Depends(get_session)) -> StaffService:
    return StaffService(UserRepository(session))


@router.get("", response_model=list[GateStaffRead])
def list_gate_staff(
    service: StaffService = Depends(get_staff_service),
    _: User = Depends(require_organizer),
):
    return service.list_gate_staff()


@router.post("", response_model=GateStaffRead, status_code=201)
def create_gate_staff(
    data: GateStaffCreate,
    service: StaffService = Depends(get_staff_service),
    user: User = Depends(require_organizer),
):
    return service.create_gate_staff(user.id, data)


@router.delete("/{staff_id}", status_code=204)
def delete_gate_staff(
    staff_id: int,
    service: StaffService = Depends(get_staff_service),
    _: User = Depends(require_organizer),
):
    service.delete_gate_staff(staff_id)
