"use client";

import { usePathname } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { CinemaBackdrop } from "@/components/cinema-backdrop";
import { AdminShell } from "@/components/admin-shell";

const ADMIN_PREFIXES = ["/organizador", "/portaria"];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user } = useAuth();

  const isAdminPath = ADMIN_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
  const isAdminUserOnSharedRoute =
    pathname === "/perfil" && (user?.role === "organizer" || user?.role === "gate");

  if (isAdminPath || isAdminUserOnSharedRoute) {
    return <AdminShell>{children}</AdminShell>;
  }

  return (
    <div className="relative flex min-h-full flex-1 flex-col">
      <CinemaBackdrop />
      <SiteHeader />
      {children}
      <SiteFooter />
    </div>
  );
}
