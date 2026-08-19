"use client";

import { useEffect, useState } from "react";
import { useRoleGuard } from "@/hooks/use-role-guard";
import { listContactMessages, type ContactMessage } from "@/lib/api";
import { formatDateTime } from "@/lib/format";

const ORIGIN_LABEL: Record<string, string> = {
  contato: "Contato",
  "para-empresas": "Para empresas",
};

export default function MensagensPage() {
  const { ready } = useRoleGuard("organizer");
  return ready ? <Mensagens /> : null;
}

function Mensagens() {
  const { token } = useRoleGuard("organizer");
  const [messages, setMessages] = useState<ContactMessage[] | null>(null);

  useEffect(() => {
    if (!token) return;
    listContactMessages(token).then(setMessages);
  }, [token]);

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-6 py-10">
      <div>
        <h1 className="movie-title !text-2xl">Mensagens</h1>
        <p className="label">Contatos recebidos pelo site (contato e para empresas)</p>
      </div>

      {messages === null && (
        <div className="flex flex-col gap-4">
          {[0, 1].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-lg border border-border bg-surface-1" />
          ))}
        </div>
      )}

      {messages?.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border py-16 text-center">
          <p className="label">Nenhuma mensagem recebida ainda.</p>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {messages?.map((msg) => (
          <div key={msg.id} className="flex flex-col gap-2 rounded-lg border border-border bg-surface-1 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-text">{msg.name}</span>
                {msg.company && <span className="caption">— {msg.company}</span>}
              </div>
              <span className="rounded bg-surface-2 px-2 py-0.5 text-xs text-text-secondary">
                {ORIGIN_LABEL[msg.origin] ?? msg.origin}
              </span>
            </div>
            <p className="ticket-code text-sm">{msg.email}</p>
            <p className="leading-relaxed text-text-secondary">{msg.message}</p>
            <p className="caption">{formatDateTime(msg.created_at)}</p>
          </div>
        ))}
      </div>
    </main>
  );
}
