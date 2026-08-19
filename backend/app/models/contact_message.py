from datetime import datetime

from sqlmodel import Field, SQLModel


class ContactMessage(SQLModel, table=True):
    """Mensagem enviada pelos formulários de contato (página de contato e
    de para-empresas). Visível pra qualquer organizador."""

    id: int | None = Field(default=None, primary_key=True)
    name: str
    email: str
    company: str | None = None
    message: str
    origin: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
