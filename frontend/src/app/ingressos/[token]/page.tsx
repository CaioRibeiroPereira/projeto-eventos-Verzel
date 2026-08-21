"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ApiError, getSharedTicket, posterUrl, type SharedTicket } from "@/lib/api";
import { formatDateTime } from "@/lib/format";

const STATUS_LABEL: Record<SharedTicket["status"], string> = {
  valid: "Válido",
  used: "Utilizado",
  cancelled: "Cancelado",
};

export default function IngressoCompartilhadoPage() {
  const { token } = useParams<{ token: string }>();
  const [ticket, setTicket] = useState<SharedTicket | null>(null);
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

      {ticket && (
        <div className="flex gap-4 rounded-lg border border-border bg-surface-1 p-5">
          {posterUrl(ticket.event_poster_path, "w185") && (
            <img
              src={posterUrl(ticket.event_poster_path, "w185")!}
              alt={ticket.event_title}
              className="h-40 w-28 shrink-0 rounded object-cover"
            />
          )}
          <div className="flex flex-col gap-1">
            <h2 className="text-lg font-medium">{ticket.event_title}</h2>
            <p className="label">{ticket.event_local}</p>
            <p className="label">{formatDateTime(ticket.event_starts_at)}</p>
            <p className="ticket-code">Assento {ticket.seat_label}</p>
            <span
              className={`caption mt-1 inline-block w-fit rounded px-2 py-0.5 ${
                ticket.status === "valid"
                  ? ticket.awaiting_door_payment
                    ? "bg-bg-warning text-text-warning"
                    : "bg-bg-success text-text-success"
                  : ticket.status === "used"
                    ? "bg-surface-3 text-text-secondary"
                    : "bg-bg-danger text-text-danger"
              }`}
            >
              {ticket.status === "valid" && ticket.awaiting_door_payment
                ? "Aguardando pagamento na entrada"
                : STATUS_LABEL[ticket.status]}
            </span>
            <p className="caption mt-2 text-text-muted">
              Este link só mostra os dados do ingresso — o QR e o código de entrada ficam visíveis
              apenas pra quem está logado como o dono da compra, em &quot;Meus ingressos&quot;.
            </p>
          </div>
        </div>
      )}
    </main>
  );
}
