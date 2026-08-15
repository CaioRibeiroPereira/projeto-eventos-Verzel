"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import type { UserRole } from "@/lib/api";

export function RoleGate({
  role,
  label,
}: {
  role: UserRole;
  label: string;
}) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user || user.role !== role) router.replace("/login");
  }, [loading, user, role, router]);

  if (loading || !user || user.role !== role) return null;

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="movie-title">{label}</h1>
      <p className="label">
        Olá, {user.name}. Esta área entra nas próximas fases.
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
