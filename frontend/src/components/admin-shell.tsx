import { AdminSidebar } from "@/components/admin-sidebar";

export function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="theme-admin flex min-h-screen w-full bg-bg text-text">
      <AdminSidebar />
      <div className="flex flex-1 flex-col">{children}</div>
    </div>
  );
}
