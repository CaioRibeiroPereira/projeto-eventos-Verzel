"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/auth-context";
import { SeatMap } from "@/components/seat-map";
import {
  ApiError,
  backdropUrl,
  confirmPayment,
  createReservation,
  declinePayment,
  getPublicEvent,
  getSeatMap,
  posterUrl,
  type Event,
  type Reservation,
  type SeatState,
} from "@/lib/api";
import { formatDateTime, formatPrice } from "@/lib/format";

type Step = "select" | "payment" | "success" | "declined";

export default function EventoPage() {
  const { id } = useParams<{ id: string }>();
  const eventId = Number(id);
  const router = useRouter();
  const { user, token } = useAuth();

  const [event, setEvent] = useState<Event | null>(null);
  const [seats, setSeats] = useState<SeatState[] | null>(null);
  const [selected, setSelected] = useState<SeatState | null>(null);
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [step, setStep] = useState<Step>("select");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const loadSeats = useCallback(() => {
    getSeatMap(eventId).then(setSeats);
  }, [eventId]);

  useEffect(() => {
    getPublicEvent(eventId).then(setEvent);
    loadSeats();
  }, [eventId, loadSeats]);

  function handleSelect(seat: SeatState) {
    setError(null);
    setSelected(seat);
  }

  async function handleReserve() {
    if (!selected) return;
    if (!user || user.role !== "customer" || !token) {
      router.push("/login");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await createReservation(token, eventId, selected.id);
      setReservation(res);
      setStep("payment");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível reservar.");
      loadSeats();
      setSelected(null);
    } finally {
      setBusy(false);
    }
  }

  async function handlePayment(approve: boolean) {
    if (!reservation || !token) return;
    setBusy(true);
    try {
      if (approve) {
        await confirmPayment(token, reservation.id);
        setStep("success");
      } else {
        await declinePayment(token, reservation.id);
        setStep("declined");
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível processar o pagamento.");
    } finally {
      setBusy(false);
    }
  }

  function handleTryAgain() {
    setStep("select");
    setSelected(null);
    setReservation(null);
    setError(null);
    loadSeats();
  }

  if (!event || !seats) {
    return (
      <main className="flex flex-1 items-center justify-center">
        <p className="label">Carregando...</p>
      </main>
    );
  }

  return (
    <main className="flex flex-1 flex-col">
      <section className="relative flex min-h-[280px] items-end overflow-hidden border-b border-border">
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
            background:
              "linear-gradient(180deg, rgba(18,16,14,0.25) 0%, var(--color-bg) 92%)",
          }}
        />
        <div className="relative mx-auto flex w-full max-w-3xl gap-4 px-6 py-6">
          {posterUrl(event.poster_path, "w185") && (
            <img
              src={posterUrl(event.poster_path, "w185")!}
              alt={event.title}
              className="h-40 w-28 shrink-0 rounded object-cover shadow-lg"
            />
          )}
          <div>
            <h1 className="movie-title !text-2xl">{event.title}</h1>
            <p className="label">{event.local}</p>
            <p className="label">{formatDateTime(event.starts_at)}</p>
            <p className="label">{formatPrice(event.price)}</p>
          </div>
        </div>
      </section>

      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-6 py-10">
      {step === "select" && (
        <>
          <SeatMap seats={seats} selectedSeatId={selected?.id ?? null} onSelect={handleSelect} />

          {error && <p className="text-center text-sm text-red">{error}</p>}

          {selected && (
            <div className="flex flex-col items-center gap-2">
              <p className="label">
                Assento {selected.label} — {formatPrice(event.price)}
              </p>
              <button
                onClick={handleReserve}
                disabled={busy}
                className="rounded bg-accent px-6 py-2 font-medium text-on-accent hover:bg-accent-hover disabled:opacity-60"
              >
                {busy ? "Reservando..." : "Reservar este assento"}
              </button>
              {!user && <p className="caption">Você precisa entrar como cliente para reservar.</p>}
            </div>
          )}
        </>
      )}

      {step === "payment" && reservation && (
        <div className="mx-auto flex w-full max-w-sm flex-col items-center gap-4 rounded-lg border border-border bg-surface-1 p-6">
          <h2 className="text-lg font-medium">Pagamento simulado</h2>
          <p className="label">
            Assento {reservation.seat_label} — {formatPrice(reservation.total)}
          </p>
          <p className="caption">
            Nenhuma cobrança real é feita. Escolha um dos caminhos para simular o resultado.
          </p>
          {error && <p className="text-sm text-red">{error}</p>}
          <div className="flex gap-3">
            <button
              onClick={() => handlePayment(true)}
              disabled={busy}
              className="rounded bg-accent px-4 py-2 font-medium text-on-accent hover:bg-accent-hover disabled:opacity-60"
            >
              Aprovar pagamento
            </button>
            <button
              onClick={() => handlePayment(false)}
              disabled={busy}
              className="rounded border border-red px-4 py-2 text-red hover:bg-bg-danger disabled:opacity-60"
            >
              Recusar pagamento
            </button>
          </div>
        </div>
      )}

      {step === "success" && reservation && (
        <div className="mx-auto flex w-full max-w-sm flex-col items-center gap-3 rounded-lg border border-border-success bg-bg-success p-6 text-center">
          <h2 className="text-lg font-medium text-text-success">Pagamento aprovado</h2>
          <p className="label">Assento {reservation.seat_label} confirmado.</p>
          <Link href="/cliente" className="text-accent">
            Ver meu ingresso com QR
          </Link>
        </div>
      )}

      {step === "declined" && (
        <div className="mx-auto flex w-full max-w-sm flex-col items-center gap-3 rounded-lg border border-border-danger bg-bg-danger p-6 text-center">
          <h2 className="text-lg font-medium text-text-danger">Pagamento recusado</h2>
          <p className="label">O assento foi liberado. Você pode tentar novamente.</p>
          <button
            onClick={handleTryAgain}
            className="rounded bg-accent px-4 py-2 font-medium text-on-accent hover:bg-accent-hover"
          >
            Escolher outro assento
          </button>
        </div>
      )}
      </div>
    </main>
  );
}
