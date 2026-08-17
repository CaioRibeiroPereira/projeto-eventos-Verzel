from datetime import datetime

from sqlmodel import Field, SQLModel


class PaymentCard(SQLModel, table=True):
    """Cartão salvo do usuário. Guarda só o necessário para exibir e
    identificar o cartão — nunca o número completo nem o CVV, mesmo o
    pagamento sendo simulado (mesma prática de um sistema real)."""

    id: int | None = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id")

    brand: str
    last4: str
    holder_name: str
    expiry: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
