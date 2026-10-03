"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { LngLatBounds, Map as MapLibreMap, Marker, NavigationControl, Popup, setWorkerUrl } from "maplibre-gl";
import { Activity, CalendarDays, Layers3, Loader2, MapPinned, ShieldCheck, X } from "lucide-react";

import { api } from "@/lib/api";
import type { PharmacyContextResponse, TerritoryMapPoint, TerritoryMapResponse } from "@/lib/types";

type LayerMode = "coverage" | "last_visit" | "management_priority" | "observations";

type DemoScenario = {
  id: string;
  pharmacyId: string;
  code: string;
  layer: LayerMode;
  kicker: string;
  title: string;
  description: string;
};

const layerOptions: Array<{ id: LayerMode; label: string }> = [
  { id: "coverage", label: "Couverture" },
  { id: "last_visit", label: "Dernière visite" },
  { id: "management_priority", label: "Priorité management" },
  { id: "observations", label: "Observations" }
];

const demoScenarios: DemoScenario[] = [
  {
    id: "observation-context",
    pharmacyId: "a54822b8-d943-4d3e-965e-ef11adba35af",
    code: "AO-03",
    layer: "management_priority",
    kicker: "Observation ≠ décision",
    title: "Contexte avant action",
    description: "Faible disponibilité Beta observée, mais une directive régionale demande de ne pas pousser le produit."
  },
  {
    id: "ai-review",
    pharmacyId: "e85734bf-f378-428a-a3db-672fb1800fe2",
    code: "AO-06",
    layer: "observations",
    kicker: "IA sous contrôle humain",
    title: "Extraction à valider",
    description: "Une baisse de rotation est extraite par IA, mais reste en needs_review avant toute décision."
  },
  {
    id: "strategy-execution",
    pharmacyId: "8645106c-0e12-4803-b56f-2f8f779a880c",
    code: "AE-04",
    layer: "coverage",
    kicker: "Stratégie vs exécution",
    title: "Écart de couverture",
    description: "Compte prioritaire et campagne Gamma active, mais fréquence de visite insuffisante."
  }
];

export default function TerritoryMapPage() {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markerRefs = useRef<Marker[]>([]);
  const hasFitBoundsRef = useRef(false);

  const [data, setData] = useState<TerritoryMapResponse | null>(null);
  const [layer, setLayer] = useState<LayerMode>("coverage");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedContext, setSelectedContext] = useState<PharmacyContextResponse | null>(null);
  const [contextLoading, setContextLoading] = useState(false);
  const [contextError, setContextError] = useState<string | null>(null);
  const [activeScenarioId, setActiveScenarioId] = useState<string | null>(null);

  useEffect(() => {
    api
      .territoryMap()
      .then(setData)
      .catch((caught) => setError(caught instanceof Error ? caught.message : "Impossible de charger la carte territoire"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    setWorkerUrl("/maplibre/maplibre-gl-worker.mjs");

    const map = new MapLibreMap({
      container: mapContainerRef.current,
      style: {
        version: 8,
        sources: {
          osm: {
            type: "raster",
            tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
            tileSize: 256,
            attribution: "© OpenStreetMap contributors"
          }
        },
        layers: [{ id: "osm", type: "raster", source: "osm" }]
      },
      center: [3.0588, 36.7538],
      zoom: 10
    });

    map.addControl(new NavigationControl(), "top-right");
    mapRef.current = map;

    return () => {
      markerRefs.current.forEach((marker) => marker.remove());
      markerRefs.current = [];
      map.remove();
      mapRef.current = null;
    };
  }, [data]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !data) return;

    markerRefs.current.forEach((marker) => marker.remove());
    markerRefs.current = [];

    const bounds = new LngLatBounds();

    for (const point of data.points) {
      const markerElement = document.createElement("button");
      markerElement.type = "button";
      markerElement.setAttribute("aria-label", point.name);
      markerElement.style.width = "16px";
      markerElement.style.height = "16px";
      markerElement.style.borderRadius = "999px";
      markerElement.style.border = "2px solid rgba(255,255,255,0.95)";
      markerElement.style.background = markerColor(point, layer);
      markerElement.style.boxShadow = "0 0 0 2px rgba(6,7,10,0.45), 0 4px 14px rgba(0,0,0,0.35)";
      markerElement.style.cursor = "pointer";
      markerElement.addEventListener("click", () => {
        setActiveScenarioId(null);
        void loadContext(point.id);
      });

      const popup = new Popup({ offset: 18, maxWidth: "320px" }).setDOMContent(buildPopup(point));
      const marker = new Marker({ element: markerElement })
        .setLngLat([point.longitude, point.latitude])
        .setPopup(popup)
        .addTo(map);

      markerRefs.current.push(marker);
      bounds.extend([point.longitude, point.latitude]);
    }

    if (!hasFitBoundsRef.current && !bounds.isEmpty()) {
      hasFitBoundsRef.current = true;
      map.fitBounds(bounds, { padding: 54, maxZoom: 11.5, duration: 500 });
    }
  }, [data, layer]);

  async function loadContext(id: string) {
    setContextLoading(true);
    setContextError(null);
    try {
      const context = await api.pharmacyContext(id);
      setSelectedContext(context);
    } catch (caught) {
      setContextError(caught instanceof Error ? caught.message : "Impossible de charger le contexte");
    } finally {
      setContextLoading(false);
    }
  }

  function runScenario(scenario: DemoScenario) {
    const point = data?.points.find((item) => item.id === scenario.pharmacyId);
    setActiveScenarioId(scenario.id);
    setLayer(scenario.layer);
    void loadContext(scenario.pharmacyId);

    if (point && mapRef.current) {
      mapRef.current.flyTo({
        center: [point.longitude, point.latitude],
        zoom: 13.4,
        duration: 900,
        essential: true
      });
    }
  }

  const summary = useMemo(() => {
    const points = data?.points ?? [];
    return {
      total: points.length,
      undercovered: points.filter((point) => point.coverage_status === "undercovered").length,
      watch: points.filter((point) => point.coverage_status === "watch").length,
      highPriority: points.filter((point) => point.management_priority === "high").length
    };
  }, [data]);

  if (loading) return <State message="Chargement de Territory Intelligence" />;
  if (error) return <State message={error} critical />;

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-white/10 bg-card p-5 shadow-glow">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase text-accent">Experimental Field Model v0.2</p>
            <h2 className="mt-2 text-xl font-semibold text-text">Territory Intelligence — Alger</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">
              Vue factuelle de la couverture terrain, des visites, des priorités management et des observations. Données synthétiques de démonstration.
            </p>
          </div>
          <div className="rounded-md border border-accent/20 bg-accent/10 p-3 text-accent">
            <MapPinned className="h-6 w-6" />
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric title="Pharmacies cartographiées" value={summary.total} icon={<MapPinned className="h-5 w-5" />} />
        <Metric title="Sous-couvertes" value={summary.undercovered} icon={<CalendarDays className="h-5 w-5" />} alert />
        <Metric title="À surveiller" value={summary.watch} icon={<Activity className="h-5 w-5" />} />
        <Metric title="Priorité management élevée" value={summary.highPriority} icon={<ShieldCheck className="h-5 w-5" />} />
      </section>

      <section className="rounded-lg border border-accent/20 bg-card p-4 shadow-glow">
        <div className="mb-4">
          <p className="text-xs font-semibold uppercase text-accent">Scénarios de démonstration</p>
          <h3 className="mt-1 text-base font-semibold text-text">Trois situations pour tester le modèle</h3>
          <p className="mt-1 text-sm text-muted">Chaque scénario centre la carte, choisit la couche utile et ouvre le contexte métier de la pharmacie.</p>
        </div>
        <div className="grid gap-3 xl:grid-cols-3">
          {demoScenarios.map((scenario, index) => {
            const active = activeScenarioId === scenario.id;
            return (
              <button
                key={scenario.id}
                type="button"
                onClick={() => runScenario(scenario)}
                className={`rounded-lg border p-4 text-left transition ${
                  active
                    ? "border-accent/50 bg-accent/10 shadow-glow"
                    : "border-white/10 bg-panel hover:border-accent/30 hover:bg-white/[0.04]"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="text-[11px] font-semibold uppercase text-accent">0{index + 1} · {scenario.kicker}</span>
                  <span className="rounded border border-white/10 bg-card px-2 py-1 text-[11px] font-semibold text-muted">{scenario.code}</span>
                </div>
                <p className="mt-3 text-sm font-semibold text-text">{scenario.title}</p>
                <p className="mt-1 text-xs leading-5 text-muted">{scenario.description}</p>
                <p className="mt-3 text-[11px] font-semibold uppercase text-accent">Afficher sur la carte →</p>
              </button>
            );
          })}
        </div>
      </section>

      <section className="rounded-lg border border-white/10 bg-card p-4">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Layers3 className="h-4 w-4 text-accent" />
            <div>
              <h3 className="text-sm font-semibold text-text">Couche d'analyse</h3>
              <p className="text-xs text-muted">Fenêtre de couverture : {data?.coverage_window_days ?? 30} jours</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {layerOptions.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => {
                  setActiveScenarioId(null);
                  setLayer(option.id);
                }}
                className={`rounded-md border px-3 py-2 text-xs font-semibold transition ${
                  layer === option.id
                    ? "border-accent/40 bg-accent/10 text-accent"
                    : "border-white/10 bg-panel text-muted hover:text-text"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-[1.55fr_0.65fr]">
          <div>
            <Legend layer={layer} />
            <div className="mt-4 overflow-hidden rounded-lg border border-white/10 bg-panel">
              <div ref={mapContainerRef} className="h-[620px] w-full" />
            </div>
          </div>
          <ContextPanel
            context={selectedContext}
            loading={contextLoading}
            error={contextError}
            onClose={() => {
              setSelectedContext(null);
              setActiveScenarioId(null);
            }}
          />
        </div>

        <p className="mt-3 text-xs text-muted">
          Une sous-couverture n'est pas automatiquement un problème. Le panneau de contexte sépare observation terrain, directive management et action.
        </p>
      </section>
    </div>
  );
}

function ContextPanel({
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
  if (loading) {
    return (
      <div className="rounded-lg border border-white/10 bg-panel p-4 text-sm text-muted">
        <Loader2 className="mr-2 inline h-4 w-4 animate-spin" />Chargement du contexte…
      </div>
    );
  }
  if (error) return <div className="rounded-lg border border-critical/30 bg-critical/10 p-4 text-sm text-critical">{error}</div>;
  if (!context) return <div className="rounded-lg border border-white/10 bg-panel p-4 text-sm text-muted">Clique sur une pharmacie ou lance un scénario pour afficher son contexte métier.</div>;

  return (
    <aside className="rounded-lg border border-white/10 bg-panel p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase text-accent">Context & Governance</p>
          <h3 className="mt-1 text-base font-semibold text-text">{context.name}</h3>
          <p className="mt-1 text-xs text-muted">{context.territory ?? "—"} · {context.delegate ?? "—"} · segment {context.segment ?? "—"}</p>
        </div>
        <button type="button" onClick={onClose} className="text-muted hover:text-text"><X className="h-4 w-4" /></button>
      </div>

      <div className="mt-4 rounded-md border border-white/10 bg-card p-3">
        <p className="text-xs font-semibold uppercase text-muted">Priorité management</p>
        <p className="mt-1 text-sm font-semibold text-text">{priorityLabel(context.management_priority)}</p>
        {context.management_priority_reason && <p className="mt-1 text-xs leading-5 text-muted">{context.management_priority_reason}</p>}
      </div>

      <ContextSection title="Observation terrain" empty="Aucune observation récente">
        {context.observations.map((item) => (
          <div key={item.id} className="rounded-md border border-white/10 bg-card p-3">
            <div className="flex flex-wrap gap-2 text-[11px] text-muted">
              <span>{item.product ?? item.category}</span><span>·</span><span>{item.source}</span><span>·</span><span>{item.validation_status}</span>
            </div>
            <p className="mt-2 text-sm leading-5 text-text">{item.text}</p>
          </div>
        ))}
      </ContextSection>

      <ContextSection title="Directive management" empty="Aucune directive active">
        {context.directives.map((item) => (
          <div key={item.id} className="rounded-md border border-warning/20 bg-warning/10 p-3">
            <p className="text-sm font-semibold text-text">{item.title}</p>
            <p className="mt-1 text-xs leading-5 text-text">{item.instruction}</p>
            <p className="mt-2 text-[11px] text-muted">Portée {item.scope} · créée par {item.created_by}</p>
          </div>
        ))}
      </ContextSection>

      <ContextSection title="Action" empty="Aucune action ouverte">
        {context.actions.map((item) => (
          <div key={item.id} className="rounded-md border border-accent/20 bg-accent/10 p-3">
            <p className="text-sm font-semibold text-text">{item.title}</p>
            {item.rationale && <p className="mt-1 text-xs leading-5 text-muted">{item.rationale}</p>}
            <p className="mt-2 text-[11px] text-muted">Source {item.source} · priorité {item.priority}</p>
          </div>
        ))}
      </ContextSection>
    </aside>
  );
}

function ContextSection({ title, empty, children }: { title: string; empty: string; children: ReactNode }) {
  const array = Array.isArray(children) ? children : [children];
  const hasItems = array.some(Boolean);
  return (
    <div className="mt-4">
      <p className="mb-2 text-xs font-semibold uppercase text-muted">{title}</p>
      {hasItems ? <div className="space-y-2">{children}</div> : <p className="text-xs text-muted">{empty}</p>}
    </div>
  );
}

function Legend({ layer }: { layer: LayerMode }) {
  const items =
    layer === "coverage"
      ? [["Conforme", "#00C48C"], ["À surveiller", "#FF9F43"], ["Sous-couverte", "#FF4D4F"], ["Exclue", "#6B7280"]]
      : layer === "last_visit"
        ? [["≤ 14 jours", "#00C48C"], ["15–30 jours", "#FF9F43"], ["> 30 jours", "#FF4D4F"], ["Aucune donnée", "#6B7280"]]
        : layer === "management_priority"
          ? [["Haute", "#FF4D4F"], ["Standard", "#00D1FF"], ["Faible", "#9CA3AF"], ["Non définie", "#6B7280"]]
          : [["0 observation", "#6B7280"], ["1 observation", "#00D1FF"], ["2–3 observations", "#FF9F43"], ["4+ observations", "#FF4D4F"]];

  return (
    <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted">
      {items.map(([label, color]) => (
        <div key={label} className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full border border-white/60" style={{ backgroundColor: color }} />
          {label}
        </div>
      ))}
    </div>
  );
}

function markerColor(point: TerritoryMapPoint, layer: LayerMode): string {
  if (layer === "coverage") {
    return { on_target: "#00C48C", watch: "#FF9F43", undercovered: "#FF4D4F", excluded: "#6B7280", unknown: "#00D1FF" }[point.coverage_status];
  }
  if (layer === "last_visit") {
    if (point.days_since_last_visit == null) return "#6B7280";
    if (point.days_since_last_visit > 30) return "#FF4D4F";
    if (point.days_since_last_visit > 14) return "#FF9F43";
    return "#00C48C";
  }
  if (layer === "management_priority") {
    if (point.management_priority === "high") return "#FF4D4F";
    if (point.management_priority === "standard") return "#00D1FF";
    if (point.management_priority === "low") return "#9CA3AF";
    return "#6B7280";
  }
  if (point.observations_last_30_days >= 4) return "#FF4D4F";
  if (point.observations_last_30_days >= 2) return "#FF9F43";
  if (point.observations_last_30_days === 1) return "#00D1FF";
  return "#6B7280";
}

function buildPopup(point: TerritoryMapPoint): HTMLElement {
  const root = document.createElement("div");
  root.style.color = "#111827";
  root.style.fontFamily = "Arial, Helvetica, sans-serif";

  const title = document.createElement("strong");
  title.textContent = point.name;
  title.style.display = "block";
  title.style.marginBottom = "6px";
  root.appendChild(title);

  const lines = [
    point.territory ? `Territoire : ${point.territory}` : null,
    point.delegate ? `Délégué : ${point.delegate}` : null,
    `Segment : ${point.segment ?? "—"}`,
    `Couverture 30 j : ${point.visits_last_30_days} / ${point.target_visits_month ?? "—"}`,
    `Dernière visite : ${point.days_since_last_visit == null ? "—" : `${point.days_since_last_visit} jours`}`,
    `Priorité management : ${priorityLabel(point.management_priority)}`,
    `Observations 30 j : ${point.observations_last_30_days}`
  ];

  for (const line of lines) {
    if (!line) continue;
    const row = document.createElement("div");
    row.textContent = line;
    row.style.fontSize = "12px";
    row.style.lineHeight = "1.55";
    root.appendChild(row);
  }
  return root;
}

function priorityLabel(priority: string | null): string {
  if (priority === "high") return "Haute";
  if (priority === "standard") return "Standard";
  if (priority === "low") return "Faible";
  return "Non définie";
}

function Metric({ title, value, icon, alert = false }: { title: string; value: number; icon: ReactNode; alert?: boolean }) {
  return (
    <div className="rounded-lg border border-white/10 bg-card p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase text-muted">{title}</p>
        <div className={alert ? "text-critical" : "text-accent"}>{icon}</div>
      </div>
      <p className="text-2xl font-semibold text-text">{value}</p>
    </div>
  );
}

function State({ message, critical = false }: { message: string; critical?: boolean }) {
  return (
    <div className="flex min-h-[420px] items-center justify-center">
      <div className={`flex items-center gap-3 rounded-lg border p-5 text-sm ${critical ? "border-critical/30 bg-critical/10 text-critical" : "border-white/10 bg-card text-muted"}`}>
        {!critical && <Loader2 className="h-4 w-4 animate-spin text-accent" />}
        {message}
      </div>
    </div>
  );
}
