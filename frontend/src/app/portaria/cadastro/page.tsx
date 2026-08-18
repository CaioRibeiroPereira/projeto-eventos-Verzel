"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { ApiError, registerGate } from "@/lib/api";

export default function CadastroPortariaPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await registerGate({ name, email, password, code });
      await login(email, password);
      router.push("/portaria");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível criar a conta.");
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
        <h1 className="movie-title mb-1 !text-2xl">Cadastro da portaria</h1>
        <p className="label mb-6">Use a credencial do seu crachá para criar sua conta.</p>

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

        <label className="label mb-1 block" htmlFor="code">
          Código do crachá
        </label>
        <input
          id="code"
          type="text"
          required
          placeholder="GATE-001"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="ticket-code mb-4 w-full rounded border border-border bg-surface-2 px-3 py-2 outline-none focus:border-accent"
        />

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
          <Link href="/login?next=/portaria" className="text-accent">
            Entrar
          </Link>
        </p>
      </form>
    </main>
  );
}
