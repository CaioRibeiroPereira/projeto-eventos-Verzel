"use client";

import { useEffect, useState } from "react";
import { useRoleGuard } from "@/hooks/use-role-guard";
import { TicketCard } from "@/components/ticket-card";
import { listMyTickets, type Ticket } from "@/lib/api";

export default function ClientePage() {
  const { ready } = useRoleGuard("customer");
  return ready ? <MeusIngressos /> : null;
}

function MeusIngressos() {
  const { user, logout } = useRoleGuard("customer");
  const [tickets, setTickets] = useState<Ticket[] | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    if (!token) return;
    listMyTickets(token).then(setTickets);
  }, []);

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-6 py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="movie-title !text-2xl">Meus ingressos</h1>
          <p className="label">Olá, {user!.name}</p>
        </div>
        <button
          onClick={logout}
          className="rounded border border-border px-4 py-2 text-sm text-text-secondary hover:border-accent hover:text-accent"
        >
          Sair
        </button>
      </div>

      {tickets === null && <p className="label">Carregando...</p>}
      {tickets?.length === 0 && (
        <p className="label">Você ainda não tem ingressos.</p>
      )}

      <div className="flex flex-col gap-4">
        {tickets?.map((ticket) => (
          <TicketCard key={ticket.id} ticket={ticket} />
        ))}
      </div>
    </main>
  );
}
