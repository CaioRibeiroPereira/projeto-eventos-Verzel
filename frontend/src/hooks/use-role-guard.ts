"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import type { UserRole } from "@/lib/api";

export function useRoleGuard(role: UserRole) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user || user.role !== role) router.replace("/login");
  }, [loading, user, role, router]);

  const ready = !loading && !!user && user.role === role;
  return { user, ready, logout };
}
