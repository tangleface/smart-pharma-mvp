"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import type { Signal } from "@/lib/types";
import { SignalCard } from "@/components/SignalCard";

export default function SignalsPage() {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .signals()
      .then(setSignals)
      .catch((caught) => setError(caught instanceof Error ? caught.message : "Impossible de charger les signaux"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <State message="Chargement des signaux opérationnels" />;
  if (error) return <State message={error} critical />;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-text">Signaux opérationnels</h2>
        <p className="text-sm text-muted">Signaux structurés générés à partir des rapports de visite.</p>
      </div>
      {signals.length ? signals.map((signal) => <SignalCard key={signal.id} signal={signal} />) : <Empty />}
    </div>
  );
}

function Empty() {
  return <div className="rounded-lg border border-white/10 bg-card p-6 text-sm text-muted">Aucun signal opérationnel détecté pour le moment.</div>;
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
