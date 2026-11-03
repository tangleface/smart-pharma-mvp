"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  BarChart3,
  ClipboardPlus,
  Database,
  FileText,
  Lightbulb,
  Map,
  Menu,
  X
} from "lucide-react";

const nav = [
  { href: "/dashboard", label: "Vue d'ensemble terrain", shortLabel: "Accueil", icon: BarChart3 },
  { href: "/territory-map", label: "Intelligence territoriale", shortLabel: "Carte", icon: Map },
  { href: "/database", label: "Base de données", shortLabel: "Données", icon: Database },
  { href: "/reports/new", label: "Nouveau rapport de visite", shortLabel: "Rapport", icon: ClipboardPlus },
  { href: "/reports", label: "Rapports de visite", shortLabel: "Historique", icon: FileText },
  { href: "/signals", label: "Observations & signaux", shortLabel: "Signaux", icon: Activity },
  { href: "/actions", label: "Actions terrain", shortLabel: "Actions", icon: Lightbulb }
];

const primaryMobileNav = nav.slice(0, 4);

export function Sidebar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === "/reports") return pathname === href;
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <>
      <aside className="hidden w-64 shrink-0 border-r border-white/10 bg-card/80 px-4 py-5 lg:block">
        <div className="mb-8 flex items-center gap-3 px-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-md border border-accent/40 bg-accent/10">
            <Activity className="h-5 w-5 text-accent" />
          </div>
          <div>
            <p className="text-sm font-bold text-text">Smart Pharma Intelligence</p>
            <p className="text-xs text-muted">Intelligence terrain pharmaceutique</p>
          </div>
        </div>
        <nav className="space-y-1">
          {nav.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
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

      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-white/10 bg-bg/95 px-1 pb-[max(env(safe-area-inset-bottom),0.35rem)] pt-2 backdrop-blur lg:hidden">
        {primaryMobileNav.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileMenuOpen(false)}
              className={`flex min-w-0 flex-col items-center gap-1 rounded-md px-1 py-2 text-[10px] font-medium transition ${
                active ? "bg-accent/10 text-accent" : "text-muted"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span className="max-w-full truncate">{item.shortLabel}</span>
            </Link>
          );
        })}
        <button
          type="button"
          onClick={() => setMobileMenuOpen(true)}
          className="flex min-w-0 flex-col items-center gap-1 rounded-md px-1 py-2 text-[10px] font-medium text-muted transition"
          aria-label="Ouvrir le menu"
        >
          <Menu className="h-4 w-4" />
          <span>Menu</span>
        </button>
      </nav>

      {mobileMenuOpen ? (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm lg:hidden" role="dialog" aria-modal="true">
          <button
            type="button"
            className="absolute inset-0"
            aria-label="Fermer le menu"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="absolute inset-x-0 bottom-0 rounded-t-2xl border-t border-white/10 bg-card p-4 pb-[max(env(safe-area-inset-bottom),1rem)] shadow-2xl">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-text">Smart Pharma Intelligence</p>
                <p className="text-xs text-muted">Navigation mobile</p>
              </div>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-md border border-white/10 p-2 text-muted"
                aria-label="Fermer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {nav.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 rounded-lg border px-3 py-3 text-sm transition ${
                      active
                        ? "border-accent/40 bg-accent/10 text-accent"
                        : "border-white/10 bg-panel text-text"
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
