from fastapi import APIRouter, Depends
from sqlmodel import Session

from app.core.database import get_session
from app.core.security import require_role
from app.models.user import User, UserRole
from app.repositories.gate_repository import GateRepository
from app.schemas.gate import ValidateRequest, ValidationResult
from app.services.gate_service import GateService

router = APIRouter(tags=["gate"])


def get_gate_service(session: Session = Depends(get_session)) -> GateService:
    return GateService(GateRepository(session))


require_gate = require_role(UserRole.gate)


@router.post("/gate/validate", response_model=ValidationResult)
def validate_ticket(
    data: ValidateRequest,
    service: GateService = Depends(get_gate_service),
    user: User = Depends(require_gate),
):
    return service.validate(data, user.id)


@router.post("/gate/collect-payment", response_model=ValidationResult)
def collect_door_payment(
    data: ValidateRequest,
    service: GateService = Depends(get_gate_service),
    user: User = Depends(require_gate),
):
    return service.collect_door_payment(data, user.id)


@router.post("/gate/undo", response_model=ValidationResult)
def undo_validation(
    data: ValidateRequest,
    service: GateService = Depends(get_gate_service),
    user: User = Depends(require_gate),
):
    return service.undo_validation(data)
