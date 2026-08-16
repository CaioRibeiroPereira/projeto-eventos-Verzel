const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export type UserRole = "organizer" | "customer" | "gate";

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
}

export class ApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new ApiError(body?.detail ?? "Algo deu errado. Tente novamente.");
  }

  return response.json();
}

export function login(email: string, password: string) {
  return request<{ access_token: string; token_type: string }>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function register(data: {
  name: string;
  email: string;
  password: string;
  role: "organizer" | "customer";
}) {
  return request<User>("/auth/register", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function me(token: string) {
  return request<User>("/auth/me", {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export interface Movie {
  id: number;
  title: string;
  poster_path: string | null;
  release_date: string | null;
}

export interface SeatRow {
  label: string;
  slots: boolean[];
}

export interface EventCreateInput {
  tmdb_movie_id: number;
  local: string;
  starts_at: string;
  price: number;
  seat_layout: SeatRow[];
}

export type EventStatus = "draft" | "published";

export interface Event {
  id: number;
  organizer_id: number;
  tmdb_movie_id: number;
  title: string;
  poster_path: string | null;
  local: string;
  starts_at: string;
  price: number;
  status: EventStatus;
  seat_count: number;
}

export interface EventFilters {
  q?: string;
  date?: string;
  local?: string;
  price_max?: number;
}

export function posterUrl(path: string | null, size: "w185" | "w342" = "w342") {
  return path ? `https://image.tmdb.org/t/p/${size}${path}` : null;
}

export function searchMovies(token: string, query: string) {
  return request<Movie[]>(`/movies/search?query=${encodeURIComponent(query)}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function createEvent(token: string, data: EventCreateInput) {
  return request<Event>("/events", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(data),
  });
}

export function publishEvent(token: string, id: number) {
  return request<Event>(`/events/${id}/publish`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function listMyEvents(token: string) {
  return request<Event[]>("/events/mine", {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function listPublicEvents(filters: EventFilters = {}) {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  if (filters.date) params.set("date", filters.date);
  if (filters.local) params.set("local", filters.local);
  if (filters.price_max != null) params.set("price_max", String(filters.price_max));
  const qs = params.toString();
  return request<Event[]>(`/events${qs ? `?${qs}` : ""}`);
}
