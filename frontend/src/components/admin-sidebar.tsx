"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { Logo } from "@/components/logo";
import { GridIcon, MailIcon, ScanIcon, UserIcon, UsersIcon } from "@/components/icons";

type IconComponent = (props: { className?: string }) => React.ReactElement;

const NAV_ITEMS: Record<"organizer" | "gate", { href: string; label: string; icon: IconComponent }[]> = {
  organizer: [
    { href: "/organizador", label: "Gerencie eventos", icon: GridIcon },
    { href: "/organizador/porteiros", label: "Equipe da portaria", icon: UsersIcon },
    { href: "/organizador/mensagens", label: "Mensagens", icon: MailIcon },
    { href: "/organizador/perfil", label: "Meu perfil", icon: UserIcon },
  ],
  gate: [
    { href: "/portaria", label: "Portaria", icon: ScanIcon },
    { href: "/portaria/perfil", label: "Meu perfil", icon: UserIcon },
  ],
};

const ROLE_LABEL: Record<"organizer" | "gate", string> = {
  organizer: "Organizador",
  gate: "Portaria",
};

export function AdminSidebar() {
  const { user } = useAuth();
  const pathname = usePathname();

  if (!user || (user.role !== "organizer" && user.role !== "gate")) return null;

  const items = NAV_ITEMS[user.role];

  return (
    <aside className="flex w-full shrink-0 flex-col border-b border-border bg-surface-1 px-3 py-3 md:h-screen md:w-56 md:border-b-0 md:border-r md:py-5">
      <div className="flex items-center justify-between gap-3 px-2 md:mb-8 md:block">
        <Logo />
        <p className="caption md:mt-1">{ROLE_LABEL[user.role]}</p>
      </div>

      <nav className="mt-3 flex gap-1 overflow-x-auto md:mt-0 md:flex-1 md:flex-col md:overflow-visible">
        {items.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex shrink-0 items-center gap-2 whitespace-nowrap rounded px-3 py-2 text-sm transition-colors md:gap-3 ${
                active
                  ? "bg-accent text-on-accent"
                  : "text-text-secondary hover:bg-surface-2 hover:text-text"
              }`}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="hidden border-t border-border pt-3 md:mt-auto md:block">
        <p className="label truncate px-2">{user.name}</p>
      </div>
    </aside>
  );
}
