"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/auth-context";
import { StarIcon } from "@/components/icons";
import {
  backdropUrl,
  getEventSessions,
  getPublicEvent,
  posterUrl,
  profileUrl,
  type Event,
} from "@/lib/api";
import { dayKey, formatDayLabel, formatPrice, formatTime } from "@/lib/format";

export default function EventoPage() {
  const { id } = useParams<{ id: string }>();
  const eventId = Number(id);
  const { user, loading } = useAuth();
  const [event, setEvent] = useState<Event | null>(null);
  const [sessions, setSessions] = useState<Event[] | null>(null);
  const [activeId, setActiveId] = useState(eventId);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  useEffect(() => {
    setSessions(null);
    setActiveId(eventId);
    getPublicEvent(eventId).then((e) => {
      setEvent(e);
      setSelectedDay(dayKey(e.starts_at));
    });
    getEventSessions(eventId).then(setSessions);
  }, [eventId]);

  const allSessions = sessions ?? (event ? [event] : []);

  const dayGroups = useMemo(() => {
    const map = new Map<string, Event[]>();
    for (const s of allSessions) {
      const key = dayKey(s.starts_at);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(s);
    }
    return [...map.entries()]
      .map(([key, items]) => ({
        key,
        items: [...items].sort((a, b) => a.starts_at.localeCompare(b.starts_at)),
      }))
      .sort((a, b) => a.items[0].starts_at.localeCompare(b.items[0].starts_at));
  }, [allSessions]);

  const activeEvent = allSessions.find((s) => s.id === activeId) ?? event;

  if (!event || !activeEvent) {
    return (
      <main className="flex flex-1 items-center justify-center">
        <p className="label">Carregando...</p>
      </main>
    );
  }

  const currentGroup = dayGroups.find((g) => g.key === selectedDay) ?? dayGroups[0];
  const reservarHref = `/eventos/${activeEvent.id}/reservar`;
  const soldOut = activeEvent.seat_count === 0;

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
            {event.tagline && <p className="label italic text-text-secondary">{event.tagline}</p>}
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 label">
              {event.genres && <span>{event.genres}</span>}
              {event.runtime_minutes && <span>— {event.runtime_minutes} min</span>}
              {event.vote_average != null && (
                <span className="flex items-center gap-1 text-accent">
                  <StarIcon className="h-3.5 w-3.5" />
                  {event.vote_average.toFixed(1)}
                </span>
              )}
            </div>
            {event.director && <p className="label">Direção: {event.director}</p>}
          </div>
        </div>
      </section>

      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-6 py-10">
        <div className="flex flex-col gap-4 rounded-lg border border-border bg-surface-1 p-5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="ticket-code rounded bg-surface-2 px-2 py-1 text-xs">{activeEvent.format}</span>
            <span className="ticket-code rounded bg-surface-2 px-2 py-1 text-xs">{activeEvent.language}</span>
            <span className="label">{activeEvent.local}</span>
          </div>

          {dayGroups.length > 1 && (
            <div className="flex flex-wrap gap-2">
              {dayGroups.map((group) => (
                <button
                  key={group.key}
                  onClick={() => {
                    setSelectedDay(group.key);
                    setActiveId(group.items[0].id);
                  }}
                  className={`rounded border px-3 py-1.5 text-sm transition-colors ${
                    group.key === currentGroup?.key
                      ? "border-accent bg-accent text-on-accent"
                      : "border-border text-text-secondary hover:border-accent hover:text-accent"
                  }`}
                >
                  {formatDayLabel(group.items[0].starts_at)}
                </button>
              ))}
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {currentGroup?.items.map((session) => (
              <button
                key={session.id}
                onClick={() => setActiveId(session.id)}
                className={`ticket-code rounded border px-4 py-2 text-sm transition-colors ${
                  session.id === activeEvent.id
                    ? "border-accent bg-accent !text-on-accent"
                    : "border-border text-text-secondary hover:border-accent hover:text-accent"
                }`}
              >
                {formatTime(session.starts_at)}
              </button>
            ))}
          </div>

          <p className="label">{formatPrice(activeEvent.price)}</p>

          {soldOut ? (
            <span className="w-fit rounded bg-surface-3 px-5 py-2 text-text-muted">Esgotado</span>
          ) : loading ? null : !user ? (
            <Link
              href={`/login?next=${encodeURIComponent(reservarHref)}`}
              className="w-fit rounded bg-accent px-5 py-2 font-medium text-on-accent hover:bg-accent-hover"
            >
              Entrar para comprar
            </Link>
          ) : user.role !== "customer" ? (
            <p className="caption">Disponível apenas para contas de cliente.</p>
          ) : (
            <Link
              href={reservarHref}
              className="w-fit rounded bg-accent px-5 py-2 font-medium text-on-accent hover:bg-accent-hover"
            >
              Comprar ingresso
            </Link>
          )}
        </div>

        {event.youtube_key && (
          <div className="flex flex-col gap-2">
            <h2 className="text-lg font-medium">Trailer</h2>
            <div className="aspect-video w-full overflow-hidden rounded-lg border border-border">
              <iframe
                src={`https://www.youtube.com/embed/${event.youtube_key}`}
                title={`Trailer de ${event.title}`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="h-full w-full"
              />
            </div>
          </div>
        )}

        {event.overview && (
          <div className="flex flex-col gap-2">
            <h2 className="text-lg font-medium">Sobre o filme</h2>
            <p className="label leading-relaxed">{event.overview}</p>
          </div>
        )}

        {event.cast && event.cast.length > 0 && (
          <div className="flex flex-col gap-3">
            <h2 className="text-lg font-medium">Elenco</h2>
            <div className="flex gap-4 overflow-x-auto pb-2">
              {event.cast.map((member) => (
                <div key={member.name} className="flex w-20 shrink-0 flex-col items-center gap-1.5 text-center">
                  <div className="h-20 w-20 overflow-hidden rounded-full bg-surface-2">
                    {profileUrl(member.profile_path) && (
                      <img
                        src={profileUrl(member.profile_path)!}
                        alt={member.name}
                        className="h-full w-full object-cover"
                      />
                    )}
                  </div>
                  <p className="caption text-text">{member.name}</p>
                  {member.character && <p className="caption">{member.character}</p>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
