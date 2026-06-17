"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import type { NextBestAction } from "@/lib/types";
import { NextBestActionCard } from "@/components/NextBestActionCard";

export default function ActionsPage() {
  const [actions, setActions] = useState<NextBestAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .actions()
      .then(setActions)
      .catch((caught) => setError(caught instanceof Error ? caught.message : "Impossible de charger les décisions"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <State message="Chargement des décisions recommandées" />;
  if (error) return <State message={error} critical />;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-text">Décisions recommandées</h2>
        <p className="text-sm text-muted">Recommandations opérationnelles générées à partir des signaux terrain.</p>
      </div>
      {actions.length ? (
        <div className="grid gap-4 xl:grid-cols-2">
          {actions.map((action) => (
            <NextBestActionCard key={action.id} action={action} />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-white/10 bg-card p-6 text-sm text-muted">Aucune décision recommandée générée pour le moment.</div>
      )}
    </div>
  );
}

function State({ message, critical = false }: { message: string; critical?: boolean }) {
  return (
    <div className={`rounded-lg border p-6 ${critical ? "border-critical/30 bg-critical/10 text-critical" : "border-white/10 bg-card text-muted"}`}>
      <div className="flex items-center gap-3">
        {!critical ? <Loader2 className="h-5 w-5 animate-spin text-accent" /> : null}
        <span className="text-sm">{message}</span>
      </div>
    </div>
  );
}
