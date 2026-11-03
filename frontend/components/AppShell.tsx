import type { ReactNode } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Topbar } from "@/components/Topbar";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-bg text-text enterprise-grid">
      <div className="flex min-h-screen bg-bg/92">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar />
          <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-5 pb-24 sm:py-6 lg:px-8 lg:pb-6">{children}</main>
        </div>
      </div>
    </div>
  );
}

