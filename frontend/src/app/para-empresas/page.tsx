"use client";

import { useState } from "react";

export default function ParaEmpresasPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSent(true);
  }

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-10 px-6 py-16">
      <div className="flex flex-col gap-3">
        <span className="label text-accent">Organizadores</span>
        <h1 className="movie-title !text-3xl">Para empresas</h1>
        <p className="leading-relaxed text-text-secondary">
          Salas e produtoras de cinema podem usar o Cine Verzel pra publicar sessões e
          vender ingressos online. Contas de organizador são liberadas por credencial —
          preencha o formulário abaixo que a gente entra em contato.
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
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
              <label className="label" htmlFor="company">
                Empresa
              </label>
              <input
                id="company"
                required
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="rounded border border-border bg-surface-2 px-3 py-2 text-text outline-none focus:border-accent"
              />
            </div>
            <div className="flex flex-col gap-1 sm:col-span-2">
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
            <div className="flex flex-col gap-1 sm:col-span-2">
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
          </div>

          <button
            type="submit"
            className="w-fit rounded-lg bg-accent px-6 py-3 font-medium text-on-accent hover:bg-accent-hover"
          >
            Enviar mensagem
          </button>
        </form>
      )}
    </main>
  );
}
