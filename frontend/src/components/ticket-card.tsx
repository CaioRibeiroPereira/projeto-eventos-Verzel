"use client";

import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { posterUrl, type Ticket } from "@/lib/api";
import { formatDateTime } from "@/lib/format";

const STATUS_LABEL: Record<Ticket["status"], string> = {
  valid: "Válido",
  used: "Utilizado",
  cancelled: "Cancelado",
};

export function TicketCard({ ticket }: { ticket: Ticket }) {
  const [copied, setCopied] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);
  const shareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/ingressos/${ticket.share_token}`
      : "";

  async function handleShare() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard indisponível — o link já aparece na tela para copiar manualmente
    }
  }

  async function handleCopyCode() {
    try {
      await navigator.clipboard.writeText(ticket.manual_code);
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    } catch {
      // clipboard indisponível — o código já aparece na tela para copiar manualmente
    }
  }

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-border bg-surface-1 p-5 sm:flex-row">
      <div className="flex gap-4">
        {posterUrl(ticket.event_poster_path, "w185") && (
          <img
            src={posterUrl(ticket.event_poster_path, "w185")!}
            alt={ticket.event_title}
            className="h-28 w-20 rounded object-cover"
          />
        )}
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-medium">{ticket.event_title}</h2>
          <p className="label">{ticket.event_local}</p>
          <p className="label">{formatDateTime(ticket.event_starts_at)}</p>
          <p className="ticket-code">Assento {ticket.seat_label}</p>
          <span
            className={`caption mt-1 inline-block w-fit rounded px-2 py-0.5 ${
              ticket.status === "valid"
                ? "bg-bg-success text-text-success"
                : ticket.status === "used"
                  ? "bg-surface-3 text-text-secondary"
                  : "bg-bg-danger text-text-danger"
            }`}
          >
            {STATUS_LABEL[ticket.status]}
          </span>
        </div>
      </div>

      <div className="flex flex-col items-center gap-2 sm:ml-auto">
        <div className="rounded bg-white p-2">
          <QRCodeSVG value={ticket.qr_payload} size={112} />
        </div>
        <div className="flex flex-col items-center gap-0.5">
          <span className="caption">Código pra digitar na portaria</span>
          <button
            onClick={handleCopyCode}
            title="Alternativa caso a câmera não leia o QR"
            className="ticket-code rounded border border-border bg-surface-2 px-3 py-1 text-sm tracking-wide hover:border-accent"
          >
            {codeCopied ? "Copiado!" : ticket.manual_code}
          </button>
        </div>
        <button onClick={handleShare} className="caption text-accent hover:underline">
          {copied ? "Link copiado!" : "Compartilhar link"}
        </button>
      </div>
    </div>
  );
}
