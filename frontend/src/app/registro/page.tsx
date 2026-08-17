"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { ApiError, register } from "@/lib/api";

const ROLE_HOME: Record<string, string> = {
  organizer: "/organizador",
  customer: "/cliente",
};

export default function RegistroPage() {
  return (
    <Suspense
      fallback={
        <main className="flex flex-1 items-center justify-center">
          <p className="label">Carregando...</p>
        </main>
      }
    >
      <RegistroForm />
    </Suspense>
  );
}

function RegistroForm() {
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"customer" | "organizer">("customer");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await register({ name, email, password, role });
      const user = await login(email, password);
      router.push(next || ROLE_HOME[user.role] || "/");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível criar a conta.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-lg border border-border bg-surface-1 p-8"
      >
        <h1 className="movie-title mb-6 !text-2xl">Criar conta</h1>

        <label className="label mb-1 block" htmlFor="name">
          Nome
        </label>
        <input
          id="name"
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mb-4 w-full rounded border border-border bg-surface-2 px-3 py-2 text-text outline-none focus:border-accent"
        />

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
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mb-4 w-full rounded border border-border bg-surface-2 px-3 py-2 text-text outline-none focus:border-accent"
        />

        <span className="label mb-1 block">Tipo de conta</span>
        <div className="mb-4 flex gap-2">
          <button
            type="button"
            onClick={() => setRole("customer")}
            className={`flex-1 rounded border px-3 py-2 text-sm transition-colors ${
              role === "customer"
                ? "border-accent bg-accent text-on-accent"
                : "border-border bg-surface-2 text-text-secondary"
            }`}
          >
            Cliente
          </button>
          <button
            type="button"
            onClick={() => setRole("organizer")}
            className={`flex-1 rounded border px-3 py-2 text-sm transition-colors ${
              role === "organizer"
                ? "border-accent bg-accent text-on-accent"
                : "border-border bg-surface-2 text-text-secondary"
            }`}
          >
            Organizador
          </button>
        </div>

        {error && <p className="mb-4 text-sm text-red">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded bg-accent px-4 py-2 font-medium text-on-accent transition-colors hover:bg-accent-hover disabled:opacity-60"
        >
          {submitting ? "Criando conta..." : "Criar conta"}
        </button>

        <p className="caption mt-4 text-center">
          Já tem conta?{" "}
          <Link href={next ? `/login?next=${encodeURIComponent(next)}` : "/login"} className="text-accent">
            Entrar
          </Link>
        </p>
      </form>
    </main>
  );
}
