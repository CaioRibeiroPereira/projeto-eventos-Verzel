"""Mapa de assentos em tempo real.

As sessões do SQLModel são síncronas (psycopg2), mas o WebSocket é
assíncrono — os services chamam `notify_seats_changed` de dentro de uma
thread de worker síncrona (FastAPI roda `def` de rota numa threadpool).
`run_coroutine_threadsafe` é a ponte: agenda o broadcast de volta na event
loop principal, capturada uma vez no startup da aplicação.

Conexões ficam em memória, agrupadas por evento. Funciona bem pra um único
processo de backend (o caso aqui); múltiplas instâncias em produção
precisariam de um pub/sub compartilhado (Redis, por exemplo) — fora de
escopo do desafio.
"""

import asyncio
from collections import defaultdict

from fastapi import WebSocket


class SeatMapBroadcaster:
    def __init__(self) -> None:
        self._connections: dict[int, set[WebSocket]] = defaultdict(set)
        self._loop: asyncio.AbstractEventLoop | None = None

    def bind_loop(self, loop: asyncio.AbstractEventLoop) -> None:
        self._loop = loop

    async def connect(self, event_id: int, websocket: WebSocket) -> None:
        await websocket.accept()
        self._connections[event_id].add(websocket)

    def disconnect(self, event_id: int, websocket: WebSocket) -> None:
        self._connections[event_id].discard(websocket)

    async def _broadcast(self, event_id: int, message: dict) -> None:
        dead: list[WebSocket] = []
        for ws in self._connections.get(event_id, ()):
            try:
                await ws.send_json(message)
            except Exception:
                dead.append(ws)
        for ws in dead:
            self._connections[event_id].discard(ws)

    def notify_seats_changed(self, event_id: int, seat_ids: list[int]) -> None:
        """Chamado de código síncrono (services), depois do commit que
        mudou a ocupação de um ou mais assentos."""
        if not seat_ids or self._loop is None or not self._connections.get(event_id):
            return
        message = {"type": "seats_changed", "seat_ids": seat_ids}
        asyncio.run_coroutine_threadsafe(self._broadcast(event_id, message), self._loop)


broadcaster = SeatMapBroadcaster()
