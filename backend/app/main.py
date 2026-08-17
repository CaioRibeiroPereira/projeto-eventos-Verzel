from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routers import account, auth, events, gate, reservations, tickets

app = FastAPI(title="Plataforma de Eventos e Ingressos")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(events.router)
app.include_router(reservations.router)
app.include_router(tickets.router)
app.include_router(gate.router)
app.include_router(account.router)


@app.get("/health")
def health():
    return {"status": "ok"}
