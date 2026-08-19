"use client";

import { useState } from "react";
import Link from "next/link";
import { ApiError, sendContactMessage } from "@/lib/api";

export default function ContatoPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await sendContactMessage({ name, email, message, origin: "contato" });
      setSent(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível enviar. Tente de novo.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-6 py-14">
      <div className="flex flex-col gap-3">
        <h1 className="movie-title !text-2xl">Contato</h1>
        <p className="leading-relaxed text-text-secondary">
          Dúvidas, sugestões ou problemas com um ingresso? Preencha o formulário abaixo.
          Para questões de parceria ou sessões corporativas, veja a página de{" "}
          <Link href="/para-empresas" className="text-accent hover:underline">
            para empresas
          </Link>
          .
        </p>
      </div>

      {sent ? (
        <div className="rounded-xl border border-border-success bg-bg-success p-6 text-text-success">
          Mensagem enviada! Vamos entrar em contato em breve.
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-4 rounded-xl border border-border bg-surface-1 p-6"
        >
          <div className="flex flex-col gap-1">
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
          <div className="flex flex-col gap-1">
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
          <div className="flex flex-col gap-1">
            <label className="label" htmlFor="message">
              Mensagem
            </label>
            <textarea
              id="message"
              required
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="resize-none rounded border border-border bg-surface-2 px-3 py-2 text-text outline-none focus:border-accent"
            />
          </div>

          {error && <p className="text-sm text-red">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-fit rounded-lg bg-accent px-6 py-3 font-medium text-on-accent hover:bg-accent-hover disabled:opacity-60"
          >
            {submitting ? "Enviando..." : "Enviar mensagem"}
          </button>
        </form>
      )}
    </main>
  );
}
