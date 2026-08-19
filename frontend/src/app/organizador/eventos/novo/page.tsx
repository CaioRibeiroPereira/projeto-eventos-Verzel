"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useRoleGuard } from "@/hooks/use-role-guard";
import { MovieSearch } from "@/components/movie-search";
import { RoomLayoutPreview } from "@/components/room-layout-preview";
import {
  createEvent,
  getRoomLayouts,
  posterUrl,
  ApiError,
  type EventFormat,
  type EventLanguage,
  type Movie,
  type SeatRow,
} from "@/lib/api";

const FORMATS: EventFormat[] = ["2D", "3D"];
const LANGUAGES: EventLanguage[] = ["Dublado", "Legendado"];

export default function NovoEventoPage() {
  const { ready } = useRoleGuard("organizer");
  return ready ? <Wizard /> : null;
}

function Wizard() {
  const router = useRouter();
  const { token } = useRoleGuard("organizer");
  const [movie, setMovie] = useState<Movie | null>(null);
  const [rooms, setRooms] = useState<Record<string, SeatRow[]> | null>(null);
  const [local, setLocal] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [price, setPrice] = useState("");
  const [format, setFormat] = useState<EventFormat>("2D");
  const [language, setLanguage] = useState<EventLanguage>("Dublado");
  const [publishNow, setPublishNow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) return;
    getRoomLayouts(token).then((data) => {
      setRooms(data);
      const first = Object.keys(data)[0];
      if (first) setLocal(first);
    });
  }, [token]);

  const currentLayout = rooms && local ? rooms[local] : null;
  const seatCount = currentLayout
    ? currentLayout.reduce((sum, r) => sum + r.slots.filter((s) => s !== "gap").length, 0)
    : 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!movie) return;
    setError(null);
    setSubmitting(true);
    try {
      if (!token) throw new Error("sem sessão");
      await createEvent(token, {
        tmdb_movie_id: movie.id,
        local,
        starts_at: `${date}T${time}:00`,
        price: Number(price),
        format,
        language,
        publish_now: publishNow,
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
          <MovieSearchGate token={token} onSelect={setMovie} />
        )}
      </section>

      {movie && rooms && (
        <form onSubmit={handleSubmit} className="flex flex-col gap-8">
          <section className="flex flex-col gap-3">
            <h2 className="label">2. Detalhes</h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1">
                <label className="label" htmlFor="local">
                  Sala
                </label>
                <select
                  id="local"
                  required
                  value={local}
                  onChange={(e) => setLocal(e.target.value)}
                  className="rounded border border-border bg-surface-2 px-3 py-2 text-text outline-none focus:border-accent"
                >
                  {Object.keys(rooms).map((sala) => (
                    <option key={sala} value={sala}>
                      {sala}
                    </option>
                  ))}
                </select>
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
              <div className="flex flex-col gap-1">
                <label className="label" htmlFor="date">
                  Data
                </label>
                <input
                  id="date"
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="rounded border border-border bg-surface-2 px-3 py-2 text-text outline-none focus:border-accent"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="label" htmlFor="time">
                  Hora
                </label>
                <input
                  id="time"
                  type="time"
                  required
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="rounded border border-border bg-surface-2 px-3 py-2 text-text outline-none focus:border-accent"
                />
              </div>

              <div className="flex flex-col gap-1">
                <span className="label">Formato</span>
                <div className="flex gap-2">
                  {FORMATS.map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setFormat(f)}
                      className={`flex-1 rounded border px-3 py-2 text-sm transition-colors ${
                        format === f
                          ? "border-accent bg-accent text-on-accent"
                          : "border-border bg-surface-2 text-text-secondary"
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <span className="label">Idioma</span>
                <div className="flex gap-2">
                  {LANGUAGES.map((l) => (
                    <button
                      key={l}
                      type="button"
                      onClick={() => setLanguage(l)}
                      className={`flex-1 rounded border px-3 py-2 text-sm transition-colors ${
                        language === l
                          ? "border-accent bg-accent text-on-accent"
                          : "border-border bg-surface-2 text-text-secondary"
                      }`}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="label">3. Planta da sala</h2>
            {currentLayout && <RoomLayoutPreview rows={currentLayout} />}
          </section>

          <label className="flex w-fit items-center gap-2 text-sm text-text">
            <input
              type="checkbox"
              checked={publishNow}
              onChange={(e) => setPublishNow(e.target.checked)}
              className="h-4 w-4 rounded border-border accent-accent"
            />
            Publicar assim que criar (senão fica como rascunho)
          </label>

          {error && <p className="text-sm text-red">{error}</p>}

          <button
            type="submit"
            disabled={submitting || seatCount === 0}
            className="w-fit rounded bg-accent px-6 py-2 font-medium text-on-accent hover:bg-accent-hover disabled:opacity-60"
          >
            {submitting ? "Criando..." : publishNow ? "Criar e publicar evento" : "Criar evento (rascunho)"}
          </button>
        </form>
      )}
    </main>
  );
}

function MovieSearchGate({
  token,
  onSelect,
}: {
  token: string | null;
  onSelect: (movie: Movie) => void;
}) {
  if (!token) return null;
  return <MovieSearch token={token} onSelect={onSelect} />;
}
