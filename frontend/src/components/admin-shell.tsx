"use client";

import { usePathname } from "next/navigation";
import { AdminSidebar } from "@/components/admin-sidebar";

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isGate = pathname?.startsWith("/portaria");

  return (
    <div
      className={`theme-admin ${isGate ? "theme-gate" : ""} flex min-h-screen w-full flex-col bg-bg text-text md:flex-row`}
    >
      <AdminSidebar />
      <div className="flex flex-1 flex-col">{children}</div>
    </div>
  );
}
