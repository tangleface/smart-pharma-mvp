import Link from "next/link";
import { Plus, Radio } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function Topbar() {
  return (
    <header className="flex min-h-16 items-center justify-between gap-3 border-b border-white/10 bg-bg/90 px-4 lg:px-8">
      <div className="min-w-0">
        <p className="hidden text-xs uppercase text-muted sm:block">Plateforme d’intelligence terrain</p>
        <h1 className="truncate text-sm font-semibold text-text sm:text-lg">Smart Pharma Intelligence</h1>
      </div>
      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        <div className="hidden items-center gap-2 rounded-md border border-success/20 bg-success/10 px-3 py-2 text-xs font-semibold text-success md:flex">
          <Radio className="h-4 w-4" />
          Démo active
        </div>
        <Link href="/reports/new">
          <Button className="h-9 px-3 sm:h-10 sm:px-4" aria-label="Nouveau rapport">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Nouveau rapport</span>
          </Button>
        </Link>
      </div>
    </header>
  );
}
