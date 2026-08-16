"use client";

import { useRoleGuard } from "@/hooks/use-role-guard";
import type { UserRole } from "@/lib/api";

export function RoleGate({
  role,
  label,
}: {
  role: UserRole;
  label: string;
}) {
  const { user, ready, logout } = useRoleGuard(role);

  if (!ready) return null;

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="movie-title">{label}</h1>
      <p className="label">
        Olá, {user!.name}. Esta área entra nas próximas fases.
      </p>
      <button
        onClick={logout}
        className="rounded border border-border px-4 py-2 text-sm text-text-secondary hover:border-accent hover:text-accent"
      >
        Sair
      </button>
    </main>
  );
}
