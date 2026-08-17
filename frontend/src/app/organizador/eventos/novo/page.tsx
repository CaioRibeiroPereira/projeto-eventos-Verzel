"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useRoleGuard } from "@/hooks/use-role-guard";
import { MovieSearch } from "@/components/movie-search";
import { SeatLayoutEditor } from "@/components/seat-layout-editor";
import { createEvent, posterUrl, ApiError, type Movie, type SeatRow } from "@/lib/api";

export default function NovoEventoPage() {
  const { ready } = useRoleGuard("organizer");
  return ready ? <Wizard /> : null;
}

function Wizard() {
  const router = useRouter();
  const [movie, setMovie] = useState<Movie | null>(null);
  const [local, setLocal] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [price, setPrice] = useState("");
  const [rows, setRows] = useState<SeatRow[]>([
    { label: "A", slots: Array(8).fill("seat") },
  ]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const seatCount = rows.reduce((sum, r) => sum + r.slots.filter((s) => s !== "gap").length, 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!movie) return;
    setError(null);
    setSubmitting(true);
    try {
      const token = localStorage.getItem("auth_token");
      if (!token) throw new Error("sem sessão");
      await createEvent(token, {
        tmdb_movie_id: movie.id,
        local,
        starts_at: new Date(startsAt).toISOString(),
        price: Number(price),
        seat_layout: rows,
      });
      router.push("/organizador");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível criar o evento.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-6 py-10">
      <h1 className="movie-title !text-2xl">Criar evento</h1>

      <section className="flex flex-col gap-3">
        <h2 className="label">1. Filme</h2>
        {movie ? (
          <div className="flex items-center gap-3 rounded border border-border bg-surface-1 p-3">
            {posterUrl(movie.poster_path, "w185") && (
              <img
                src={posterUrl(movie.poster_path, "w185")!}
                alt={movie.title}
                className="h-20 w-14 rounded object-cover"
              />
            )}
            <span className="text-text">{movie.title}</span>
            <button
              type="button"
              onClick={() => setMovie(null)}
              className="ml-auto text-sm text-accent hover:underline"
            >
              Trocar
            </button>
          </div>
        ) : (
          <MovieSearchGate onSelect={setMovie} />
        )}
      </section>

      {movie && (
        <form onSubmit={handleSubmit} className="flex flex-col gap-8">
          <section className="flex flex-col gap-3">
            <h2 className="label">2. Detalhes</h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1">
                <label className="label" htmlFor="local">
                  Local
                </label>
                <input
                  id="local"
                  required
                  value={local}
                  onChange={(e) => setLocal(e.target.value)}
                  className="rounded border border-border bg-surface-2 px-3 py-2 text-text outline-none focus:border-accent"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="label" htmlFor="price">
                  Preço (R$)
                </label>
                <input
                  id="price"
                  type="number"
                  min={0}
                  step="0.01"
                  required
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="rounded border border-border bg-surface-2 px-3 py-2 text-text outline-none focus:border-accent"
                />
              </div>
              <div className="flex flex-col gap-1 sm:col-span-2">
                <label className="label" htmlFor="starts_at">
                  Data e hora
                </label>
                <input
                  id="starts_at"
                  type="datetime-local"
                  required
                  value={startsAt}
                  onChange={(e) => setStartsAt(e.target.value)}
                  className="rounded border border-border bg-surface-2 px-3 py-2 text-text outline-none focus:border-accent"
                />
              </div>
            </div>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="label">3. Mapa de assentos</h2>
            <SeatLayoutEditor rows={rows} onChange={setRows} />
          </section>

          {error && <p className="text-sm text-red">{error}</p>}

          <button
            type="submit"
            disabled={submitting || seatCount === 0}
            className="w-fit rounded bg-accent px-6 py-2 font-medium text-on-accent hover:bg-accent-hover disabled:opacity-60"
          >
            {submitting ? "Criando..." : "Criar evento (rascunho)"}
          </button>
        </form>
      )}
    </main>
  );
}

function MovieSearchGate({ onSelect }: { onSelect: (movie: Movie) => void }) {
  const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
  if (!token) return null;
  return <MovieSearch token={token} onSelect={onSelect} />;
}
