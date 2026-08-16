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

function Dashboard() {
  const { user, logout } = useRoleGuard("organizer");
  const [events, setEvents] = useState<Event[] | null>(null);
  const [publishingId, setPublishingId] = useState<number | null>(null);

  const load = useCallback(() => {
    const token = localStorage.getItem("auth_token");
    if (!token) return;
    listMyEvents(token).then(setEvents);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handlePublish(id: number) {
    const token = localStorage.getItem("auth_token");
    if (!token) return;
    setPublishingId(id);
    try {
      await publishEvent(token, id);
      load();
    } finally {
      setPublishingId(null);
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-6 py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="movie-title !text-2xl">Meus eventos</h1>
          <p className="label">Olá, {user!.name}</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/organizador/eventos/novo"
            className="rounded bg-accent px-4 py-2 font-medium text-on-accent hover:bg-accent-hover"
          >
            Criar evento
          </Link>
          <button
            onClick={logout}
            className="rounded border border-border px-4 py-2 text-sm text-text-secondary hover:border-accent hover:text-accent"
          >
            Sair
          </button>
        </div>
      </div>

      {events === null && <p className="label">Carregando...</p>}
      {events?.length === 0 && (
        <p className="label">Nenhum evento ainda. Crie o primeiro.</p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {events?.map((event) => (
          <div
            key={event.id}
            className="flex gap-4 rounded-lg border border-border bg-surface-1 p-4"
          >
            {posterUrl(event.poster_path, "w185") && (
              <img
                src={posterUrl(event.poster_path, "w185")!}
                alt={event.title}
                className="h-32 w-24 rounded object-cover"
              />
            )}
            <div className="flex flex-1 flex-col gap-1">
              <h2 className="text-lg font-medium">{event.title}</h2>
              <p className="label">{event.local}</p>
              <p className="label">{formatDateTime(event.starts_at)}</p>
              <p className="label">{formatPrice(event.price)}</p>
              <p className="caption">{event.seat_count} assentos</p>
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
                  className="mt-2 w-fit rounded border border-accent px-3 py-1 text-sm text-accent hover:bg-accent hover:text-on-accent disabled:opacity-60"
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
