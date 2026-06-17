"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AlertTriangle, Activity, ArrowRight, CalendarDays, FileText, Gauge, Loader2, Map, RadioTower, ShieldAlert, UserRound } from "lucide-react";
import { api } from "@/lib/api";
import type { BreakdownPoint, DashboardSummary, NextBestAction, PharmacyRiskItem, PharmacyRiskResponse, PharmacyRiskUrgency, Signal, TrendPoint } from "@/lib/types";
import { SignalTrendChart } from "@/components/charts/SignalTrendChart";
import { CategoryBreakdownChart } from "@/components/charts/CategoryBreakdownChart";
import { SeverityDistributionChart } from "@/components/charts/SeverityDistributionChart";
import { AlertBadge } from "@/components/AlertBadge";
import { Badge } from "@/components/ui/Badge";
import { categoryLabel, priorityLabel, urgencyLabel } from "@/lib/format";

type DashboardData = {
  summary: DashboardSummary;
  trends: TrendPoint[];
  categories: BreakdownPoint[];
  severity: BreakdownPoint[];
  signals: Signal[];
  actions: NextBestAction[];
};

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [pharmacyRisk, setPharmacyRisk] = useState<PharmacyRiskResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [pharmacyLoading, setPharmacyLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pharmacyError, setPharmacyError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [summary, trends, categories, severity, signals, actions] = await Promise.all([
          api.dashboardSummary(),
          api.dashboardTrends(),
          api.dashboardCategories(),
          api.dashboardSeverity(),
          api.signals(),
          api.actions()
        ]);
        setData({ summary, trends, categories, severity, signals, actions });
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Could not load dashboard");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  useEffect(() => {
    async function loadPharmacyRisk() {
      try {
        const risks = await api.pharmacyRisks();
        setPharmacyRisk(risks);
      } catch {
        setPharmacyError("Impossible de charger les priorités pharmacies pour le moment.");
      } finally {
        setPharmacyLoading(false);
      }
    }
    loadPharmacyRisk();
  }, []);

  const criticalSignals = useMemo(() => data?.signals.filter((signal) => signal.severity === "critical").slice(0, 4) ?? [], [data]);
  const topPharmacyRisks = useMemo(() => pharmacyRisk?.pharmacies.slice(0, 3) ?? [], [pharmacyRisk]);

  if (loading) return <State message="Chargement de la vue terrain" />;
  if (error) return <State message={error} critical />;
  if (!data) return <State message="Aucune donnée de tableau de bord disponible" />;

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-white/10 bg-card p-5 shadow-glow">
        <p className="text-xs font-semibold uppercase text-accent">Vue d'ensemble terrain</p>
        <h2 className="mt-2 text-xl font-semibold text-text">Smart Pharma Intelligence</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">
          Transformez les remontées terrain en signaux opérationnels, priorisés et actionnables.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <Metric title="Rapports terrain" value={data.summary.total_reports} icon={<FileText className="h-5 w-5" />} />
        <Metric title="Signaux actifs" value={data.summary.total_signals} icon={<Activity className="h-5 w-5" />} />
        <Metric title="Alertes critiques" value={data.summary.critical_alerts} icon={<AlertTriangle className="h-5 w-5" />} alert />
        <Metric title="Signaux non clôturés" value={data.summary.unresolved_signals} icon={<RadioTower className="h-5 w-5" />} />
        <Metric title="Score d'urgence moyen" value={data.summary.average_urgency_score} icon={<Gauge className="h-5 w-5" />} />
      </section>

      <PharmacyRiskPreview
        data={pharmacyRisk}
        topPharmacyRisks={topPharmacyRisks}
        loading={pharmacyLoading}
        error={pharmacyError}
      />

      <section className="grid gap-4 xl:grid-cols-[1.3fr_0.9fr]">
        <SignalTrendChart data={data.trends} />
        <SeverityDistributionChart data={data.severity} />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <CategoryBreakdownChart data={data.categories} />
        <div className="rounded-lg border border-white/10 bg-card p-4">
          <h2 className="mb-4 text-sm font-semibold text-text">Alertes critiques récentes</h2>
          {criticalSignals.length ? (
            <div className="space-y-3">
              {criticalSignals.map((signal) => (
                <div key={signal.id} className="rounded-md border border-white/10 bg-panel p-3">
                  <div className="mb-2 flex flex-wrap gap-2">
                    <AlertBadge severity={signal.severity} />
                    <Badge tone="cyan">{categoryLabel(signal.category)}</Badge>
                  </div>
                  <p className="text-sm font-semibold text-text">{signal.title}</p>
                  <p className="mt-1 text-xs text-muted">{signal.region} / {signal.territory}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted">Aucune alerte critique détectée actuellement.</p>
          )}
        </div>
      </section>

      <section className="rounded-lg border border-white/10 bg-card p-4">
        <h2 className="mb-4 text-sm font-semibold text-text">Dernières décisions recommandées</h2>
        {data.actions.length ? (
          <div className="grid gap-3 lg:grid-cols-2">
            {data.actions.slice(0, 4).map((action) => (
              <div key={action.id} className="rounded-md border border-white/10 bg-panel p-3">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-text">{action.title}</p>
                  <Badge tone={action.priority === "urgent" ? "critical" : action.priority === "high" ? "warning" : "cyan"}>
                    {priorityLabel(action.priority)}
                  </Badge>
                </div>
                <p className="text-xs leading-5 text-muted">{action.rationale}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted">Aucune décision recommandée générée pour le moment.</p>
        )}
      </section>
    </div>
  );
}

function PharmacyRiskPreview({
  data,
  topPharmacyRisks,
  loading,
  error
}: {
  data: PharmacyRiskResponse | null;
  topPharmacyRisks: PharmacyRiskItem[];
  loading: boolean;
  error: string | null;
}) {
  return (
    <section className="rounded-lg border border-white/10 bg-card p-4 shadow-glow">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase text-accent">Priorisation intelligente des pharmacies à risque</p>
          <h2 className="mt-1 text-sm font-semibold text-text">Pharmacy Risk Intelligence</h2>
          <p className="mt-1 text-sm text-muted">Priorisation intelligente des pharmacies à risque et des rotations terrain.</p>
        </div>
        <Link
          href="/pharmacy-risk"
          className="inline-flex h-9 items-center gap-2 rounded-md border border-accent/30 bg-accent/10 px-3 text-sm font-semibold text-accent transition hover:bg-accent/15"
        >
          Voir toutes les priorités
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {loading ? (
        <div className="rounded-md border border-white/10 bg-panel p-4 text-sm text-muted">
          <div className="flex items-center gap-3">
            <Loader2 className="h-4 w-4 animate-spin text-accent" />
            Chargement des priorités pharmacies.
          </div>
        </div>
      ) : error ? (
        <div className="rounded-md border border-warning/30 bg-warning/10 p-4 text-sm text-warning">{error}</div>
      ) : data ? (
        <div className="grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
          <div className="grid gap-3 sm:grid-cols-2">
            <RiskMetric title="Pharmacies critiques" value={data.summary.critical_pharmacies} icon={<AlertTriangle className="h-4 w-4" />} alert />
            <RiskMetric title="Haut risque" value={data.summary.high_risk_pharmacies} icon={<ShieldAlert className="h-4 w-4" />} />
            <RiskMetric title="Zones à surveiller" value={data.summary.zones_requiring_action} icon={<Map className="h-4 w-4" />} />
            <RiskMetric title="Visites suggérées" value={data.summary.suggested_visits_this_week} icon={<CalendarDays className="h-4 w-4" />} />
          </div>

          <div className="rounded-md border border-white/10 bg-panel p-3">
            <h3 className="mb-3 text-sm font-semibold text-text">Top priorités terrain</h3>
            <div className="space-y-3">
              {topPharmacyRisks.map((pharmacy) => (
                <PharmacyPriorityItem key={pharmacy.id} pharmacy={pharmacy} />
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-md border border-white/10 bg-panel p-4 text-sm text-muted">Aucune priorité pharmacie disponible.</div>
      )}
    </section>
  );
}

function PharmacyPriorityItem({ pharmacy }: { pharmacy: PharmacyRiskItem }) {
  return (
    <article className="rounded-md border border-white/10 bg-card p-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-text">{pharmacy.pharmacy_name}</p>
          <p className="mt-1 text-xs text-muted">{pharmacy.city} / {pharmacy.zone}</p>
        </div>
        <div className="flex items-center gap-2">
          <UrgencyBadge urgency={pharmacy.urgency_level} />
          <div className="rounded-md border border-accent/20 bg-accent/10 px-2 py-1 text-xs font-semibold text-accent">
            Score {pharmacy.risk_score}
          </div>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted">
        <UserRound className="h-4 w-4 text-accent" />
        <span className="font-semibold text-text">Rotation suggérée : {pharmacy.suggested_delegate}</span>
      </div>
      <p className="mt-2 text-xs leading-5 text-muted">{shortReason(pharmacy.rotation_reason)}</p>
    </article>
  );
}

function RiskMetric({ title, value, icon, alert = false }: { title: string; value: number; icon: React.ReactNode; alert?: boolean }) {
  return (
    <div className="rounded-md border border-white/10 bg-panel p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase text-muted">{title}</p>
        <div className={alert ? "text-critical" : "text-accent"}>{icon}</div>
      </div>
      <p className="text-2xl font-semibold text-text">{value}</p>
    </div>
  );
}

function Metric({ title, value, icon, alert = false }: { title: string; value: number; icon: React.ReactNode; alert?: boolean }) {
  return (
    <div className="rounded-lg border border-white/10 bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase text-muted">{title}</p>
        <div className={alert ? "text-critical" : "text-accent"}>{icon}</div>
      </div>
      <p className="text-3xl font-semibold text-text">{value}</p>
    </div>
  );
}

function UrgencyBadge({ urgency }: { urgency: PharmacyRiskUrgency }) {
  const tone = urgency === "critical" ? "critical" : urgency === "high" ? "warning" : urgency === "medium" ? "cyan" : "success";
  return <Badge tone={tone}>{urgencyLabel(urgency)}</Badge>;
}

function shortReason(value: string) {
  return value.length > 145 ? `${value.slice(0, 142)}...` : value;
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
