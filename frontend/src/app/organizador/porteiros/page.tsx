"use client";

import { useEffect, useState } from "react";
import { useRoleGuard } from "@/hooks/use-role-guard";
import { ApiError, createGateStaff, listGateStaff, type GateStaff } from "@/lib/api";

export default function PorteirosPage() {
  const { ready } = useRoleGuard("organizer");
  return ready ? <Porteiros /> : null;
}

function Porteiros() {
  const { token } = useRoleGuard("organizer");
  const [staff, setStaff] = useState<GateStaff[] | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) return;
    listGateStaff(token).then(setStaff);
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setError(null);
    setSubmitting(true);
    try {
      const created = await createGateStaff(token, { name, email, password });
      setStaff((prev) => [...(prev ?? []), created]);
      setName("");
      setEmail("");
      setPassword("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível cadastrar o porteiro.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-6 py-10">
      <div>
        <h1 className="movie-title !text-2xl">Equipe da portaria</h1>
        <p className="label">Cadastre quem vai validar ingressos na entrada dos seus eventos.</p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-3 rounded-lg border border-border bg-surface-1 p-5 sm:flex-row sm:flex-wrap sm:items-end"
      >
        <div className="flex flex-1 flex-col gap-1">
          <label className="label" htmlFor="name">
            Nome
          </label>
          <input
            id="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded border border-border bg-surface-2 px-3 py-2 text-text outline-none focus:border-accent"
          />
        </div>

        <div className="flex flex-1 flex-col gap-1">
          <label className="label" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded border border-border bg-surface-2 px-3 py-2 text-text outline-none focus:border-accent"
          />
        </div>

        <div className="flex flex-1 flex-col gap-1">
          <label className="label" htmlFor="password">
            Senha
          </label>
          <input
            id="password"
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded border border-border bg-surface-2 px-3 py-2 text-text outline-none focus:border-accent"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="rounded bg-accent px-4 py-2 font-medium text-on-accent hover:bg-accent-hover disabled:opacity-60"
        >
          {submitting ? "Cadastrando..." : "Cadastrar porteiro"}
        </button>

        {error && <p className="w-full text-sm text-red">{error}</p>}
      </form>

      {staff === null && (
        <div className="flex flex-col gap-3">
          {[0, 1].map((i) => (
            <div key={i} className="h-14 animate-pulse rounded-lg border border-border bg-surface-1" />
          ))}
        </div>
      )}

      {staff?.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border py-16 text-center">
          <p className="label">Nenhum porteiro cadastrado ainda.</p>
        </div>
      )}

      <div className="flex flex-col gap-2">
        {staff?.map((s) => (
          <div
            key={s.id}
            className="flex items-center justify-between rounded-lg border border-border bg-surface-1 px-4 py-3"
          >
            <div>
              <p className="text-text">{s.name}</p>
              <p className="caption">{s.email}</p>
            </div>
            <span className="rounded bg-bg-success px-2 py-0.5 text-xs text-text-success">Ativo</span>
          </div>
        ))}
      </div>
    </main>
  );
}
