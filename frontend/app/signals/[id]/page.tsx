"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, CheckCircle2, Flag, Loader2, Route, UserRound, XCircle } from "lucide-react";
import { api } from "@/lib/api";
import type { SignalDetail } from "@/lib/types";
import { AlertBadge } from "@/components/AlertBadge";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  actionTypeLabel,
  categoryLabel,
  formatDate,
  percent,
  priorityLabel,
  statusLabel
} from "@/lib/format";

export default function SignalAnalysisPage() {
  const params = useParams<{ id: string }>();
  const [detail, setDetail] = useState<SignalDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const id = Number(params.id);
    if (!Number.isFinite(id)) {
      setError("Identifiant de signal invalide");
      setLoading(false);
      return;
    }

    api
      .signalDetail(id)
      .then(setDetail)
      .catch((caught) => setError(caught instanceof Error ? caught.message : "Impossible de charger l'analyse"))
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) return <State message="Chargement de l'analyse de signal" />;
  if (error) return <State message={error} critical />;
  if (!detail) return <State message="Analyse de signal introuvable" critical />;

  const { signal, source_report: report, next_best_actions: actions } = detail;
  const primaryAction = actions[0];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/signals" className="mb-2 inline-flex items-center gap-2 text-sm text-muted hover:text-text">
            <ArrowLeft className="h-4 w-4" />
            Retour aux signaux
          </Link>
          <h2 className="text-xl font-semibold text-text">Analyse de signal</h2>
          <p className="text-sm text-muted">Lecture opérationnelle du rapport terrain et décision recommandée.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary">
            <CheckCircle2 className="h-4 w-4" />
            Approuver la décision
          </Button>
          <Button variant="secondary">
            <Route className="h-4 w-4" />
            Réassigner
          </Button>
          <Button variant="secondary">
            <Flag className="h-4 w-4" />
            Escalader
          </Button>
          <Button variant="ghost">
            <XCircle className="h-4 w-4" />
            Clôturer
          </Button>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <section className="rounded-lg border border-white/10 bg-card p-5 shadow-glow">
          <h3 className="mb-4 text-base font-semibold text-text">Rapport source</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Délégué" value={report.delegate_name} />
            <Field label="Date de visite" value={formatDate(report.visit_date)} />
            <Field label="Région" value={report.region} />
            <Field label="Territoire" value={report.territory} />
            <Field label="Prescripteur" value={report.healthcare_provider} />
            <Field label="Institution" value={report.institution ?? "Non renseignée"} />
          </div>
          <div className="mt-5 rounded-md border border-white/10 bg-panel p-4">
            <p className="mb-2 text-xs font-semibold uppercase text-muted">Rapport terrain brut</p>
            <p className="whitespace-pre-wrap text-sm leading-6 text-text">{report.report_text}</p>
          </div>
        </section>

        <section className="rounded-lg border border-white/10 bg-card p-5 shadow-glow">
          <div className="rounded-lg border border-accent/20 bg-accent/10 p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase text-accent">Intelligence extraite</p>
                <h3 className="mt-2 text-lg font-semibold text-text">{signal.title}</h3>
              </div>
              <AlertBadge severity={signal.severity} />
            </div>
            <div className="mt-5 flex flex-wrap items-end gap-5">
              <div>
                <p className="text-xs font-semibold uppercase text-muted">Score d'urgence</p>
                <p className="mt-1 text-6xl font-semibold leading-none text-text">{Math.round(signal.urgency_score)}</p>
              </div>
              <div className="rounded-md border border-white/10 bg-bg/50 p-3">
                <p className="text-xs font-semibold uppercase text-muted">Confiance</p>
                <p className="mt-1 text-2xl font-semibold text-text">{percent(signal.confidence_score)}</p>
              </div>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <Score label="Catégorie" value={categoryLabel(signal.category)} />
            <Score label="Statut" value={statusLabel(signal.status)} />
          </div>

          <div className="mt-5">
            <p className="mb-2 text-xs font-semibold uppercase text-muted">Entités détectées</p>
            <div className="flex flex-wrap gap-2">
              {signal.detected_entities.length ? (
                signal.detected_entities.map((entity) => (
                  <Badge key={entity} tone="neutral">
                    {entity}
                  </Badge>
                ))
              ) : (
                <span className="text-sm text-muted">Aucune entité structurée</span>
              )}
            </div>
          </div>

          <div className="mt-5 rounded-md border border-accent/20 bg-accent/10 p-4">
            <p className="mb-2 text-xs font-semibold uppercase text-accent">Décision recommandée</p>
            <p className="text-sm leading-6 text-text">{signal.recommended_action}</p>
          </div>

          {primaryAction ? (
            <div className="mt-5 rounded-md border border-white/10 bg-panel p-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-xs font-semibold uppercase text-muted">Décision principale</p>
                  <h4 className="mt-1 text-base font-semibold text-text">{primaryAction.title}</h4>
                </div>
                <Badge tone={primaryAction.priority === "urgent" ? "critical" : primaryAction.priority === "high" ? "warning" : "cyan"}>
                  {priorityLabel(primaryAction.priority)}
                </Badge>
              </div>
              <p className="text-sm leading-6 text-muted">{primaryAction.rationale}</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <Field label="Type" value={actionTypeLabel(primaryAction.action_type)} />
                <Field label="Responsable suggéré" value={primaryAction.suggested_owner} icon={<UserRound className="h-4 w-4 text-accent" />} />
                <Field label="Échéance" value={`${primaryAction.due_in_days} jour(s)`} />
              </div>
            </div>
          ) : (
            <div className="mt-5 rounded-md border border-white/10 bg-panel p-4 text-sm text-muted">
              Aucune décision recommandée liée à ce signal.
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function Field({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="rounded-md border border-white/10 bg-bg/50 p-3">
      <p className="mb-1 text-xs font-semibold uppercase text-muted">{label}</p>
      <div className="flex items-center gap-2 text-sm text-text">
        {icon}
        <span>{value}</span>
      </div>
    </div>
  );
}

function Score({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-white/10 bg-panel p-4">
      <p className="text-xs font-semibold uppercase text-muted">{label}</p>
      <p className="mt-2 text-base font-semibold text-text">{value}</p>
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
