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
