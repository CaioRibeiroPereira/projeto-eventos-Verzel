"""Planta fixa de cada sala. Cada sala tem sua própria estrutura (fileiras
x assentos), e os 4 assentos das pontas da primeira fileira são sempre
reservados pra cadeirante — o organizador não desenha o mapa, só escolhe
a sala."""

from app.schemas.events import SeatRowInput

# nome da sala -> (fileiras, assentos por fileira, posição do corredor)
ROOM_CONFIG: dict[str, tuple[int, int, int]] = {
    "Sala A": (6, 10, 5),
    "Sala B": (8, 12, 6),
    "Sala C": (5, 8, 4),
    "Sala D": (6, 10, 5),
    "Sala E": (7, 10, 5),
    "Sala F": (4, 6, 3),
}


def _build_layout(rows: int, seats_per_row: int, aisle_after: int) -> list[SeatRowInput]:
    layout: list[SeatRowInput] = []
    for i in range(rows):
        label = chr(ord("A") + i)
        slots: list[str] = ["seat"] * seats_per_row
        slots.insert(aisle_after, "gap")
        if i == 0:
            slots[0] = "accessible"
            slots[1] = "accessible"
            slots[-2] = "accessible"
            slots[-1] = "accessible"
        layout.append(SeatRowInput(label=label, slots=slots))
    return layout


ROOM_LAYOUTS: dict[str, list[SeatRowInput]] = {
    name: _build_layout(*config) for name, config in ROOM_CONFIG.items()
}
