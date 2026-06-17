import Link from "next/link";
import { Plus, Radio } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function Topbar() {
  return (
    <header className="flex min-h-16 items-center justify-between border-b border-white/10 bg-bg/90 px-4 lg:px-8">
      <div>
        <p className="text-xs uppercase text-muted">Field Intelligence Platform</p>
        <h1 className="text-lg font-semibold text-text">Smart Pharma Intelligence</h1>
      </div>
      <div className="flex items-center gap-3">
        <div className="hidden items-center gap-2 rounded-md border border-success/20 bg-success/10 px-3 py-2 text-xs font-semibold text-success sm:flex">
          <Radio className="h-4 w-4" />
          Live Local MVP
        </div>
        <Link href="/reports/new">
          <Button>
            <Plus className="h-4 w-4" />
            Rapport
          </Button>
        </Link>
      </div>
    </header>
  );
}
