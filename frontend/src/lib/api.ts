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

  if (response.status === 204) {
    return undefined as T;
  }
  return response.json();
}

export function login(email: string, password: string) {
  return request<{ access_token: string; token_type: string }>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function register(data: { name: string; email: string; password: string }) {
  return request<User>("/auth/register", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export interface CredentialRegisterInput {
  name: string;
  email: string;
  password: string;
  code: string;
}

export function registerOrganizer(data: CredentialRegisterInput) {
  return request<User>("/auth/register/organizador", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function registerGate(data: CredentialRegisterInput) {
  return request<User>("/auth/register/portaria", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function me(token: string) {
  return request<User>("/auth/me", {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function updateProfile(token: string, data: { name: string; email: string }) {
  return request<User>("/me", {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(data),
  });
}

export function changePassword(
  token: string,
  data: { current_password: string; new_password: string },
) {
  return request<void>("/me/password", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(data),
  });
}

export function deleteAccount(token: string) {
  return request<void>("/me", {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
}

export interface Card {
  id: number;
  brand: string;
  last4: string;
  holder_name: string;
  expiry: string;
  created_at: string;
}

export function listCards(token: string) {
  return request<Card[]>("/me/cards", {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function addCard(
  token: string,
  data: { number: string; holder_name: string; expiry: string },
) {
  return request<Card>("/me/cards", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(data),
  });
}

export function removeCard(token: string, cardId: number) {
  return request<void>(`/me/cards/${cardId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
}

export interface Movie {
  id: number;
  title: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string | null;
}

export type SlotKind = "seat" | "accessible" | "gap";

export interface SeatRow {
  label: string;
  slots: SlotKind[];
}

export interface EventCreateInput {
  tmdb_movie_id: number;
  local: string;
  starts_at: string;
  price: number;
  seat_layout: SeatRow[];
}

export type EventStatus = "draft" | "published";

export interface CastMember {
  name: string;
  character: string | null;
  profile_path: string | null;
}

export interface Event {
  id: number;
  organizer_id: number;
  tmdb_movie_id: number;
  title: string;
  poster_path: string | null;
  backdrop_path: string | null;
  overview: string | null;
  genres: string | null;
  runtime_minutes: number | null;
  director: string | null;
  cast: CastMember[] | null;
  tagline: string | null;
  vote_average: number | null;
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

export function backdropUrl(path: string | null, size: "w780" | "w1280" = "w1280") {
  return path ? `https://image.tmdb.org/t/p/${size}${path}` : null;
}

export function profileUrl(path: string | null, size: "w185" = "w185") {
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

export function getPublicEvent(id: number) {
  return request<Event>(`/events/${id}`);
}

export interface SeatState {
  id: number;
  label: string;
  row_label: string;
  col: number;
  accessible: boolean;
  occupied: boolean;
}

export type ReservationStatus = "pending" | "paid" | "failed" | "cancelled";

export const MAX_SEATS_PER_RESERVATION = 2;

export interface SeatSummary {
  seat_id: number;
  seat_label: string;
}

export interface Reservation {
  id: number;
  event_id: number;
  seats: SeatSummary[];
  status: ReservationStatus;
  total: number;
  expires_at: string;
}

export function getSeatMap(eventId: number) {
  return request<SeatState[]>(`/events/${eventId}/seats`);
}

export function createReservation(token: string, eventId: number, seatIds: number[]) {
  return request<Reservation>(`/events/${eventId}/reservations`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ seat_ids: seatIds }),
  });
}

export function confirmPayment(token: string, reservationId: number) {
  return request<Reservation>(`/reservations/${reservationId}/confirm`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function declinePayment(token: string, reservationId: number) {
  return request<Reservation>(`/reservations/${reservationId}/decline`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
}

export type TicketStatus = "valid" | "used" | "cancelled";

export interface Ticket {
  id: number;
  event_id: number;
  event_title: string;
  event_poster_path: string | null;
  event_local: string;
  event_starts_at: string;
  seat_label: string;
  status: TicketStatus;
  qr_payload: string;
  share_token: string;
  used_at: string | null;
}

export function listMyTickets(token: string) {
  return request<Ticket[]>("/tickets/mine", {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function getSharedTicket(token: string) {
  return request<Ticket>(`/tickets/shared/${token}`);
}

export type ValidationOutcome = "valid" | "invalid" | "already_used" | "wrong_event";

export interface ValidationResult {
  result: ValidationOutcome;
  message: string;
  seat_label: string | null;
  event_title: string | null;
  used_at: string | null;
}

export function validateTicket(token: string, eventId: number, code: string) {
  return request<ValidationResult>(`/events/${eventId}/validate`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ code }),
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
