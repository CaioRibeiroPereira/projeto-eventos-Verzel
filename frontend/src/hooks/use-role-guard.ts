"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import type { UserRole } from "@/lib/api";

const LOGIN_HREF: Record<UserRole, string> = {
  organizer: "/organizador/login",
  gate: "/portaria/login",
  customer: "/login",
};

export function useRoleGuard(role: UserRole) {
  const { user, token, loading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user || user.role !== role) router.replace(LOGIN_HREF[role]);
  }, [loading, user, role, router]);

  const ready = !loading && !!user && user.role === role;
  return { user, token, ready, logout };
}
