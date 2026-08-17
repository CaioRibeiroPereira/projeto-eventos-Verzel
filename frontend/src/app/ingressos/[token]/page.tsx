"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { TicketCard } from "@/components/ticket-card";
import { ApiError, getSharedTicket, type Ticket } from "@/lib/api";

export default function IngressoCompartilhadoPage() {
  const { token } = useParams<{ token: string }>();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getSharedTicket(token)
      .then(setTicket)
      .catch((err) =>
        setError(err instanceof ApiError ? err.message : "Não foi possível carregar o ingresso."),
      );
  }, [token]);

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-6 px-6 py-10">
      <h1 className="movie-title !text-2xl">Ingresso</h1>
      {error && <p className="label text-red">{error}</p>}
      {!ticket && !error && <p className="label">Carregando...</p>}
      {ticket && <TicketCard ticket={ticket} />}
    </main>
  );
}
