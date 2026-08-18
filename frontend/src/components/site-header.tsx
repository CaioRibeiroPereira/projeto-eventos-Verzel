"use client";

import Link from "next/link";
import { useAuth } from "@/context/auth-context";
import { Logo } from "@/components/logo";
import { GridIcon, ScanIcon, TicketIcon, UserIcon } from "@/components/icons";

const ROLE_HOME_ICON: Record<string, (props: { className?: string }) => React.ReactElement> = {
  organizer: GridIcon,
  customer: TicketIcon,
  gate: ScanIcon,
};

const ROLE_HOME: Record<string, string> = {
  organizer: "/organizador",
  customer: "/cliente",
  gate: "/portaria",
};

const ROLE_HOME_LABEL: Record<string, string> = {
  organizer: "Gerencie eventos",
  customer: "Meus ingressos",
  gate: "Portaria",
};

const NAV_LINKS = [
  { href: "/sobre", label: "Sobre" },
  { href: "/para-empresas", label: "Para empresas" },
  { href: "/parcerias", label: "Parcerias" },
  { href: "/contato", label: "Contato" },
];

export function SiteHeader() {
  const { user, loading } = useAuth();

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
              href={ROLE_HOME[user.role]}
              className="flex items-center gap-1.5 text-base text-text hover:text-accent"
            >
              {(() => {
                const Icon = ROLE_HOME_ICON[user.role];
                return <Icon className="h-4 w-4" />;
              })()}
              {ROLE_HOME_LABEL[user.role]}
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
