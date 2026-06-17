import Link from "next/link";
import { AlertTriangle, ArrowRight, Gauge, MapPin } from "lucide-react";
import { AlertBadge } from "@/components/AlertBadge";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { categoryLabel, percent, statusLabel } from "@/lib/format";
import type { Signal } from "@/lib/types";

export function SignalCard({ signal }: { signal: Signal }) {
  return (
    <article className="rounded-lg border border-white/10 bg-card p-5 shadow-glow">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <AlertBadge severity={signal.severity} />
            <Badge tone="cyan">{categoryLabel(signal.category)}</Badge>
          </div>
          <h2 className="text-base font-semibold text-text">{signal.title}</h2>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted">
          <Gauge className="h-4 w-4 text-accent" />
          {Math.round(signal.urgency_score)}
        </div>
      </div>
      <p className="text-sm leading-6 text-muted">{signal.summary}</p>
      <div className="mt-4 grid gap-3 border-t border-white/10 pt-4 sm:grid-cols-3">
        <div className="flex items-center gap-2 text-sm text-muted">
          <MapPin className="h-4 w-4 text-accent" />
          {signal.region} / {signal.territory}
        </div>
        <div className="text-sm text-muted">Confiance {percent(signal.confidence_score)}</div>
        <div className="text-sm text-muted">Statut {statusLabel(signal.status)}</div>
      </div>
      <div className="mt-4 rounded-md border border-white/10 bg-panel p-3">
        <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase text-accent">
          <AlertTriangle className="h-4 w-4" />
          Décision recommandée
        </div>
        <p className="text-sm text-text">{signal.recommended_action}</p>
      </div>
      <div className="mt-4 flex justify-end">
        <Link href={`/signals/${signal.id}`}>
          <Button variant="secondary">
            Voir l'analyse
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>
    </article>
  );
}
