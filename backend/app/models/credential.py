from datetime import datetime

from sqlmodel import Field, SQLModel

from app.models.user import UserRole


class StaffCredential(SQLModel, table=True):
    """Credencial de crachá pré-cadastrada. Organizador e portaria não se
    autocadastram escolhendo o papel — o código da credencial já diz qual é
    o papel, e cada código só pode ser usado uma vez."""

    id: int | None = Field(default=None, primary_key=True)
    code: str = Field(unique=True, index=True)
    role: UserRole
    holder_name: str
    used_by_user_id: int | None = Field(default=None, foreign_key="user.id")
    used_at: datetime | None = None
