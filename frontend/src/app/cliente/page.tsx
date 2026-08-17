"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRoleGuard } from "@/hooks/use-role-guard";
import { TicketCard } from "@/components/ticket-card";
import { listMyTickets, type Ticket } from "@/lib/api";

export default function ClientePage() {
  const { ready } = useRoleGuard("customer");
  return ready ? <MeusIngressos /> : null;
}

function MeusIngressos() {
  const { user } = useRoleGuard("customer");
  const [tickets, setTickets] = useState<Ticket[] | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    if (!token) return;
    listMyTickets(token).then(setTickets);
  }, []);

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-6 py-10">
      <div>
        <h1 className="movie-title !text-2xl">Meus ingressos</h1>
        <p className="label">Olá, {user!.name}</p>
      </div>

      {tickets === null && (
        <div className="flex flex-col gap-4">
          {[0, 1].map((i) => (
            <div key={i} className="h-40 animate-pulse rounded-lg border border-border bg-surface-1" />
          ))}
        </div>
      )}

      {tickets?.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border py-16 text-center">
          <p className="label">Você ainda não tem ingressos.</p>
          <Link
            href="/"
            className="rounded bg-accent px-4 py-2 text-sm font-medium text-on-accent hover:bg-accent-hover"
          >
            Ver eventos em cartaz
          </Link>
        </div>
      )}

      <div className="flex flex-col gap-4">
        {tickets?.map((ticket) => (
          <TicketCard key={ticket.id} ticket={ticket} />
        ))}
      </div>
    </main>
  );
}
