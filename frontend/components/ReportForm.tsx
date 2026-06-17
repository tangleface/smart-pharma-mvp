"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { ArrowRight, Gauge, Loader2, Send } from "lucide-react";
import { api } from "@/lib/api";
import type { Signal } from "@/lib/types";
import { AlertBadge } from "@/components/AlertBadge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Badge } from "@/components/ui/Badge";
import { categoryLabel, percent } from "@/lib/format";

const initial = {
  delegate_name: "",
  region: "",
  territory: "",
  healthcare_provider: "",
  institution: "",
  visit_date: new Date().toISOString().slice(0, 10),
  report_text: ""
};

const scenarios = [
  {
    label: "Scénario objection prix",
    data: {
      delegate_name: "Yasmine Bouazza",
      region: "Casablanca-Settat",
      territory: "Casablanca Centre",
      healthcare_provider: "Pr. Hicham El Idrissi — Endocrinologue",
      institution: "CHU Ibn Rochd — Service Endocrinologie",
      report_text:
        "Le Pr. El Idrissi indique que trois patients diabétiques ont demandé un équivalent moins coûteux après le dernier ajustement tarifaire. Il évoque un problème de remboursement partiel par la CNSS et mentionne qu'un confrère prescrit désormais l'alternative générique. Il demande des données coût-efficacité actualisées et un argumentaire d'accès pour le comité du médicament de l'hôpital."
    }
  },
  {
    label: "Scénario rupture stock",
    data: {
      delegate_name: "Karim Mansouri",
      region: "Oranie",
      territory: "Oran",
      healthcare_provider: "Dr. Nadia Belkacem — Oncologue",
      institution: "EHU 1er Novembre 1954 — Service Oncologie médicale",
      report_text:
        "Le service d'oncologie signale une rupture de stock sur la présentation 100 mg depuis 9 jours. Deux patients ont vu leur cure reportée. La pharmacie hospitalière confirme une commande non livrée par le grossiste-répartiteur Sodipharm. L'équipe demande une visibilité sur la date de réapprovisionnement et une solution de substitution validée par le comité thérapeutique."
    }
  },
  {
    label: "Scénario pression concurrentielle",
    data: {
      delegate_name: "Lina Saidi",
      region: "Grand Tunis",
      territory: "Tunis Nord",
      healthcare_provider: "Dr. Mehdi Trabelsi — Cardiologue interventionnel",
      institution: "Clinique Les Berges du Lac",
      report_text:
        "Le Dr. Trabelsi rapporte une visite récente d'un délégué concurrent du laboratoire X qui a présenté une nouvelle étude head-to-head et propose un programme de support patient incluant une remise de 18 pour cent sur les 6 premiers mois. Deux praticiens du service envisagent de switcher leurs nouveaux patients. Le Dr. Trabelsi reste favorable à notre molécule mais demande nos données comparatives récentes et un atelier RCP pour son équipe."
    }
  }
];

export function ReportForm() {
  const [form, setForm] = useState(initial);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signal, setSignal] = useState<Signal | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSignal(null);

    try {
      const report = await api.createReport({
        ...form,
        visit_date: new Date(`${form.visit_date}T09:00:00`).toISOString()
      });
      const analyzed = await api.analyzeReport(report.id);
      setSignal(analyzed);
      setForm(initial);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Impossible de soumettre le rapport");
    } finally {
      setLoading(false);
    }
  }

  function update(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function applyScenario(data: (typeof scenarios)[number]["data"]) {
    setSignal(null);
    setError(null);
    setForm((current) => ({
      ...current,
      ...data
    }));
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
      <form onSubmit={onSubmit} className="rounded-lg border border-white/10 bg-card p-5 shadow-glow">
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-text">Capture terrain</h2>
          <p className="text-sm text-muted">Transformer un rapport de visite en signal opérationnel exploitable.</p>
        </div>
        <div className="mb-5 rounded-lg border border-white/10 bg-panel p-3">
          <p className="mb-3 text-xs font-semibold uppercase text-muted">Scénarios de démonstration</p>
          <div className="flex flex-wrap gap-2">
            {scenarios.map((scenario) => (
              <Button key={scenario.label} type="button" variant="secondary" onClick={() => applyScenario(scenario.data)}>
                {scenario.label}
              </Button>
            ))}
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Nom du délégué">
            <Input value={form.delegate_name} onChange={(event) => update("delegate_name", event.target.value)} required />
          </Field>
          <Field label="Date de visite">
            <Input type="date" value={form.visit_date} onChange={(event) => update("visit_date", event.target.value)} required />
          </Field>
          <Field label="Région">
            <Input value={form.region} onChange={(event) => update("region", event.target.value)} required />
          </Field>
          <Field label="Territoire">
            <Input value={form.territory} onChange={(event) => update("territory", event.target.value)} required />
          </Field>
          <Field label="Prescripteur">
            <Input
              value={form.healthcare_provider}
              onChange={(event) => update("healthcare_provider", event.target.value)}
              required
            />
          </Field>
          <Field label="Institution">
            <Input value={form.institution} onChange={(event) => update("institution", event.target.value)} />
          </Field>
        </div>
        <div className="mt-4">
          <Field label="Rapport terrain brut">
            <Textarea
              value={form.report_text}
              onChange={(event) => update("report_text", event.target.value)}
              placeholder="Exemple : le prescripteur signale une rupture, une objection prix, une pression concurrentielle ou une barrière d'accès..."
              required
            />
          </Field>
        </div>
        {error ? <p className="mt-4 rounded-md border border-critical/30 bg-critical/10 p-3 text-sm text-critical">{error}</p> : null}
        <div className="mt-5 flex justify-end">
          <Button disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Lancer l'analyse
          </Button>
        </div>
      </form>

      <aside className="rounded-lg border border-white/10 bg-panel p-5">
        <h2 className="text-lg font-semibold text-text">Signal généré</h2>
        {loading ? (
          <div className="mt-8 flex items-center gap-3 text-sm text-muted">
            <Loader2 className="h-5 w-5 animate-spin text-accent" />
            Analyse du rapport en cours
          </div>
        ) : signal ? (
          <div className="mt-5 space-y-4">
            <div className="space-y-3">
              <h3 className="text-lg font-semibold leading-6 text-text">{signal.title}</h3>
              <div className="flex flex-wrap gap-2">
                <AlertBadge severity={signal.severity} />
                <Badge tone="cyan">{categoryLabel(signal.category)}</Badge>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-md border border-white/10 bg-bg/50 p-3">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase text-muted">
                  <Gauge className="h-4 w-4 text-accent" />
                  Score d'urgence
                </div>
                <p className="mt-2 text-2xl font-semibold text-text">{Math.round(signal.urgency_score)}</p>
              </div>
              <div className="rounded-md border border-white/10 bg-bg/50 p-3">
                <p className="text-xs font-semibold uppercase text-muted">Confiance</p>
                <p className="mt-2 text-2xl font-semibold text-text">{percent(signal.confidence_score)}</p>
              </div>
            </div>

            <p className="text-sm leading-6 text-muted">{signal.summary}</p>
            <div className="rounded-md border border-accent/20 bg-accent/10 p-3 text-sm text-text">
              <p className="mb-1 text-xs font-semibold uppercase text-accent">Décision recommandée</p>
              {signal.recommended_action}
            </div>
            <Link href={`/signals/${signal.id}`} className="inline-flex">
              <Button variant="secondary">
                Voir l'analyse
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        ) : (
          <p className="mt-5 text-sm leading-6 text-muted">Le signal opérationnel extrait apparaîtra ici après analyse.</p>
        )}
      </aside>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-semibold uppercase text-muted">{label}</span>
      {children}
    </label>
  );
}
