"use client";

import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import {
  BarcodeIcon,
  ClockIcon,
  CreditCardIcon,
  PixIcon,
} from "@/components/icons";
import { formatPrice } from "@/lib/format";

type Method = "card" | "pix" | "boleto" | "counter";

const METHODS: { id: Method; label: string; icon: (p: { className?: string }) => React.ReactElement }[] = [
  { id: "card", label: "Cartão de crédito", icon: CreditCardIcon },
  { id: "pix", label: "PIX", icon: PixIcon },
  { id: "boleto", label: "Boleto", icon: BarcodeIcon },
  { id: "counter", label: "Pagar na hora do filme", icon: ClockIcon },
];

function formatCardNumber(value: string) {
  return value
    .replace(/\D/g, "")
    .slice(0, 16)
    .replace(/(.{4})/g, "$1 ")
    .trim();
}

function formatExpiry(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  return digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
}

export function PaymentPanel({
  total,
  seatLabels,
  busy,
  error,
  onApprove,
  onDecline,
}: {
  total: number;
  seatLabels: string[];
  busy: boolean;
  error: string | null;
  onApprove: () => void;
  onDecline: () => void;
}) {
  const [method, setMethod] = useState<Method | null>(null);
  const [card, setCard] = useState({ number: "", name: "", expiry: "", cvv: "" });

  const cardValid =
    card.number.replace(/\s/g, "").length >= 16 && card.name.trim().length > 2 && card.expiry.length === 5 && card.cvv.length >= 3;

  const seatLabel = seatLabels.join(", ");

  return (
    <div className="mx-auto flex w-full max-w-sm flex-col gap-4 rounded-lg border border-border bg-surface-1 p-6">
      <div>
        <h2 className="text-lg font-medium">Pagamento</h2>
        <p className="label">
          {seatLabels.length > 1 ? "Assentos" : "Assento"} {seatLabel} — {formatPrice(total)}
        </p>
      </div>

      {!method && (
        <div className="grid grid-cols-2 gap-2">
          {METHODS.map((m) => (
            <button
              key={m.id}
              onClick={() => setMethod(m.id)}
              className="flex flex-col items-center gap-2 rounded-lg border border-border bg-surface-2 px-3 py-4 text-center transition-colors hover:border-accent"
            >
              <m.icon className="h-6 w-6 text-accent" />
              <span className="caption text-text">{m.label}</span>
            </button>
          ))}
        </div>
      )}

      {method && (
        <div className="flex flex-col gap-4">
          <button
            onClick={() => setMethod(null)}
            className="w-fit caption text-accent hover:underline"
          >
            ← Trocar forma de pagamento
          </button>

          {method === "card" && (
            <div className="flex flex-col gap-3">
              <input
                placeholder="Número do cartão"
                value={card.number}
                onChange={(e) => setCard({ ...card, number: formatCardNumber(e.target.value) })}
                className="ticket-code rounded border border-border bg-surface-2 px-3 py-2 outline-none focus:border-accent"
              />
              <input
                placeholder="Nome impresso no cartão"
                value={card.name}
                onChange={(e) => setCard({ ...card, name: e.target.value })}
                className="rounded border border-border bg-surface-2 px-3 py-2 text-sm text-text outline-none focus:border-accent"
              />
              <div className="flex gap-3">
                <input
                  placeholder="MM/AA"
                  value={card.expiry}
                  onChange={(e) => setCard({ ...card, expiry: formatExpiry(e.target.value) })}
                  className="ticket-code w-24 rounded border border-border bg-surface-2 px-3 py-2 outline-none focus:border-accent"
                />
                <input
                  placeholder="CVV"
                  value={card.cvv}
                  onChange={(e) => setCard({ ...card, cvv: e.target.value.replace(/\D/g, "").slice(0, 4) })}
                  className="ticket-code w-20 rounded border border-border bg-surface-2 px-3 py-2 outline-none focus:border-accent"
                />
              </div>
              <button
                onClick={onApprove}
                disabled={busy || !cardValid}
                className="rounded bg-accent px-4 py-2 font-medium text-on-accent hover:bg-accent-hover disabled:opacity-60"
              >
                {busy ? "Processando..." : "Finalizar pagamento"}
              </button>
              <button onClick={onDecline} disabled={busy} className="caption text-text-muted hover:text-red">
                Simular cartão recusado
              </button>
            </div>
          )}

          {method === "pix" && (
            <div className="flex flex-col items-center gap-3">
              <div className="rounded bg-white p-2">
                <QRCodeSVG value={`00020126pix-simulado-${seatLabel}-${total}`} size={140} />
              </div>
              <p className="caption text-center">
                Escaneie o QR no app do seu banco. Isso é uma simulação, nenhuma cobrança real é feita.
              </p>
              <button
                onClick={onApprove}
                disabled={busy}
                className="w-full rounded bg-accent px-4 py-2 font-medium text-on-accent hover:bg-accent-hover disabled:opacity-60"
              >
                {busy ? "Confirmando..." : "Já paguei"}
              </button>
              <button onClick={onDecline} disabled={busy} className="caption text-text-muted hover:text-red">
                Simular PIX não pago
              </button>
            </div>
          )}

          {method === "boleto" && (
            <div className="flex flex-col items-center gap-3">
              <BarcodeIcon className="h-16 w-full text-text" />
              <p className="ticket-code text-center text-xs">34191.79001 01043.510047 91020.150008 1 98760000003550</p>
              <p className="caption">Vencimento em 3 dias úteis.</p>
              <button
                onClick={onApprove}
                disabled={busy}
                className="w-full rounded bg-accent px-4 py-2 font-medium text-on-accent hover:bg-accent-hover disabled:opacity-60"
              >
                {busy ? "Confirmando..." : "Já paguei o boleto"}
              </button>
              <button onClick={onDecline} disabled={busy} className="caption text-text-muted hover:text-red">
                Simular boleto não pago
              </button>
            </div>
          )}

          {method === "counter" && (
            <div className="flex flex-col items-center gap-3 text-center">
              <ClockIcon className="h-10 w-10 text-accent" />
              <p className="label">
                Seu assento fica reservado e o pagamento é feito na bilheteria antes da sessão.
              </p>
              <button
                onClick={onApprove}
                disabled={busy}
                className="w-full rounded bg-accent px-4 py-2 font-medium text-on-accent hover:bg-accent-hover disabled:opacity-60"
              >
                {busy ? "Confirmando..." : "Confirmar reserva"}
              </button>
            </div>
          )}

          {error && <p className="text-center text-sm text-red">{error}</p>}
        </div>
      )}
    </div>
  );
}
