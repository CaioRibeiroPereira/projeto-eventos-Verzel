"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { ApiError } from "@/lib/api";

const ROLE_HOME: Record<string, string> = {
  organizer: "/organizador",
  gate: "/portaria",
  customer: "/cliente",
};

export default function LoginOrganizadorPage() {
  const { user, loading, login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) router.replace(ROLE_HOME[user.role]);
  }, [loading, user, router]);

  if (loading || user) {
    return (
      <main className="flex flex-1 items-center justify-center">
        <p className="label">Carregando...</p>
      </main>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
      router.push("/organizador");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível entrar.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-16">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-lg border border-border bg-surface-1 p-8"
      >
        <h1 className="movie-title mb-6 !text-2xl">Entrar — Organizador</h1>

        <label className="label mb-1 block" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mb-4 w-full rounded border border-border bg-surface-2 px-3 py-2 text-text outline-none focus:border-accent"
        />

        <label className="label mb-1 block" htmlFor="password">
          Senha
        </label>
        <input
          id="password"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mb-4 w-full rounded border border-border bg-surface-2 px-3 py-2 text-text outline-none focus:border-accent"
        />

        {error && <p className="mb-4 text-sm text-red">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded bg-accent px-4 py-2 font-medium text-on-accent transition-colors hover:bg-accent-hover disabled:opacity-60"
        >
          {submitting ? "Entrando..." : "Entrar"}
        </button>

        <p className="caption mt-4 text-center">
          Ainda não tem conta?{" "}
          <Link href="/organizador/cadastro" className="text-accent">
            Cadastre-se com sua credencial
          </Link>
        </p>
      </form>
    </main>
  );
}
