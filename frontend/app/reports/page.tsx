"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import type { Report } from "@/lib/types";
import { Badge } from "@/components/ui/Badge";
import { formatDate } from "@/lib/format";

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .reports()
      .then(setReports)
      .catch((caught) => setError(caught instanceof Error ? caught.message : "Impossible de charger les rapports"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <State message="Chargement des rapports de visite" />;
  if (error) return <State message={error} critical />;

  return (
    <div className="rounded-lg border border-white/10 bg-card">
      <div className="border-b border-white/10 p-5">
        <h2 className="text-lg font-semibold text-text">Rapports de visite</h2>
        <p className="text-sm text-muted">Observations terrain brutes soumises pour analyse opérationnelle.</p>
      </div>
      {reports.length ? (
        <div className="divide-y divide-white/10">
          {reports.map((report) => (
            <article key={report.id} className="grid gap-4 p-5 lg:grid-cols-[1fr_180px_120px]">
              <div>
                <div className="mb-2 flex flex-wrap gap-2">
                  <Badge tone="cyan">{report.region}</Badge>
                  <Badge>{report.territory}</Badge>
                </div>
                <h3 className="font-semibold text-text">{report.healthcare_provider}</h3>
                <p className="mt-1 line-clamp-2 text-sm leading-6 text-muted">{report.report_text}</p>
              </div>
              <div className="text-sm text-muted">
                <p>{report.delegate_name}</p>
                <p>{formatDate(report.visit_date)}</p>
              </div>
              <Badge tone={report.signal_count > 0 ? "success" : "warning"}>{report.signal_count} signaux</Badge>
            </article>
          ))}
        </div>
      ) : (
        <p className="p-5 text-sm text-muted">Aucun rapport de visite soumis pour le moment.</p>
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
