"use client";

import { usePathname } from "next/navigation";
import { AdminSidebar } from "@/components/admin-sidebar";
import { AdminCinemaBackdrop } from "@/components/admin-cinema-backdrop";

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isGate = pathname?.startsWith("/portaria");

  return (
    <div
      className={`theme-admin ${isGate ? "theme-gate" : ""} relative isolate flex min-h-screen w-full flex-col bg-bg text-text md:flex-row`}
    >
      <AdminCinemaBackdrop />
      <AdminSidebar />
      <div className="flex flex-1 flex-col">{children}</div>
    </div>
  );
}
