"use client";

import { useCallback, useEffect, useState } from "react";
import { useRoleGuard } from "@/hooks/use-role-guard";
import { CameraScanner } from "@/components/camera-scanner";
import {
  ApiError,
  listPublicEvents,
  validateTicket,
  type Event,
  type ValidationResult,
} from "@/lib/api";
import { formatDateTime } from "@/lib/format";

export default function PortariaPage() {
  const { ready } = useRoleGuard("gate");
  return ready ? <Portaria /> : null;
}

const RESULT_STYLE: Record<ValidationResult["result"], string> = {
  valid: "border-border-success bg-bg-success text-text-success",
  already_used: "border-border-warning bg-bg-warning text-text-warning",
  wrong_event: "border-border-danger bg-bg-danger text-text-danger",
  invalid: "border-border-danger bg-bg-danger text-text-danger",
};

const RESULT_TITLE: Record<ValidationResult["result"], string> = {
  valid: "Válido",
  already_used: "Já utilizado",
  wrong_event: "Evento errado",
  invalid: "Inválido",
};

function Portaria() {
  const { user } = useRoleGuard("gate");
  const [events, setEvents] = useState<Event[] | null>(null);
  const [eventId, setEventId] = useState<number | null>(null);
  const [mode, setMode] = useState<"camera" | "manual">("manual");
  const [code, setCode] = useState("");
  const [result, setResult] = useState<ValidationResult | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    listPublicEvents().then(setEvents);
  }, []);

  const handleValidate = useCallback(
    async (submittedCode: string) => {
      const token = localStorage.getItem("auth_token");
      if (!token || !eventId || !submittedCode.trim() || busy) return;
      setBusy(true);
      try {
        const res = await validateTicket(token, eventId, submittedCode.trim());
        setResult(res);
      } catch (err) {
        setResult({
          result: "invalid",
          message: err instanceof ApiError ? err.message : "Erro ao validar",
          seat_label: null,
          event_title: null,
          used_at: null,
        });
      } finally {
        setBusy(false);
      }
    },
    [eventId, busy],
  );

  function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault();
    handleValidate(code);
  }

  function handleScanAgain() {
    setResult(null);
    setCode("");
  }

  const selectedEvent = events?.find((e) => e.id === eventId) ?? null;

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-6 py-10">
      <div>
        <h1 className="movie-title !text-2xl">Portaria</h1>
        <p className="label">Olá, {user!.name}</p>
      </div>

      {!selectedEvent && (
        <div className="flex flex-col gap-2">
          <p className="label">Selecione o evento que está validando:</p>
          {events === null &&
            [0, 1, 2].map((i) => (
              <div key={i} className="h-14 animate-pulse rounded border border-border bg-surface-1" />
            ))}
          {events?.length === 0 && <p className="label">Nenhum evento publicado.</p>}
          {events?.map((event) => (
            <button
              key={event.id}
              onClick={() => setEventId(event.id)}
              className="rounded border border-border bg-surface-1 px-4 py-3 text-left transition-colors hover:border-accent"
            >
              <p className="text-text">{event.title}</p>
              <p className="caption">
                {event.local} — {formatDateTime(event.starts_at)}
              </p>
            </button>
          ))}
        </div>
      )}

      {selectedEvent && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between rounded border border-border bg-surface-1 px-4 py-2">
            <p className="label">
              Validando: <span className="text-text">{selectedEvent.title}</span>
            </p>
            <button
              onClick={() => {
                setEventId(null);
                setResult(null);
              }}
              className="caption text-accent hover:underline"
            >
              Trocar evento
            </button>
          </div>

          {!result && (
            <>
              <div className="flex gap-2">
                <button
                  onClick={() => setMode("manual")}
                  className={`flex-1 rounded border px-3 py-2 text-sm ${
                    mode === "manual"
                      ? "border-accent bg-accent text-on-accent"
                      : "border-border text-text-secondary"
                  }`}
                >
                  Digitar código
                </button>
                <button
                  onClick={() => setMode("camera")}
                  className={`flex-1 rounded border px-3 py-2 text-sm ${
                    mode === "camera"
                      ? "border-accent bg-accent text-on-accent"
                      : "border-border text-text-secondary"
                  }`}
                >
                  Câmera
                </button>
              </div>

              {mode === "manual" && (
                <form onSubmit={handleManualSubmit} className="flex gap-2">
                  <input
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="Código do ingresso"
                    className="ticket-code flex-1 rounded border border-border bg-surface-2 px-3 py-2 outline-none focus:border-accent"
                  />
                  <button
                    type="submit"
                    disabled={busy}
                    className="rounded bg-accent px-4 py-2 font-medium text-on-accent hover:bg-accent-hover disabled:opacity-60"
                  >
                    Validar
                  </button>
                </form>
              )}

              {mode === "camera" && (
                <CameraScanner active={mode === "camera"} onScan={handleValidate} />
              )}
            </>
          )}

          {result && (
            <div className={`flex flex-col items-center gap-2 rounded-lg border p-6 text-center ${RESULT_STYLE[result.result]}`}>
              <h2 className="text-lg font-medium">{RESULT_TITLE[result.result]}</h2>
              <p>{result.message}</p>
              {result.seat_label && <p className="ticket-code">Assento {result.seat_label}</p>}
              {result.used_at && (
                <p className="caption">Usado em {formatDateTime(result.used_at)}</p>
              )}
              <button
                onClick={handleScanAgain}
                className="mt-2 rounded bg-accent px-4 py-2 font-medium text-on-accent hover:bg-accent-hover"
              >
                Validar outro
              </button>
            </div>
          )}
        </div>
      )}
    </main>
  );
}
