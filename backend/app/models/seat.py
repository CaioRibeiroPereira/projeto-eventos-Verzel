from sqlmodel import Field, SQLModel, UniqueConstraint


class Seat(SQLModel, table=True):
    __table_args__ = (UniqueConstraint("event_id", "label"),)

    id: int | None = Field(default=None, primary_key=True)
    event_id: int = Field(foreign_key="event.id")

    label: str
    row_label: str
    col: int
    """Índice do slot dentro da fileira (0-based), incluindo corredores —
    permite reconstruir o layout visual com os mesmos vãos no mapa de assentos."""
    accessible: bool = False
