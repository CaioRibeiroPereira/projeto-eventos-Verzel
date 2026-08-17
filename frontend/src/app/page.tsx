"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/auth-context";
import { listPublicEvents, posterUrl, type Event, type EventFilters } from "@/lib/api";
import { formatDateTime, formatPrice } from "@/lib/format";

const ROLE_HOME: Record<string, string> = {
  organizer: "/organizador",
  customer: "/cliente",
  gate: "/portaria",
};

export default function Home() {
  const { user, logout, loading } = useAuth();
  const [filters, setFilters] = useState<EventFilters>({});
  const [draft, setDraft] = useState<EventFilters>({});
  const [events, setEvents] = useState<Event[] | null>(null);

  useEffect(() => {
    listPublicEvents(filters).then(setEvents);
  }, [filters]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setFilters(draft);
  }

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-6 py-10">
      <div className="flex items-center justify-between">
        <h1 className="movie-title !text-2xl">Eventos em cartaz</h1>
        {!loading &&
          (user ? (
            <div className="flex items-center gap-3">
              <Link href={ROLE_HOME[user.role]} className="label text-accent">
                {user.name}
              </Link>
              <button onClick={logout} className="caption text-text-secondary hover:text-accent">
                Sair
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Link
                href="/login"
                className="rounded bg-accent px-4 py-2 text-sm font-medium text-on-accent hover:bg-accent-hover"
              >
                Entrar
              </Link>
              <Link
                href="/registro"
                className="rounded border border-border px-4 py-2 text-sm text-text-secondary hover:border-accent hover:text-accent"
              >
                Criar conta
              </Link>
            </div>
          ))}
      </div>

      <form onSubmit={handleSearch} className="flex flex-wrap gap-2">
        <input
          placeholder="Buscar por título..."
          value={draft.q ?? ""}
          onChange={(e) => setDraft({ ...draft, q: e.target.value || undefined })}
          className="flex-1 rounded border border-border bg-surface-2 px-3 py-2 text-sm text-text outline-none focus:border-accent"
        />
        <input
          placeholder="Local"
          value={draft.local ?? ""}
          onChange={(e) => setDraft({ ...draft, local: e.target.value || undefined })}
          className="w-40 rounded border border-border bg-surface-2 px-3 py-2 text-sm text-text outline-none focus:border-accent"
        />
        <input
          type="date"
          value={draft.date ?? ""}
          onChange={(e) => setDraft({ ...draft, date: e.target.value || undefined })}
          className="rounded border border-border bg-surface-2 px-3 py-2 text-sm text-text outline-none focus:border-accent"
        />
        <input
          type="number"
          min={0}
          placeholder="Preço máx."
          value={draft.price_max ?? ""}
          onChange={(e) =>
            setDraft({ ...draft, price_max: e.target.value ? Number(e.target.value) : undefined })
          }
          className="w-28 rounded border border-border bg-surface-2 px-3 py-2 text-sm text-text outline-none focus:border-accent"
        />
        <button
          type="submit"
          className="rounded bg-accent px-4 py-2 text-sm font-medium text-on-accent hover:bg-accent-hover"
        >
          Buscar
        </button>
      </form>

      {events === null && <p className="label">Carregando...</p>}
      {events?.length === 0 && (
        <p className="label">Nenhum evento encontrado.</p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {events?.map((event) => (
          <Link
            key={event.id}
            href={`/eventos/${event.id}`}
            className="flex gap-4 rounded-lg border border-border bg-surface-1 p-4 hover:border-accent"
          >
            {posterUrl(event.poster_path, "w185") && (
              <img
                src={posterUrl(event.poster_path, "w185")!}
                alt={event.title}
                className="h-32 w-24 rounded object-cover"
              />
            )}
            <div className="flex flex-col gap-1">
              <h2 className="text-lg font-medium">{event.title}</h2>
              <p className="label">{event.local}</p>
              <p className="label">{formatDateTime(event.starts_at)}</p>
              <p className="label">{formatPrice(event.price)}</p>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
