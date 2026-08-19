"use client";

import { useCallback, useEffect, useState } from "react";
import { useRoleGuard } from "@/hooks/use-role-guard";
import { CameraScanner } from "@/components/camera-scanner";
import {
  ApiError,
  backdropUrl,
  listPublicEvents,
  validateTicket,
  type Event,
  type ValidationResult,
} from "@/lib/api";
import { formatDateTime } from "@/lib/format";

function todayLocal(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

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
  wrong_event: "Sessão errada",
  invalid: "Inválido",
};

function Portaria() {
  const { user, token } = useRoleGuard("gate");
  const [events, setEvents] = useState<Event[] | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [picking, setPicking] = useState(true);
  const [dateFilter, setDateFilter] = useState(todayLocal());
  const [mode, setMode] = useState<"camera" | "manual">("manual");
  const [code, setCode] = useState("");
  const [result, setResult] = useState<ValidationResult | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    listPublicEvents().then(setEvents);
  }, []);

  function toggleEvent(id: number) {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  const handleValidate = useCallback(
    async (submittedCode: string) => {
      if (!token || selectedIds.length === 0 || !submittedCode.trim() || busy) return;
      setBusy(true);
      try {
        const res = await validateTicket(token, selectedIds, submittedCode.trim());
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
    [selectedIds, busy, token],
  );

  function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault();
    handleValidate(code);
  }

  function handleScanAgain() {
    setResult(null);
    setCode("");
  }

  const selectedEvents = events?.filter((e) => selectedIds.includes(e.id)) ?? [];
  const eventsOnDate = events?.filter((e) => e.starts_at.slice(0, 10) === dateFilter) ?? [];

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-6 py-10">
      <div>
        <h1 className="movie-title !text-2xl">Portaria</h1>
        <p className="label">Olá, {user!.name}</p>
      </div>

      {picking && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <p className="label">Marque as sessões que você está cobrindo:</p>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="rounded border border-border bg-surface-2 px-2 py-1 text-sm text-text outline-none focus:border-accent"
            />
          </div>
          <div className="flex flex-col gap-2">
            {events === null &&
              [0, 1, 2].map((i) => (
                <div key={i} className="h-20 animate-pulse rounded border border-border bg-surface-1" />
              ))}
            {events !== null && eventsOnDate.length === 0 && (
              <p className="label">Nenhuma sessão nessa data.</p>
            )}
            {eventsOnDate.map((event) => {
              const checked = selectedIds.includes(event.id);
              const banner = backdropUrl(event.backdrop_path, "w780");
              return (
                <button
                  key={event.id}
                  type="button"
                  onClick={() => toggleEvent(event.id)}
                  className={`flex items-center gap-3 overflow-hidden rounded border text-left transition-colors ${
                    checked ? "border-accent bg-accent/10" : "border-border bg-surface-1 hover:border-border-strong"
                  }`}
                >
                  <div className="relative h-16 w-28 shrink-0 overflow-hidden bg-surface-2">
                    {banner && (
                      <img src={banner} alt="" className="h-full w-full object-cover" />
                    )}
                  </div>
                  <div className="flex flex-1 items-center gap-3 py-2 pr-3">
                    <span
                      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                        checked ? "border-accent bg-accent" : "border-border"
                      }`}
                    >
                      {checked && <span className="h-2 w-2 rounded-sm bg-on-accent" />}
                    </span>
                    <span>
                      <p className="text-text">{event.title}</p>
                      <p className="caption">
                        {event.local} — {formatDateTime(event.starts_at)}
                      </p>
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
          <button
            type="button"
            disabled={selectedIds.length === 0}
            onClick={() => setPicking(false)}
            className="w-fit rounded bg-accent px-4 py-2 font-medium text-on-accent hover:bg-accent-hover disabled:opacity-60"
          >
            {selectedIds.length === 0
              ? "Selecione ao menos uma sessão"
              : `Começar a validar (${selectedIds.length} sessão${selectedIds.length > 1 ? "ões" : ""})`}
          </button>
        </div>
      )}

      {!picking && (
        <div className="flex flex-col gap-4">
          <div className="flex items-start justify-between gap-3 rounded border border-border bg-surface-1 px-4 py-2">
            <div>
              <p className="label">Validando:</p>
              <p className="text-text">{selectedEvents.map((e) => e.title).join(", ")}</p>
            </div>
            <button
              onClick={() => {
                setPicking(true);
                setResult(null);
              }}
              className="shrink-0 caption text-accent hover:underline"
            >
              Trocar sessões
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
                    placeholder="Ex: 7K2P-9XQZ"
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
              {result.event_title && <p className="label">{result.event_title}</p>}
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
