"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/auth-context";
import { SeatMap } from "@/components/seat-map";
import { PaymentPanel } from "@/components/payment-panel";
import {
  ApiError,
  confirmPayment,
  createReservation,
  declinePayment,
  getPublicEvent,
  getSeatMap,
  payAtDoor,
  seatMapWsUrl,
  MAX_SEATS_PER_RESERVATION,
  type Event,
  type Reservation,
  type SeatState,
} from "@/lib/api";
import { formatPrice } from "@/lib/format";

type Step = "select" | "payment" | "success" | "declined" | "door_payment";

export default function ReservarPage() {
  const { id } = useParams<{ id: string }>();
  const eventId = Number(id);
  const router = useRouter();
  const { user, token, loading } = useAuth();

  const [event, setEvent] = useState<Event | null>(null);
  const [seats, setSeats] = useState<SeatState[] | null>(null);
  const [selected, setSelected] = useState<SeatState[]>([]);
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [step, setStep] = useState<Step>("select");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [flashSeatIds, setFlashSeatIds] = useState<Set<number>>(new Set());
  const [liveWarning, setLiveWarning] = useState<string | null>(null);

  // refs pra ler o estado mais recente de dentro do listener do WebSocket
  // sem precisar reabrir a conexão toda vez que `seats`/`selected` mudam.
  const seatsRef = useRef<SeatState[] | null>(null);
  const selectedRef = useRef<SeatState[]>([]);
  seatsRef.current = seats;
  selectedRef.current = selected;

  useEffect(() => {
    if (loading) return;
    if (!user || user.role !== "customer") {
      router.replace(`/login?next=${encodeURIComponent(`/eventos/${eventId}/reservar`)}`);
    }
  }, [loading, user, eventId, router]);

  const loadSeats = useCallback(() => {
    getSeatMap(eventId).then(setSeats);
  }, [eventId]);

  useEffect(() => {
    getPublicEvent(eventId).then(setEvent);
    loadSeats();
  }, [eventId, loadSeats]);

  // Mapa de assentos em tempo real: enquanto o cliente está escolhendo o
  // lugar, um WebSocket avisa quando alguém mais reserva/libera um assento
  // — busca o mapa atualizado de novo e, se o próprio cliente tinha
  // escolhido um assento que acabou de ser levado, tira da seleção dele.
  useEffect(() => {
    if (step !== "select") return;

    const ws = new WebSocket(seatMapWsUrl(eventId));
    ws.onmessage = async () => {
      const fresh = await getSeatMap(eventId);
      const before = seatsRef.current;

      const newlyOccupied = fresh
        .filter((s) => s.occupied && !before?.find((p) => p.id === s.id)?.occupied)
        .map((s) => s.id);
      if (newlyOccupied.length > 0) {
        setFlashSeatIds(new Set(newlyOccupied));
        setTimeout(() => setFlashSeatIds(new Set()), 1800);
      }

      setSeats(fresh);

      const stillAvailable = selectedRef.current.filter(
        (s) => !fresh.find((f) => f.id === s.id)?.occupied,
      );
      if (stillAvailable.length !== selectedRef.current.length) {
        setSelected(stillAvailable);
        setLiveWarning("Um assento que você tinha escolhido acabou de ser reservado por outra pessoa.");
      }
    };

    return () => ws.close();
  }, [eventId, step]);

  function handleToggle(seat: SeatState) {
    setError(null);
    setLiveWarning(null);
    setSelected((prev) => {
      const already = prev.some((s) => s.id === seat.id);
      if (already) return prev.filter((s) => s.id !== seat.id);
      if (prev.length >= MAX_SEATS_PER_RESERVATION) {
        setError(`Máximo de ${MAX_SEATS_PER_RESERVATION} assentos por pessoa.`);
        return prev;
      }
      return [...prev, seat];
    });
  }

  async function handleReserve() {
    if (selected.length === 0 || !token) return;
    setBusy(true);
    setError(null);
    try {
      const res = await createReservation(
        token,
        eventId,
        selected.map((s) => s.id),
      );
      setReservation(res);
      setStep("payment");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível reservar.");
      loadSeats();
      setSelected([]);
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

  async function handlePayAtDoor() {
    if (!reservation || !token) return;
    setBusy(true);
    try {
      await payAtDoor(token, reservation.id);
      setStep("door_payment");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível confirmar a reserva.");
    } finally {
      setBusy(false);
    }
  }

  function handleTryAgain() {
    setStep("select");
    setSelected([]);
    setReservation(null);
    setError(null);
    setLiveWarning(null);
    loadSeats();
  }

  if (loading || !user || user.role !== "customer" || !event || !seats) {
    return (
      <main className="flex flex-1 items-center justify-center">
        <p className="label">Carregando...</p>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-6 py-10">
      <div>
        <Link href={`/eventos/${eventId}`} className="caption text-accent hover:underline">
          ← Sobre o filme
        </Link>
        <h1 className="movie-title !text-2xl">{event.title}</h1>
      </div>

      {step === "select" && (
        <>
          <SeatMap
            seats={seats}
            selectedSeatIds={selected.map((s) => s.id)}
            onToggle={handleToggle}
            flashSeatIds={flashSeatIds}
          />

          <p className="text-center caption">Até {MAX_SEATS_PER_RESERVATION} assentos por pessoa.</p>

          {error && <p className="text-center text-sm text-red">{error}</p>}
          {liveWarning && <p className="text-center text-sm text-text-warning">{liveWarning}</p>}

          {selected.length > 0 && (
            <div className="flex flex-col items-center gap-2">
              <p className="label">
                Assentos {selected.map((s) => s.label).join(", ")} — {formatPrice(event.price * selected.length)}
              </p>
              <button
                onClick={handleReserve}
                disabled={busy}
                className="rounded bg-accent px-6 py-2 font-medium text-on-accent hover:bg-accent-hover disabled:opacity-60"
              >
                {busy
                  ? "Reservando..."
                  : `Reservar ${selected.length > 1 ? `estes ${selected.length} assentos` : "este assento"}`}
              </button>
            </div>
          )}
        </>
      )}

      {step === "payment" && reservation && (
        <PaymentPanel
          total={reservation.total}
          seatLabels={reservation.seats.map((s) => s.seat_label)}
          busy={busy}
          error={error}
          onApprove={() => handlePayment(true)}
          onDecline={() => handlePayment(false)}
          onPayAtDoor={handlePayAtDoor}
        />
      )}

      {step === "success" && reservation && (
        <div className="mx-auto flex w-full max-w-sm flex-col items-center gap-3 rounded-lg border border-border-success bg-bg-success p-6 text-center">
          <h2 className="text-lg font-medium text-text-success">Pagamento aprovado</h2>
          <p className="label">
            {reservation.seats.length > 1 ? "Assentos" : "Assento"}{" "}
            {reservation.seats.map((s) => s.seat_label).join(", ")} confirmado
            {reservation.seats.length > 1 ? "s" : ""}.
          </p>
          <Link href="/cliente" className="text-accent">
            {reservation.seats.length > 1 ? "Ver meus ingressos com QR" : "Ver meu ingresso com QR"}
          </Link>
        </div>
      )}

      {step === "door_payment" && reservation && (
        <div className="mx-auto flex w-full max-w-sm flex-col items-center gap-3 rounded-lg border border-border-warning bg-bg-warning p-6 text-center">
          <h2 className="text-lg font-medium text-text-warning">Reserva confirmada</h2>
          <p className="label">
            {reservation.seats.length > 1 ? "Assentos" : "Assento"}{" "}
            {reservation.seats.map((s) => s.seat_label).join(", ")} reservado
            {reservation.seats.length > 1 ? "s" : ""} — pagamento de {formatPrice(reservation.total)} é
            feito na portaria, na entrada.
          </p>
          <Link href="/cliente" className="text-accent">
            Ver meu ingresso com QR
          </Link>
        </div>
      )}

      {step === "declined" && (
        <div className="mx-auto flex w-full max-w-sm flex-col items-center gap-3 rounded-lg border border-border-danger bg-bg-danger p-6 text-center">
          <h2 className="text-lg font-medium text-text-danger">Pagamento recusado</h2>
          <p className="label">Os assentos foram liberados. Você pode tentar novamente.</p>
          <button
            onClick={handleTryAgain}
            className="rounded bg-accent px-4 py-2 font-medium text-on-accent hover:bg-accent-hover"
          >
            Escolher outros assentos
          </button>
        </div>
      )}
    </main>
  );
}
