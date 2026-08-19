from datetime import datetime
from typing import Literal

from sqlmodel import SQLModel

ValidationOutcome = Literal["valid", "invalid", "already_used", "wrong_event"]


class ValidateRequest(SQLModel):
    code: str
    event_ids: list[int]


class ValidationResult(SQLModel):
    result: ValidationOutcome
    message: str
    seat_label: str | None = None
    event_title: str | None = None
    used_at: datetime | None = None
