from sqlmodel import Session, select

from app.models.user import User, UserRole


class UserRepository:
    def __init__(self, session: Session):
        self.session = session

    def get(self, user_id: int) -> User | None:
        return self.session.get(User, user_id)

    def get_by_email(self, email: str) -> User | None:
        return self.session.exec(select(User).where(User.email == email)).first()

    def create(self, user: User) -> User:
        self.session.add(user)
        self.session.commit()
        self.session.refresh(user)
        return user

    def save(self, user: User) -> User:
        self.session.add(user)
        self.session.commit()
        self.session.refresh(user)
        return user

    def list_gate_staff(self, organizer_id: int) -> list[User]:
        return list(
            self.session.exec(
                select(User).where(
                    User.role == UserRole.gate,
                    User.organizer_id == organizer_id,
                    User.is_active == True,  # noqa: E712 — comparação de coluna SQLModel, não booleano Python
                )
            )
        )
