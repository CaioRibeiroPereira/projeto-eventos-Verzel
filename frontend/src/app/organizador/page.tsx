"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRoleGuard } from "@/hooks/use-role-guard";
import { listMyEvents, publishEvent, posterUrl, type Event } from "@/lib/api";
import { formatDateTime, formatPrice } from "@/lib/format";

export default function OrganizadorPage() {
  const { ready } = useRoleGuard("organizer");
  return ready ? <Dashboard /> : null;
}

type SortBy = "starts_at" | "created_at";

function Dashboard() {
  const { user, token } = useRoleGuard("organizer");
  const [events, setEvents] = useState<Event[] | null>(null);
  const [publishingId, setPublishingId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortBy>("starts_at");

  const load = useCallback(() => {
    if (!token) return;
    listMyEvents(token).then(setEvents);
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  async function handlePublish(id: number) {
    if (!token) return;
    setPublishingId(id);
    try {
      await publishEvent(token, id);
      load();
    } finally {
      setPublishingId(null);
    }
  }

  const visibleEvents = (events ?? [])
    .filter((e) => e.title.toLowerCase().includes(search.trim().toLowerCase()))
    .sort((a, b) => new Date(b[sortBy]).getTime() - new Date(a[sortBy]).getTime());

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-6 py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="movie-title !text-2xl">Meus eventos</h1>
          <p className="label">Olá, {user!.name}</p>
        </div>
        <Link
          href="/organizador/eventos/novo"
          className="rounded bg-accent px-4 py-2 font-medium text-on-accent hover:bg-accent-hover"
        >
          Criar evento
        </Link>
      </div>

      {events && events.length > 0 && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <input
            type="search"
            placeholder="Buscar por nome do filme..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded border border-border bg-surface-2 px-3 py-2 text-text outline-none focus:border-accent sm:max-w-xs"
          />
          <div className="flex shrink-0 items-center gap-2">
            <span className="label">Ordenar por</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortBy)}
              className="rounded border border-border bg-surface-2 px-3 py-2 text-sm text-text outline-none focus:border-accent"
            >
              <option value="starts_at">Data de exibição</option>
              <option value="created_at">Data de criação</option>
            </select>
          </div>
        </div>
      )}

      {events === null && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {[0, 1].map((i) => (
            <div key={i} className="h-40 animate-pulse rounded-lg border border-border bg-surface-1" />
          ))}
        </div>
      )}

      {events?.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border py-16 text-center">
          <p className="label">Nenhum evento ainda.</p>
          <Link
            href="/organizador/eventos/novo"
            className="rounded bg-accent px-4 py-2 text-sm font-medium text-on-accent hover:bg-accent-hover"
          >
            Criar o primeiro
          </Link>
        </div>
      )}

      {events && events.length > 0 && visibleEvents.length === 0 && (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border py-16 text-center">
          <p className="label">Nenhum evento encontrado pra &quot;{search}&quot;.</p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {visibleEvents.map((event) => (
          <div
            key={event.id}
            className="flex gap-4 overflow-hidden rounded-lg border border-border bg-surface-1 p-4 transition-colors hover:border-border-strong"
          >
            {posterUrl(event.poster_path, "w185") && (
              <img
                src={posterUrl(event.poster_path, "w185")!}
                alt={event.title}
                className="h-32 w-24 shrink-0 rounded object-cover"
              />
            )}
            <div className="flex flex-1 flex-col gap-1">
              <h2 className="text-lg font-medium">{event.title}</h2>
              <p className="label">{event.local}</p>
              <p className="label">{formatDateTime(event.starts_at)}</p>
              <p className="label">{formatPrice(event.price)}</p>
              <p className="caption">
                {event.seats_sold}/{event.seat_count} assentos vendidos
              </p>
              <span
                className={`caption mt-1 inline-block w-fit rounded px-2 py-0.5 ${
                  event.status === "published"
                    ? "bg-bg-success text-text-success"
                    : "bg-bg-warning text-text-warning"
                }`}
              >
                {event.status === "published" ? "Publicado" : "Rascunho"}
              </span>
              {event.status === "draft" && (
                <button
                  onClick={() => handlePublish(event.id)}
                  disabled={publishingId === event.id}
                  className="mt-2 w-fit rounded border border-accent px-3 py-1 text-sm text-accent transition-colors hover:bg-accent hover:text-on-accent disabled:opacity-60"
                >
                  {publishingId === event.id ? "Publicando..." : "Publicar"}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
