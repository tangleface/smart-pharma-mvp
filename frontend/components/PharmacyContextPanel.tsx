"use client";

import { useState } from "react";
import { Eye, LockKeyhole, X } from "lucide-react";

import type { PharmacyContextResponse } from "@/lib/types";

type VisibilityMode = "terrain" | "supervision" | "direction";

const modes: Array<{ id: VisibilityMode; label: string }> = [
  { id: "terrain", label: "Terrain" },
  { id: "supervision", label: "Supervision" },
  { id: "direction", label: "Direction" }
];

export function PharmacyContextPanel({
  context,
  loading,
  error,
  onClose
}: {
  context: PharmacyContextResponse | null;
  loading: boolean;
  error: string | null;
  onClose: () => void;
}) {
  const [mode, setMode] = useState<VisibilityMode>("supervision");

  if (loading) {
    return (
      <div className="rounded-lg border border-white/10 bg-panel p-4 text-sm text-muted">
        Chargement du contexte…
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-critical/30 bg-critical/10 p-4 text-sm text-critical">
        {error}
      </div>
    );
  }

  if (!context) {
    return (
      <div className="rounded-lg border border-white/10 bg-panel p-4 text-sm text-muted">
        Clique sur une pharmacie ou lance un scénario pour afficher son contexte métier.
      </div>
    );
  }

  const showManagementDetail = mode !== "terrain";
  const showStrategicReason = mode === "direction";

  return (
    <aside className="rounded-lg border border-white/10 bg-panel p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase text-accent">Contexte & gouvernance</p>
          <h3 className="mt-1 text-base font-semibold text-text">{context.name}</h3>
          <p className="mt-1 text-xs text-muted">
            {context.territory ?? "—"} · {context.delegate ?? "—"} · segment {context.segment ?? "—"}
          </p>
        </div>
        <button type="button" onClick={onClose} className="text-muted hover:text-text" aria-label="Fermer">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-4 rounded-md border border-accent/20 bg-accent/5 p-3">
        <div className="flex items-start gap-2">
          <Eye className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
          <div>
            <p className="text-xs font-semibold uppercase text-accent">Aperçu de visibilité — hypothèse à valider</p>
            <p className="mt-1 text-[11px] leading-4 text-muted">
              Simulation de démonstration uniquement. Elle ne définit pas encore les permissions finales du produit.
            </p>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {modes.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setMode(item.id)}
              className={`rounded-md border px-2 py-2 text-[11px] font-semibold transition ${
                mode === item.id
                  ? "border-accent/40 bg-accent/10 text-accent"
                  : "border-white/10 bg-card text-muted hover:text-text"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 rounded-md border border-white/10 bg-card p-3">
        <p className="text-xs font-semibold uppercase text-muted">Priorité management</p>
        <p className="mt-1 text-sm font-semibold text-text">{priorityLabel(context.management_priority)}</p>
        {showManagementDetail && context.management_priority_reason ? (
          <p className="mt-1 text-xs leading-5 text-muted">{context.management_priority_reason}</p>
        ) : mode === "terrain" ? (
          <RestrictedNote label="Motif management non affiché dans cette vue" />
        ) : null}
      </div>

      <Section title="Observation terrain" empty="Aucune observation récente">
        {context.observations.map((item) => (
          <div key={item.id} className="rounded-md border border-white/10 bg-card p-3">
            <div className="flex flex-wrap gap-2 text-[11px] text-muted">
              <span>{item.product ?? item.category}</span>
              <span>·</span>
              <span>{sourceLabel(item.source)}</span>
              <span>·</span>
              <span>{validationLabel(item.validation_status)}</span>
            </div>
            <p className="mt-2 text-sm leading-5 text-text">{item.text}</p>
          </div>
        ))}
      </Section>

      <Section title="Directive management" empty="Aucune directive active">
        {context.directives.map((item) => (
          <div key={item.id} className="rounded-md border border-warning/20 bg-warning/10 p-3">
            <p className="text-sm font-semibold text-text">{item.title}</p>
            <p className="mt-1 text-xs leading-5 text-text">{item.instruction}</p>

            {showManagementDetail ? (
              <p className="mt-2 text-[11px] text-muted">
                Portée {scopeLabel(item.scope)} · créée par {item.created_by}
              </p>
            ) : (
              <p className="mt-2 text-[11px] text-muted">Consigne opérationnelle applicable</p>
            )}

            {showStrategicReason && item.reason ? (
              <div className="mt-2 rounded border border-white/10 bg-black/10 p-2">
                <p className="text-[10px] font-semibold uppercase text-muted">Motif stratégique</p>
                <p className="mt-1 text-[11px] leading-4 text-muted">{item.reason}</p>
              </div>
            ) : mode !== "direction" && item.reason ? (
              <RestrictedNote label="Motif stratégique réservé à une vue autorisée" />
            ) : null}
          </div>
        ))}
      </Section>

      <Section title="Action" empty="Aucune action ouverte">
        {context.actions.map((item) => (
          <div key={item.id} className="rounded-md border border-accent/20 bg-accent/10 p-3">
            <p className="text-sm font-semibold text-text">{item.title}</p>
            {showManagementDetail && item.rationale ? (
              <p className="mt-1 text-xs leading-5 text-muted">{item.rationale}</p>
            ) : mode === "terrain" && item.rationale ? (
              <RestrictedNote label="Justification détaillée non affichée dans cette vue" />
            ) : null}
            {showManagementDetail ? (
              <p className="mt-2 text-[11px] text-muted">
                Source {actionSourceLabel(item.source)} · priorité {priorityLabel(item.priority)}
              </p>
            ) : null}
          </div>
        ))}
      </Section>

      <div className="mt-4 rounded-md border border-white/10 bg-card/60 p-3">
        <p className="text-[11px] leading-4 text-muted">
          Principe testé : l’information terrain peut remonter dans la hiérarchie, tandis que seules les consignes nécessaires redescendent. Les niveaux exacts de confidentialité restent à valider avec le métier.
        </p>
      </div>
    </aside>
  );
}

function Section({ title, empty, children }: { title: string; empty: string; children: React.ReactNode }) {
  const items = Array.isArray(children) ? children : [children];
  const hasItems = items.some(Boolean);

  return (
    <div className="mt-4">
      <p className="mb-2 text-xs font-semibold uppercase text-muted">{title}</p>
      {hasItems ? <div className="space-y-2">{children}</div> : <p className="text-xs text-muted">{empty}</p>}
    </div>
  );
}

function RestrictedNote({ label }: { label: string }) {
  return (
    <div className="mt-2 flex items-center gap-1.5 text-[10px] text-muted">
      <LockKeyhole className="h-3 w-3" />
      <span>{label}</span>
    </div>
  );
}

function priorityLabel(priority: string | null): string {
  if (priority === "high") return "Haute";
  if (priority === "standard") return "Standard";
  if (priority === "low") return "Faible";
  if (priority === "urgent") return "Urgente";
  return "Non définie";
}

function sourceLabel(source: string): string {
  if (source === "delegate") return "Délégué";
  if (source === "ai_extracted") return "Extraction IA";
  if (source === "manager") return "Management";
  return source;
}

function validationLabel(status: string): string {
  if (status === "raw") return "Brute";
  if (status === "validated") return "Validée";
  if (status === "rejected") return "Rejetée";
  if (status === "needs_review") return "À valider";
  return status;
}

function scopeLabel(scope: string): string {
  if (scope === "territory") return "Territoire";
  if (scope === "pharmacy") return "Pharmacie";
  return scope;
}

function actionSourceLabel(source: string): string {
  if (source === "business_rule") return "Règle métier";
  if (source === "ai_suggested") return "Suggestion IA";
  if (source === "manual") return "Manuelle";
  return source;
}
