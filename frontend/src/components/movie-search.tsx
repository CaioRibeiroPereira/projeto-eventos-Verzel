"use client";

import { useState } from "react";
import { searchMovies, posterUrl, type Movie } from "@/lib/api";

export function MovieSearch({
  token,
  onSelect,
}: {
  token: string;
  onSelect: (movie: Movie) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Movie[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setSearching(true);
    setError(null);
    try {
      setResults(await searchMovies(token, query));
    } catch {
      setError("Não foi possível buscar no TMDb.");
    } finally {
      setSearching(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar filme no TMDb..."
          className="flex-1 rounded border border-border bg-surface-2 px-3 py-2 text-text outline-none focus:border-accent"
        />
        <button
          type="submit"
          disabled={searching}
          className="rounded bg-accent px-4 py-2 font-medium text-on-accent hover:bg-accent-hover disabled:opacity-60"
        >
          {searching ? "Buscando..." : "Buscar"}
        </button>
      </form>

      {error && <p className="text-sm text-red">{error}</p>}

      {results && results.length === 0 && (
        <p className="label">Nenhum filme encontrado.</p>
      )}

      {results && results.length > 0 && (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
          {results.map((movie) => (
            <button
              key={movie.id}
              type="button"
              onClick={() => onSelect(movie)}
              className="flex flex-col items-start gap-1 rounded border border-border bg-surface-1 p-2 text-left hover:border-accent"
            >
              {posterUrl(movie.poster_path, "w185") ? (
                <img
                  src={posterUrl(movie.poster_path, "w185")!}
                  alt={movie.title}
                  className="aspect-2/3 w-full rounded object-cover"
                />
              ) : (
                <div className="aspect-2/3 w-full rounded bg-surface-3" />
              )}
              <span className="label text-text">{movie.title}</span>
              <span className="caption">{movie.release_date?.slice(0, 4)}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
