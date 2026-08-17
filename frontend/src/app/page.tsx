"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarIcon, PinIcon, SearchIcon, TagIcon } from "@/components/icons";
import {
  backdropUrl,
  listPublicEvents,
  posterUrl,
  type Event,
  type EventFilters,
} from "@/lib/api";
import { formatDateTime, formatPrice } from "@/lib/format";

const HERO_INTERVAL_MS = 6000;

export default function Home() {
  const [heroEvents, setHeroEvents] = useState<Event[] | null>(null);
  const [heroIndex, setHeroIndex] = useState(0);
  const [filters, setFilters] = useState<EventFilters>({});
  const [draft, setDraft] = useState<EventFilters>({});
  const [events, setEvents] = useState<Event[] | null>(null);

  useEffect(() => {
    listPublicEvents().then((all) => setHeroEvents(all.slice(0, 8)));
  }, []);

  useEffect(() => {
    if (!heroEvents || heroEvents.length <= 1) return;
    const timer = setInterval(() => {
      setHeroIndex((i) => (i + 1) % heroEvents.length);
    }, HERO_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [heroEvents]);

  const featured = heroEvents?.[heroIndex] ?? null;

  useEffect(() => {
    listPublicEvents(filters).then(setEvents);
  }, [filters]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setFilters(draft);
  }

  function handleClear() {
    setDraft({});
    setFilters({});
  }

  const hasFilters = Object.values(filters).some((v) => v !== undefined);

  return (
    <main className="flex flex-1 flex-col">
      {featured && (
        <section className="relative flex min-h-[360px] items-end overflow-hidden">
          {backdropUrl(featured.backdrop_path) && (
            <img
              key={`img-${featured.id}`}
              src={backdropUrl(featured.backdrop_path)!}
              alt=""
              className="hero-fade absolute inset-0 h-full w-full object-cover"
            />
          )}
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(180deg, rgba(18,16,14,0.35) 0%, var(--color-bg) 95%), linear-gradient(90deg, var(--color-bg) 0%, rgba(18,16,14,0.15) 55%)",
            }}
          />
          <div key={`info-${featured.id}`} className="hero-fade relative flex w-full max-w-4xl mx-auto flex-col gap-2 px-6 py-8">
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

          {heroEvents && heroEvents.length > 1 && (
            <div className="relative mb-4 flex w-full max-w-4xl mx-auto gap-2 px-6">
              {heroEvents.map((event, i) => (
                <button
                  key={event.id}
                  onClick={() => setHeroIndex(i)}
                  aria-label={`Mostrar ${event.title}`}
                  className={`h-1.5 rounded-full transition-all ${
                    i === heroIndex ? "w-6 bg-accent" : "w-1.5 bg-white/30 hover:bg-white/50"
                  }`}
                />
              ))}
            </div>
          )}
        </section>
      )}

      <div className="relative flex-1">
        <div className="relative mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 py-10">
          <h2 className="text-lg font-medium">Eventos em cartaz</h2>

          <form
            onSubmit={handleSearch}
            className="flex flex-col gap-4 rounded-xl border border-border bg-surface-1 p-5"
          >
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <SearchField label="Título" icon={SearchIcon}>
                <input
                  placeholder="Buscar por título..."
                  value={draft.q ?? ""}
                  onChange={(e) => setDraft({ ...draft, q: e.target.value || undefined })}
                  className="w-full bg-transparent text-sm text-text outline-none placeholder:text-text-muted"
                />
              </SearchField>

              <SearchField label="Local" icon={PinIcon}>
                <input
                  placeholder="Onde?"
                  value={draft.local ?? ""}
                  onChange={(e) => setDraft({ ...draft, local: e.target.value || undefined })}
                  className="w-full bg-transparent text-sm text-text outline-none placeholder:text-text-muted"
                />
              </SearchField>

              <SearchField label="Data" icon={CalendarIcon}>
                <input
                  type="date"
                  value={draft.date ?? ""}
                  onChange={(e) => setDraft({ ...draft, date: e.target.value || undefined })}
                  className="w-full bg-transparent text-sm text-text outline-none [color-scheme:dark]"
                />
              </SearchField>

              <SearchField label="Preço máximo" icon={TagIcon}>
                <input
                  type="number"
                  min={0}
                  placeholder="R$"
                  value={draft.price_max ?? ""}
                  onChange={(e) =>
                    setDraft({ ...draft, price_max: e.target.value ? Number(e.target.value) : undefined })
                  }
                  className="w-full bg-transparent text-sm text-text outline-none placeholder:text-text-muted"
                />
              </SearchField>
            </div>

            <div className="flex items-center justify-end gap-3">
              {hasFilters && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="text-sm text-text-secondary hover:text-accent"
                >
                  Limpar filtros
                </button>
              )}
              <button
                type="submit"
                className="rounded-lg bg-accent px-6 py-2 text-sm font-medium text-on-accent hover:bg-accent-hover"
              >
                Buscar
              </button>
            </div>
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

function SearchField({
  label,
  icon: Icon,
  children,
}: {
  label: string;
  icon: (props: { className?: string }) => React.ReactElement;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="caption text-text-secondary">{label}</span>
      <div className="flex items-center gap-2 rounded-lg border border-border bg-surface-2 px-3 py-2 transition-colors focus-within:border-accent">
        <Icon className="h-4 w-4 shrink-0 text-text-muted" />
        {children}
      </div>
    </label>
  );
}
