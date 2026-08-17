"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/auth-context";
import { backdropUrl, getPublicEvent, posterUrl, type Event } from "@/lib/api";
import { formatDateTime, formatPrice } from "@/lib/format";

export default function EventoPage() {
  const { id } = useParams<{ id: string }>();
  const eventId = Number(id);
  const { user, loading } = useAuth();
  const [event, setEvent] = useState<Event | null>(null);

  useEffect(() => {
    getPublicEvent(eventId).then(setEvent);
  }, [eventId]);

  if (!event) {
    return (
      <main className="flex flex-1 items-center justify-center">
        <p className="label">Carregando...</p>
      </main>
    );
  }

  const reservarHref = `/eventos/${eventId}/reservar`;
  const soldOut = event.seat_count === 0;

  return (
    <main className="flex flex-1 flex-col">
      <section className="relative flex min-h-[320px] items-end overflow-hidden border-b border-border">
        {backdropUrl(event.backdrop_path) && (
          <img
            src={backdropUrl(event.backdrop_path)!}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
        )}
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(180deg, rgba(18,16,14,0.25) 0%, var(--color-bg) 92%)",
          }}
        />
        <div className="relative mx-auto flex w-full max-w-3xl gap-4 px-6 py-6">
          {posterUrl(event.poster_path, "w185") && (
            <img
              src={posterUrl(event.poster_path, "w185")!}
              alt={event.title}
              className="h-48 w-32 shrink-0 rounded object-cover shadow-lg"
            />
          )}
          <div className="flex flex-col gap-1">
            <h1 className="movie-title">{event.title}</h1>
            {event.genres && <p className="label">{event.genres}</p>}
            <p className="label">
              {event.local} — {formatDateTime(event.starts_at)}
            </p>
            <p className="label">
              {formatPrice(event.price)}
              {event.runtime_minutes ? ` — ${event.runtime_minutes} min` : ""}
            </p>
          </div>
        </div>
      </section>

      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-6 py-10">
        {event.overview && (
          <div className="flex flex-col gap-2">
            <h2 className="text-lg font-medium">Sobre o filme</h2>
            <p className="label leading-relaxed">{event.overview}</p>
          </div>
        )}

        <div className="flex flex-col items-start gap-2 rounded-lg border border-border bg-surface-1 p-5">
          <p className="label">
            {soldOut ? "Sem assentos disponíveis." : `${event.seat_count} assentos disponíveis.`}
          </p>

          {soldOut ? (
            <span className="rounded bg-surface-3 px-5 py-2 text-text-muted">Esgotado</span>
          ) : loading ? null : !user ? (
            <Link
              href={`/login?next=${encodeURIComponent(reservarHref)}`}
              className="rounded bg-accent px-5 py-2 font-medium text-on-accent hover:bg-accent-hover"
            >
              Entrar para comprar
            </Link>
          ) : user.role !== "customer" ? (
            <p className="caption">Disponível apenas para contas de cliente.</p>
          ) : (
            <Link
              href={reservarHref}
              className="rounded bg-accent px-5 py-2 font-medium text-on-accent hover:bg-accent-hover"
            >
              Comprar ingresso
            </Link>
          )}
        </div>
      </div>
    </main>
  );
}
