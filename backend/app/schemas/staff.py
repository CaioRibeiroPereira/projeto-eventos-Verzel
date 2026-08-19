from sqlmodel import SQLModel


class GateStaffCreate(SQLModel):
    name: str
    email: str
    password: str


class GateStaffRead(SQLModel):
    id: int
    name: str
    email: str
    is_active: bool
