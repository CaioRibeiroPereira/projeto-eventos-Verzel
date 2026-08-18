"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { Logo } from "@/components/logo";
import { GridIcon, LogoutIcon, ScanIcon, UserIcon } from "@/components/icons";

type IconComponent = (props: { className?: string }) => React.ReactElement;

const NAV_ITEMS: Record<"organizer" | "gate", { href: string; label: string; icon: IconComponent }[]> = {
  organizer: [{ href: "/organizador", label: "Gerencie eventos", icon: GridIcon }],
  gate: [{ href: "/portaria", label: "Portaria", icon: ScanIcon }],
};

const ROLE_LABEL: Record<"organizer" | "gate", string> = {
  organizer: "Organizador",
  gate: "Portaria",
};

export function AdminSidebar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  if (!user || (user.role !== "organizer" && user.role !== "gate")) return null;

  const items = [...NAV_ITEMS[user.role], { href: "/perfil", label: "Meu perfil", icon: UserIcon }];

  return (
    <aside className="flex w-56 shrink-0 flex-col border-r border-border bg-surface-1 px-3 py-5">
      <div className="mb-8 px-2">
        <Logo />
        <p className="caption mt-1">{ROLE_LABEL[user.role]}</p>
      </div>

      <nav className="flex flex-1 flex-col gap-1">
        {items.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded px-3 py-2 text-sm transition-colors ${
                active
                  ? "bg-accent text-on-accent"
                  : "text-text-secondary hover:bg-surface-2 hover:text-text"
              }`}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border pt-3">
        <p className="label truncate px-2">{user.name}</p>
        <button
          onClick={logout}
          className="mt-1 flex w-full items-center gap-3 rounded px-3 py-2 text-sm text-text-secondary hover:bg-surface-2 hover:text-text"
        >
          <LogoutIcon className="h-5 w-5" />
          Sair
        </button>
      </div>
    </aside>
  );
}
