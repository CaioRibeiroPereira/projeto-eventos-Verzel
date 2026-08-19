import secrets

from fastapi import HTTPException, status

from app.core.security import hash_password
from app.models.user import User, UserRole
from app.repositories.user_repository import UserRepository
from app.schemas.staff import GateStaffCreate


class StaffService:
    def __init__(self, repository: UserRepository):
        self.repository = repository

    def create_gate_staff(self, organizer_id: int, data: GateStaffCreate) -> User:
        if self.repository.get_by_email(data.email):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Email já cadastrado",
            )
        user = User(
            name=data.name,
            email=data.email,
            password_hash=hash_password(data.password),
            role=UserRole.gate,
            organizer_id=organizer_id,
        )
        return self.repository.create(user)

    def list_gate_staff(self, organizer_id: int) -> list[User]:
        return self.repository.list_gate_staff(organizer_id)

    def delete_gate_staff(self, organizer_id: int, staff_id: int) -> None:
        staff = self.repository.get(staff_id)
        if not staff or staff.role != UserRole.gate or staff.organizer_id != organizer_id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Porteiro não encontrado")

        # Desativa e anonimiza em vez de apagar a linha: ticket.validated_by
        # continua íntegro pro histórico de quem validou cada ingresso.
        staff.name = "Porteiro removido"
        staff.email = f"porteiro-removido-{staff.id}-{secrets.token_hex(4)}@cineverzel.local"
        staff.password_hash = hash_password(secrets.token_urlsafe(32))
        staff.is_active = False
        self.repository.save(staff)
