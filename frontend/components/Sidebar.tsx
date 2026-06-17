"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, BarChart3, ClipboardPlus, FileText, Lightbulb, ShieldAlert } from "lucide-react";

const nav = [
  { href: "/dashboard", label: "Vue d'ensemble terrain", icon: BarChart3 },
  { href: "/reports/new", label: "Nouveau rapport de visite", icon: ClipboardPlus },
  { href: "/reports", label: "Rapports de visite", icon: FileText },
  { href: "/signals", label: "Signaux opérationnels", icon: Activity },
  { href: "/actions", label: "Décisions recommandées", icon: Lightbulb },
  { href: "/pharmacy-risk", label: "Pharmacy Risk", icon: ShieldAlert }
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 border-r border-white/10 bg-card/80 px-4 py-5 lg:block">
      <div className="mb-8 flex items-center gap-3 px-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-md border border-accent/40 bg-accent/10">
          <Activity className="h-5 w-5 text-accent" />
        </div>
        <div>
          <p className="text-sm font-bold text-text">Smart Pharma Intelligence</p>
          <p className="text-xs text-muted">Field Intelligence Platform</p>
        </div>
      </div>
      <nav className="space-y-1">
        {nav.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex h-10 items-center gap-3 rounded-md px-3 text-sm transition ${
                active
                  ? "border border-accent/30 bg-accent/10 text-accent"
                  : "text-muted hover:bg-white/5 hover:text-text"
              }`}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
