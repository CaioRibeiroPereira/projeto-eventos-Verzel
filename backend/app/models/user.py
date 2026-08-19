from enum import Enum

from sqlmodel import Field, SQLModel


class UserRole(str, Enum):
    organizer = "organizer"
    customer = "customer"
    gate = "gate"


class User(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    name: str
    email: str = Field(unique=True, index=True)
    password_hash: str
    role: UserRole
    is_active: bool = True
    # Só preenchido pra role=gate: qual organizador cadastrou esse porteiro.
    organizer_id: int | None = Field(default=None, foreign_key="user.id")
