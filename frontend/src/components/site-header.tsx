"use client";

import Link from "next/link";
import { useAuth } from "@/context/auth-context";
import { Logo } from "@/components/logo";

const ROLE_HOME: Record<string, string> = {
  organizer: "/organizador",
  customer: "/cliente",
  gate: "/portaria",
};

export function SiteHeader() {
  const { user, logout, loading } = useAuth();

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-bg/85 px-6 py-3 backdrop-blur-md">
      <Link href="/" className="transition-opacity hover:opacity-80">
        <Logo />
      </Link>

      {!loading &&
        (user ? (
          <div className="flex items-center gap-3">
            <Link href={ROLE_HOME[user.role]} className="label text-text hover:text-accent">
              {user.name}
            </Link>
            <button onClick={logout} className="caption text-text-secondary hover:text-accent">
              Sair
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <Link
              href="/login"
              className="rounded px-3 py-1.5 text-sm text-text-secondary hover:text-accent"
            >
              Entrar
            </Link>
            <Link
              href="/registro"
              className="rounded bg-accent px-3 py-1.5 text-sm font-medium text-on-accent hover:bg-accent-hover"
            >
              Criar conta
            </Link>
          </div>
        ))}
    </header>
  );
}
