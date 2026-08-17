import Link from "next/link";
import { Logo } from "@/components/logo";

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
  return (
    <footer className="border-t border-border px-6 py-10">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 sm:flex-row sm:justify-between">
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
    </footer>
  );
}
