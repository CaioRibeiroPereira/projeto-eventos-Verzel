"use client";

import Link from "next/link";
import { useAuth } from "@/context/auth-context";
import { Logo } from "@/components/logo";
import { TicketIcon, UserIcon } from "@/components/icons";

const NAV_LINKS = [
  { href: "/sobre", label: "Sobre" },
  { href: "/para-empresas", label: "Para empresas" },
  { href: "/parcerias", label: "Parcerias" },
  { href: "/contato", label: "Contato" },
];

export function SiteHeader() {
  const { user: sessionUser, loading } = useAuth();
  // Sessão de organizador/portaria não vale nada aqui — a área do cliente
  // não reflete login das outras duas, mesmo estando no mesmo navegador.
  const user = sessionUser?.role === "customer" ? sessionUser : null;

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between gap-4 border-b border-border bg-bg/85 px-6 py-3 backdrop-blur-md">
      <Link href="/" className="shrink-0 transition-opacity hover:opacity-80">
        <Logo />
      </Link>

      <nav className="hidden flex-1 items-center justify-center gap-6 md:flex">
        {NAV_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="text-base text-text-secondary hover:text-accent"
          >
            {link.label}
          </Link>
        ))}
      </nav>

      {!loading &&
        (user ? (
          <div className="flex shrink-0 items-center gap-4">
            <Link
              href="/cliente"
              className="flex items-center gap-1.5 text-base text-text hover:text-accent"
            >
              <TicketIcon className="h-4 w-4" />
              Meus ingressos
            </Link>
            <Link
              href="/perfil"
              className="flex items-center gap-1.5 text-base text-text-secondary hover:text-accent"
            >
              <UserIcon className="h-4 w-4" />
              Meu perfil
            </Link>
          </div>
        ) : (
          <div className="flex shrink-0 gap-2">
            <Link
              href="/login"
              className="rounded px-3 py-1.5 text-base text-text-secondary hover:text-accent"
            >
              Entrar
            </Link>
            <Link
              href="/registro"
              className="rounded bg-accent px-3 py-1.5 text-base font-medium text-on-accent hover:bg-accent-hover"
            >
              Criar conta
            </Link>
          </div>
        ))}
    </header>
  );
}
