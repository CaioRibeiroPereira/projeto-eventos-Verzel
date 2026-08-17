"use client";

import Link from "next/link";
import { useAuth } from "@/context/auth-context";

const ROLE_HOME: Record<string, string> = {
  organizer: "/organizador",
  customer: "/cliente",
  gate: "/portaria",
};

export function SiteHeader() {
  const { user, logout, loading } = useAuth();

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-bg/85 px-6 py-3 backdrop-blur-md">
      <Link href="/" className="flex items-center gap-2 text-accent transition-opacity hover:opacity-80">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
          <rect x="3" y="6" width="18" height="14" rx="1.5" />
          <path d="M3 6l3-3h3l-3 3M9 6l3-3h3l-3 3M15 6l3-3h3l-3 3" strokeLinejoin="round" />
        </svg>
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
