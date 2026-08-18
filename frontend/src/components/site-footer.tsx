"use client";

import Link from "next/link";
import { useAuth } from "@/context/auth-context";
import { Logo } from "@/components/logo";
import { BuildingIcon, ScanIcon } from "@/components/icons";

const COLUMNS: { title: string; links: { href: string; label: string }[] }[] = [
  {
    title: "Empresa",
    links: [
      { href: "/sobre", label: "Sobre" },
      { href: "/para-empresas", label: "Para empresas" },
      { href: "/parcerias", label: "Parcerias" },
      { href: "/trabalhe-conosco", label: "Trabalhe conosco" },
    ],
  },
  {
    title: "Ajuda",
    links: [
      { href: "/faq", label: "Perguntas frequentes" },
      { href: "/contato", label: "Contato" },
      { href: "/acessibilidade", label: "Acessibilidade" },
    ],
  },
];

export function SiteFooter() {
  const { user } = useAuth();

  return (
    <footer className="border-t border-border px-6 py-10">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-8">
        <div className="flex flex-col gap-8 sm:flex-row sm:justify-between">
          <Link href="/" className="w-fit transition-opacity hover:opacity-80">
            <Logo />
          </Link>

          <div className="flex flex-wrap gap-12">
            {COLUMNS.map((column) => (
              <div key={column.title} className="flex flex-col gap-3">
                <h3 className="text-base font-medium text-text-secondary">{column.title}</h3>
                {column.links.map((link) => (
                  <Link key={link.href} href={link.href} className="text-base text-text-secondary hover:text-accent">
                    {link.label}
                  </Link>
                ))}
              </div>
            ))}
          </div>
        </div>

        {!user && (
          <div className="flex flex-col items-end gap-2 border-t border-border pt-6">
            <Link
              href="/login?next=/portaria"
              className="flex items-center gap-1.5 rounded border border-border px-3 py-1.5 text-sm text-text-secondary hover:border-accent hover:text-accent"
            >
              <ScanIcon className="h-4 w-4" />
              Acesso da portaria
            </Link>
            <Link
              href="/login?next=/organizador"
              className="flex items-center gap-1.5 rounded border border-border px-3 py-1.5 text-sm text-text-secondary hover:border-accent hover:text-accent"
            >
              <BuildingIcon className="h-4 w-4" />
              Acesso da organização
            </Link>
          </div>
        )}
      </div>
    </footer>
  );
}
