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
