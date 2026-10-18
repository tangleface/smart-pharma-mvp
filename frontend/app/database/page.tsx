"use client";

import { useEffect, useMemo, useState } from "react";
import { Database, Info, Loader2 } from "lucide-react";

import { api } from "@/lib/api";
import type { DatabaseOverview } from "@/lib/types";

const labels: Record<string, string> = {
  internal_code: "Code",
  name: "Nom",
  city: "Ville",
  segment: "Segment",
  status: "Statut",
  target_visits_month: "Visites cible / mois",
  code: "Code",
  brand: "Marque",
  full_name: "Nom",
  role: "Rôle",
  pharmacy_id: "Pharmacie ID",
  delegate_id: "Délégué ID",
  scheduled_at: "Planifiée",
  completed_at: "Réalisée",
  visit_id: "Visite ID",
  product_id: "Produit ID",
  category: "Catégorie",
  observation_text: "Observation",
  source: "Source",
  validation_status: "Validation",
  created_at: "Créée le",
  classification_type: "Type",
  value: "Valeur",
  reason: "Motif",
  valid_from: "Valide depuis",
  valid_until: "Valide jusqu’au",
  territory_id: "Territoire ID",
  pharmacy_id: "Pharmacie ID",
  title: "Titre",
  instruction: "Instruction",
  action_type: "Type d’action",
  priority: "Priorité",
  due_at: "Échéance",
  institution: "Institution",
  region: "Région",
  territory: "Territoire",
  reports_count: "Rapports",
  last_visit: "Dernière visite"
};

export default function DatabasePage() {
  const [data, setData] = useState<DatabaseOverview | null>(null);
  const [activeKey, setActiveKey] = useState("pharmacies");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.databaseOverview()
      .then(setData)
      .catch((caught) => setError(caught instanceof Error ? caught.message : "Impossible de charger la vue des données"));
  }, []);

  const dataset = useMemo(
    () => data?.datasets.find((item) => item.key === activeKey) ?? data?.datasets[0] ?? null,
    [data, activeKey]
  );

  if (error) {
    return <div className="rounded-lg border border-critical/30 bg-critical/10 p-5 text-sm text-critical">{error}</div>;
  }

  if (!data || !dataset) {
    return (
      <div className="flex min-h-[420px] items-center justify-center text-sm text-muted">
        <Loader2 className="mr-2 h-4 w-4 animate-spin text-accent" />
        Chargement de la base de données…
      </div>
    );
  }

  const columns = dataset.rows.length ? Object.keys(dataset.rows[0]) : [];

  return (
    <div className="space-y-5">
      <section className="rounded-lg border border-accent/20 bg-card p-5 shadow-glow">
        <div className="flex items-start gap-3">
          <div className="rounded-md border border-accent/30 bg-accent/10 p-3 text-accent">
            <Database className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-accent">Vue lecture seule · démonstration</p>
            <h2 className="mt-1 text-xl font-semibold text-text">Base de données Smart Pharma</h2>
            <p className="mt-2 max-w-4xl text-sm leading-6 text-muted">
              Vue lisible du référentiel et de l’activité terrain. La base principale v0.2 est PostgreSQL / Supabase.
              Cette page ne permet aucune modification des données.
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {["pharmacies", "healthcare_providers_legacy", "visits", "observations"].map((key) => {
          const item = data.datasets.find((candidate) => candidate.key === key);
          if (!item) return null;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setActiveKey(key)}
              className="rounded-lg border border-white/10 bg-card p-4 text-left transition hover:border-accent/30"
            >
              <p className="text-xs font-semibold uppercase text-muted">{item.label}</p>
              <p className="mt-2 text-2xl font-semibold text-text">{item.count}</p>
            </button>
          );
        })}
      </section>

      <section className="rounded-lg border border-white/10 bg-card p-4">
        <div className="mb-4 flex flex-wrap gap-2">
          {data.datasets.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setActiveKey(item.key)}
              className={`rounded-md border px-3 py-2 text-xs font-semibold transition ${
                dataset.key === item.key
                  ? "border-accent/40 bg-accent/10 text-accent"
                  : "border-white/10 bg-panel text-muted hover:text-text"
              }`}
            >
              {item.label} · {item.count}
            </button>
          ))}
        </div>

        <div className="mb-4 rounded-md border border-white/10 bg-panel p-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold text-text">{dataset.label}</h3>
              <p className="mt-1 text-xs text-muted">Source : {dataset.source}</p>
            </div>
            <span className="rounded border border-white/10 bg-card px-2 py-1 text-xs text-muted">
              {dataset.count} enregistrement{dataset.count > 1 ? "s" : ""}
            </span>
          </div>
        </div>

        {dataset.note ? (
          <div className="mb-4 flex items-start gap-2 rounded-md border border-warning/20 bg-warning/10 p-3 text-xs leading-5 text-muted">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
            {dataset.note}
          </div>
        ) : null}

        <div className="overflow-x-auto rounded-lg border border-white/10">
          <table className="min-w-full border-collapse text-left text-xs">
            <thead className="bg-panel">
              <tr>
                {columns.map((column) => (
                  <th key={column} className="whitespace-nowrap border-b border-white/10 px-3 py-3 font-semibold text-muted">
                    {labels[column] ?? column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {dataset.rows.map((row, index) => (
                <tr key={index} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                  {columns.map((column) => (
                    <td key={column} className="max-w-[320px] px-3 py-3 align-top text-text">
                      <span className={column === "observation_text" || column === "instruction" ? "block min-w-[260px] whitespace-normal leading-5" : "whitespace-nowrap"}>
                        {formatValue(row[column])}
                      </span>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "Oui" : "Non";
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
    return new Date(value).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" });
  }
  return String(value);
}
