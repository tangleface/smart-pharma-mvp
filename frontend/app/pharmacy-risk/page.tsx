"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CalendarDays, Filter, Loader2, Map as MapIcon, RotateCcw, Route, ShieldAlert, UserRound } from "lucide-react";
import { api } from "@/lib/api";
import type { PharmacyRiskItem, PharmacyRiskResponse, PharmacyRiskUrgency, PharmacyRiskZone } from "@/lib/types";
import { Badge } from "@/components/ui/Badge";
import { urgencyLabel, potentialLabel } from "@/lib/format";

export default function PharmacyRiskPage() {
  const [data, setData] = useState<PharmacyRiskResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [urgencyFilter, setUrgencyFilter] = useState("all");
  const [locationFilter, setLocationFilter] = useState("all");
  const [delegateFilter, setDelegateFilter] = useState("all");

  useEffect(() => {
    api
      .pharmacyRisks()
      .then(setData)
      .catch((caught) => setError(caught instanceof Error ? caught.message : "Impossible de charger les risques pharmacie"))
      .finally(() => setLoading(false));
  }, []);

  const locationOptions = useMemo(() => {
    const options = new Map<string, string>();
    for (const pharmacy of data?.pharmacies ?? []) {
      options.set(`${pharmacy.city}|${pharmacy.zone}`, `${pharmacy.city} / ${pharmacy.zone}`);
    }
    return Array.from(options, ([value, label]) => ({ value, label }));
  }, [data]);

  const delegateOptions = useMemo(() => {
    return Array.from(new Set((data?.pharmacies ?? []).map((pharmacy) => pharmacy.suggested_delegate))).sort();
  }, [data]);

  const filteredPharmacies = useMemo(() => {
    return (data?.pharmacies ?? []).filter((pharmacy) => {
      const matchesUrgency = urgencyFilter === "all" || pharmacy.urgency_level === urgencyFilter;
      const matchesLocation = locationFilter === "all" || `${pharmacy.city}|${pharmacy.zone}` === locationFilter;
      const matchesDelegate = delegateFilter === "all" || pharmacy.suggested_delegate === delegateFilter;
      return matchesUrgency && matchesLocation && matchesDelegate;
    });
  }, [data, delegateFilter, locationFilter, urgencyFilter]);

  function resetFilters() {
    setUrgencyFilter("all");
    setLocationFilter("all");
    setDelegateFilter("all");
  }

  if (loading) return <State message="Chargement de la priorisation pharmacie" />;
  if (error) return <State message={error} critical />;
  if (!data) return <State message="Aucune donnée de risque pharmacie disponible" />;

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-white/10 bg-card p-5 shadow-glow">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase text-accent">Priorisation intelligente des pharmacies à risque</p>
            <h2 className="mt-2 text-xl font-semibold text-text">Pharmacy Risk Intelligence</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">
              Identifiez les pharmacies exposées, priorisez les visites terrain et suggérez les rotations avant que les signaux faibles ne deviennent des pertes commerciales.
            </p>
          </div>
          <div className="rounded-md border border-accent/20 bg-accent/10 p-3 text-accent">
            <ShieldAlert className="h-6 w-6" />
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Metric title="Pharmacies critiques" value={data.summary.critical_pharmacies} icon={<AlertTriangle className="h-5 w-5" />} alert />
        <Metric title="Risque élevé" value={data.summary.high_risk_pharmacies} icon={<ShieldAlert className="h-5 w-5" />} />
        <Metric title="Zones à traiter" value={data.summary.zones_requiring_action} icon={<MapIcon className="h-5 w-5" />} />
        <Metric title="Visites cette semaine" value={data.summary.suggested_visits_this_week} icon={<CalendarDays className="h-5 w-5" />} />
      </section>

      <FilterPanel
        urgencyFilter={urgencyFilter}
        locationFilter={locationFilter}
        delegateFilter={delegateFilter}
        locationOptions={locationOptions}
        delegateOptions={delegateOptions}
        resultCount={filteredPharmacies.length}
        onUrgencyChange={setUrgencyFilter}
        onLocationChange={setLocationFilter}
        onDelegateChange={setDelegateFilter}
        onReset={resetFilters}
      />

      <HeatmapSection zones={data.zones} />

      <section className="grid gap-5 xl:grid-cols-[1.3fr_0.7fr]">
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-text">Pharmacies priorisées</h3>
            <p className="text-sm text-muted">Liste de travail pour arbitrer les rotations terrain de la semaine.</p>
          </div>
          {filteredPharmacies.length ? (
            filteredPharmacies.map((pharmacy) => <PharmacyRiskCard key={pharmacy.id} pharmacy={pharmacy} />)
          ) : (
            <div className="rounded-lg border border-white/10 bg-card p-5 text-sm text-muted">
              Aucune pharmacie ne correspond aux filtres sélectionnés.
            </div>
          )}
        </div>

        <div className="space-y-4">
          <PrioritizationMethod />
        </div>
      </section>
    </div>
  );
}

function FilterPanel({
  urgencyFilter,
  locationFilter,
  delegateFilter,
  locationOptions,
  delegateOptions,
  resultCount,
  onUrgencyChange,
  onLocationChange,
  onDelegateChange,
  onReset
}: {
  urgencyFilter: string;
  locationFilter: string;
  delegateFilter: string;
  locationOptions: Array<{ value: string; label: string }>;
  delegateOptions: string[];
  resultCount: number;
  onUrgencyChange: (value: string) => void;
  onLocationChange: (value: string) => void;
  onDelegateChange: (value: string) => void;
  onReset: () => void;
}) {
  return (
    <section className="rounded-lg border border-white/10 bg-card p-4">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-accent" />
          <h3 className="text-sm font-semibold text-text">Filtres de priorisation</h3>
        </div>
        <p className="text-sm text-muted">{resultCount} pharmacies affichées</p>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <SelectField label="Urgence" value={urgencyFilter} onChange={onUrgencyChange}>
          <option value="all">Toutes les urgences</option>
          <option value="critical">{urgencyLabel("critical")}</option>
          <option value="high">{urgencyLabel("high")}</option>
          <option value="medium">{urgencyLabel("medium")}</option>
          <option value="low">{urgencyLabel("low")}</option>
        </SelectField>

        <SelectField label="Zone / ville" value={locationFilter} onChange={onLocationChange}>
          <option value="all">Toutes les zones</option>
          {locationOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </SelectField>

        <SelectField label="Délégué" value={delegateFilter} onChange={onDelegateChange}>
          <option value="all">Tous les délégués</option>
          {delegateOptions.map((delegate) => (
            <option key={delegate} value={delegate}>
              {delegate}
            </option>
          ))}
        </SelectField>

        <button
          type="button"
          onClick={onReset}
          className="mt-5 inline-flex h-10 items-center justify-center gap-2 rounded-md border border-white/10 bg-panel px-3 text-sm font-semibold text-muted transition hover:border-accent/30 hover:text-text"
        >
          <RotateCcw className="h-4 w-4" />
          Réinitialiser
        </button>
      </div>
    </section>
  );
}

function SelectField({
  label,
  value,
  onChange,
  children
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-semibold uppercase text-muted">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 w-full rounded-md border border-white/10 bg-panel px-3 text-sm text-text outline-none transition focus:border-accent/50"
      >
        {children}
      </select>
    </label>
  );
}

function PharmacyRiskCard({ pharmacy }: { pharmacy: PharmacyRiskItem }) {
  return (
    <article className="rounded-lg border border-white/10 bg-card p-5 shadow-glow">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="mb-2 flex flex-wrap gap-2">
            <UrgencyBadge urgency={pharmacy.urgency_level} />
            <Badge tone="neutral">Potentiel {potentialLabel(pharmacy.potential_level)}</Badge>
          </div>
          <h4 className="text-base font-semibold text-text">{pharmacy.pharmacy_name}</h4>
          <p className="mt-1 text-sm text-muted">{pharmacy.zone} / {pharmacy.city}</p>
        </div>
        <div className="rounded-md border border-accent/20 bg-accent/10 p-3 text-right">
          <p className="text-xs font-semibold uppercase text-accent">Score de risque</p>
          <p className="mt-1 text-3xl font-semibold text-text">{pharmacy.risk_score}</p>
        </div>
      </div>

      <p className="text-sm leading-6 text-muted">{pharmacy.main_issue}</p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <InfoItem icon={<CalendarDays className="h-4 w-4 text-warning" />} label="Dernière visite" value={`${pharmacy.last_visit_days} jours`} />
        <InfoItem icon={<CalendarDays className="h-4 w-4 text-accent" />} label="Délai recommandé" value={pharmacy.recommended_timeframe} />
        <InfoItem icon={<UserRound className="h-4 w-4 text-accent" />} label="Rotation suggérée" value={pharmacy.suggested_delegate} />
        <InfoItem icon={<ShieldAlert className="h-4 w-4 text-success" />} label="Niveau de confiance" value={pharmacy.confidence_level} />
        <InfoItem icon={<Route className="h-4 w-4 text-success" />} label="Signaux associés" value={pharmacy.signals_count.toString()} />
      </div>

      <PriorityExplanation pharmacy={pharmacy} />

      <DelegateRationale pharmacy={pharmacy} />

      <div className="mt-4 rounded-md border border-accent/20 bg-accent/10 p-3">
        <p className="mb-1 text-xs font-semibold uppercase text-accent">Action recommandée</p>
        <p className="text-sm leading-6 text-text">{pharmacy.recommended_action}</p>
      </div>

      <ScoreBreakdown pharmacy={pharmacy} />

      <div className="mt-4 flex flex-wrap gap-2">
        {pharmacy.risk_factors.map((factor) => (
          <Badge key={factor} tone="neutral">
            {factor}
          </Badge>
        ))}
      </div>
    </article>
  );
}

function PriorityExplanation({ pharmacy }: { pharmacy: PharmacyRiskItem }) {
  return (
    <div className="mt-4 rounded-md border border-warning/20 bg-warning/10 p-3">
      <p className="mb-1 text-xs font-semibold uppercase text-warning">Pourquoi cette pharmacie est prioritaire ?</p>
      <p className="text-sm leading-6 text-text">{pharmacy.priority_explanation}</p>
    </div>
  );
}

function DelegateRationale({ pharmacy }: { pharmacy: PharmacyRiskItem }) {
  return (
    <div className="mt-4 rounded-md border border-white/10 bg-panel p-3">
      <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase text-accent">
        <UserRound className="h-4 w-4" />
        Pourquoi {pharmacy.suggested_delegate} ?
      </div>
      <p className="mb-2 text-sm leading-6 text-text">{pharmacy.delegate_explanation}</p>
      <p className="text-sm leading-6 text-text">{pharmacy.assignment_criteria.join(". ")}.</p>
      <div className="mt-3 grid gap-2 text-xs text-muted sm:grid-cols-2">
        <p>Expertise : {pharmacy.delegate_strength}</p>
        <p>Charge : {pharmacy.delegate_workload}</p>
      </div>
    </div>
  );
}

function ScoreBreakdown({ pharmacy }: { pharmacy: PharmacyRiskItem }) {
  return (
    <div className="mt-4 rounded-md border border-white/10 bg-panel p-3">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase text-muted">Décomposition du score</p>
        <span className="text-xs font-semibold text-accent">Total {pharmacy.risk_score}</span>
      </div>
      <div className="space-y-3">
        {pharmacy.score_breakdown.map((item) => {
          const width = Math.max(6, Math.min(100, Math.round((item.value / pharmacy.risk_score) * 100)));
          return (
            <div key={`${pharmacy.id}-${item.label}`} className="space-y-1">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-text">{item.label}</p>
                <p className="text-sm font-semibold text-accent">+{item.value}</p>
              </div>
              <div className="h-1.5 rounded-full bg-white/10">
                <div className="h-1.5 rounded-full bg-accent" style={{ width: `${width}%` }} />
              </div>
              <p className="text-xs leading-5 text-muted">{item.reason}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PrioritizationMethod() {
  return (
    <section className="rounded-lg border border-white/10 bg-card p-4">
      <div className="mb-3 flex items-center gap-2">
        <ShieldAlert className="h-4 w-4 text-accent" />
        <h3 className="text-sm font-semibold text-text">Méthode de priorisation</h3>
      </div>
      <p className="text-sm leading-6 text-muted">
        Le module combine les signaux terrain, le délai depuis la dernière visite, le potentiel commercial, les ruptures ou faibles disponibilités, la pression concurrentielle et les actions non clôturées.
      </p>
      <p className="mt-3 text-sm leading-6 text-muted">
        Cette version MVP agit comme assistant de priorisation intelligent. Elle ne remplace pas encore un moteur complet d'optimisation de tournées ou de charge délégué.
      </p>
    </section>
  );
}

function HeatmapSection({ zones }: { zones: PharmacyRiskZone[] }) {
  return (
    <section className="rounded-lg border border-white/10 bg-card p-5 shadow-glow">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <MapIcon className="h-4 w-4 text-accent" />
            <p className="text-xs font-semibold uppercase text-accent">Heatmap terrain simulée</p>
          </div>
          <h3 className="text-lg font-semibold text-text">Vue stratégique des zones à risque</h3>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">
            Vue stratégique des zones à risque, basée sur les signaux terrain, le retard de visite et le potentiel commercial.
          </p>
        </div>
        <HeatmapLegend />
      </div>

      <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
        {zones.map((zone) => (
          <HeatmapCell key={`${zone.city}-${zone.zone}`} zone={zone} />
        ))}
      </div>

      <div className="mt-4 rounded-md border border-white/10 bg-panel p-3">
        <p className="text-xs leading-5 text-muted">
          Cette vue simule une heatmap opérationnelle. Une carte GPS réelle pourra être ajoutée dans une version avancée avec coordonnées pharmacies et optimisation de tournée.
        </p>
      </div>
    </section>
  );
}

function HeatmapLegend() {
  const items: Array<{ label: string; urgency: PharmacyRiskUrgency }> = [
    { label: "Critique", urgency: "critical" },
    { label: "Haut risque", urgency: "high" },
    { label: "Moyen", urgency: "medium" },
    { label: "Stable", urgency: "low" }
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <div key={item.urgency} className="flex items-center gap-2 rounded-md border border-white/10 bg-panel px-2 py-1">
          <span className={`h-2.5 w-2.5 rounded-sm ${legendDotTone(item.urgency)}`} />
          <span className="text-xs font-semibold text-muted">{item.label}</span>
        </div>
      ))}
    </div>
  );
}

function HeatmapCell({ zone }: { zone: PharmacyRiskZone }) {
  return (
    <article className={`relative overflow-hidden rounded-lg border p-4 ${heatmapCellTone(zone.urgency_level)}`}>
      <div className={`absolute right-0 top-0 h-24 w-24 rounded-bl-full opacity-30 ${heatmapGlowTone(zone.urgency_level)}`} />
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-base font-semibold text-text">{zone.zone}</p>
          <p className="mt-1 text-xs text-muted">{zone.city}</p>
        </div>
        <UrgencyBadge urgency={zone.urgency_level} />
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <div>
          <p className="text-xs font-semibold uppercase text-muted">Score de risque</p>
          <p className="mt-1 text-3xl font-semibold text-text">{zone.risk_score}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase text-muted">Pharmacies</p>
          <p className="mt-2 text-sm font-semibold text-text">{zone.pharmacies_count}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase text-muted">Délai</p>
          <p className="mt-2 text-sm font-semibold text-text">{zone.action_timeframe}</p>
        </div>
      </div>

      <div className="mt-4 rounded-md border border-white/10 bg-card/60 p-3">
        <p className="mb-1 text-xs font-semibold uppercase text-muted">Pharmacie motrice</p>
        <p className="text-sm font-semibold text-text">{zone.top_pharmacy}</p>
        <p className="mt-2 text-xs leading-5 text-muted">{zone.main_issue}</p>
      </div>

      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <div className="rounded-md border border-white/10 bg-card/60 p-3">
          <p className="mb-1 text-xs font-semibold uppercase text-muted">Rotation suggérée</p>
          <p className="text-sm font-semibold text-text">{zone.suggested_delegate}</p>
        </div>
        <div className="rounded-md border border-accent/20 bg-accent/10 p-3">
          <p className="mb-1 text-xs font-semibold uppercase text-accent">Action prioritaire</p>
          <p className="text-xs leading-5 text-text">{zone.recommended_action}</p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {zone.risk_drivers.slice(0, 3).map((driver) => (
          <Badge key={`${zone.zone}-${driver}`} tone="neutral">
            {driver}
          </Badge>
        ))}
      </div>
    </article>
  );
}

function Metric({ title, value, icon, alert = false }: { title: string; value: number; icon: React.ReactNode; alert?: boolean }) {
  return (
    <div className="rounded-lg border border-white/10 bg-card p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase text-muted">{title}</p>
        <div className={alert ? "text-critical" : "text-accent"}>{icon}</div>
      </div>
      <p className="text-3xl font-semibold text-text">{value}</p>
    </div>
  );
}

function InfoItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-md border border-white/10 bg-panel p-3">
      <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase text-muted">
        {icon}
        {label}
      </div>
      <p className="text-sm font-semibold text-text">{value}</p>
    </div>
  );
}

function UrgencyBadge({ urgency }: { urgency: PharmacyRiskUrgency }) {
  const tone = urgency === "critical" ? "critical" : urgency === "high" ? "warning" : urgency === "medium" ? "cyan" : "success";
  return <Badge tone={tone}>{urgencyLabel(urgency)}</Badge>;
}

function heatmapCellTone(urgency: PharmacyRiskUrgency) {
  if (urgency === "critical") return "border-critical/50 bg-critical/15 shadow-[0_0_28px_rgba(255,77,79,0.16)]";
  if (urgency === "high") return "border-warning/45 bg-warning/15 shadow-[0_0_24px_rgba(255,159,67,0.12)]";
  if (urgency === "medium") return "border-accent/35 bg-accent/10";
  return "border-success/35 bg-success/10";
}

function heatmapGlowTone(urgency: PharmacyRiskUrgency) {
  if (urgency === "critical") return "bg-critical";
  if (urgency === "high") return "bg-warning";
  if (urgency === "medium") return "bg-accent";
  return "bg-success";
}

function legendDotTone(urgency: PharmacyRiskUrgency) {
  if (urgency === "critical") return "bg-critical";
  if (urgency === "high") return "bg-warning";
  if (urgency === "medium") return "bg-accent";
  return "bg-success";
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
