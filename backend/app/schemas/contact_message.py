from datetime import datetime
from typing import Literal

from sqlmodel import SQLModel

Origin = Literal["contato", "para-empresas"]


class ContactMessageCreate(SQLModel):
    name: str
    email: str
    company: str | None = None
    message: str
    origin: Origin


class ContactMessageRead(SQLModel):
    id: int
    name: str
    email: str
    company: str | None
    message: str
    origin: str
    created_at: datetime
