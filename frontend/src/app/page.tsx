"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CinemaBackdrop } from "@/components/cinema-backdrop";
import {
  backdropUrl,
  listPublicEvents,
  posterUrl,
  type Event,
  type EventFilters,
} from "@/lib/api";
import { formatDateTime, formatPrice } from "@/lib/format";

export default function Home() {
  const [featured, setFeatured] = useState<Event | null>(null);
  const [filters, setFilters] = useState<EventFilters>({});
  const [draft, setDraft] = useState<EventFilters>({});
  const [events, setEvents] = useState<Event[] | null>(null);

  useEffect(() => {
    listPublicEvents().then((all) => setFeatured(all[0] ?? null));
  }, []);

  useEffect(() => {
    listPublicEvents(filters).then(setEvents);
  }, [filters]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setFilters(draft);
  }

  return (
    <main className="flex flex-1 flex-col">
      {featured && (
        <section className="relative flex min-h-[360px] items-end overflow-hidden border-b border-border">
          {backdropUrl(featured.backdrop_path) && (
            <img
              src={backdropUrl(featured.backdrop_path)!}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
            />
          )}
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(180deg, rgba(18,16,14,0.35) 0%, var(--color-bg) 95%), linear-gradient(90deg, var(--color-bg) 0%, rgba(18,16,14,0.15) 55%)",
            }}
          />
          <div className="relative flex w-full max-w-4xl mx-auto flex-col gap-2 px-6 py-8">
            <span className="label text-accent">Em cartaz</span>
            <h1 className="movie-title">{featured.title}</h1>
            <p className="label">
              {featured.local} — {formatDateTime(featured.starts_at)} — {formatPrice(featured.price)}
            </p>
            <Link
              href={`/eventos/${featured.id}`}
              className="mt-2 w-fit rounded bg-accent px-5 py-2 font-medium text-on-accent hover:bg-accent-hover"
            >
              Ver detalhes
            </Link>
          </div>
        </section>
      )}

      <div className="relative flex-1">
        <CinemaBackdrop />
        <div className="relative mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 py-10">
          <h2 className="text-lg font-medium">Eventos em cartaz</h2>

          <form
            onSubmit={handleSearch}
            className="flex flex-wrap gap-2 rounded-lg border border-border bg-surface-1 p-3"
          >
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

          {events === null && (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="aspect-2/3 animate-pulse rounded-lg border border-border bg-surface-1" />
              ))}
            </div>
          )}

          {events?.length === 0 && (
            <p className="label rounded-lg border border-dashed border-border py-16 text-center">
              Nenhum evento encontrado.
            </p>
          )}

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {events?.map((event) => (
              <Link
                key={event.id}
                href={`/eventos/${event.id}`}
                className="group flex flex-col overflow-hidden rounded-lg border border-border bg-surface-1 transition-colors hover:border-accent"
              >
                <div className="aspect-2/3 w-full overflow-hidden bg-surface-2">
                  {posterUrl(event.poster_path, "w342") && (
                    <img
                      src={posterUrl(event.poster_path, "w342")!}
                      alt={event.title}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  )}
                </div>
                <div className="flex flex-col gap-0.5 p-3">
                  <h3 className="truncate text-sm font-medium text-text">{event.title}</h3>
                  <p className="caption truncate">{event.local}</p>
                  <p className="caption">{formatDateTime(event.starts_at)}</p>
                  <p className="label mt-1 text-accent">{formatPrice(event.price)}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
