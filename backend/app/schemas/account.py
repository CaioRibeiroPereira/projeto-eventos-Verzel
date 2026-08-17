from datetime import datetime

from sqlmodel import SQLModel


class UpdateProfileRequest(SQLModel):
    name: str
    email: str


class ChangePasswordRequest(SQLModel):
    current_password: str
    new_password: str


class AddCardRequest(SQLModel):
    number: str
    holder_name: str
    expiry: str


class CardRead(SQLModel):
    id: int
    brand: str
    last4: str
    holder_name: str
    expiry: str
    created_at: datetime
