"use client";

import { FormEvent, useRef, useState } from "react";
import { CheckCircle2, Loader2, Mic, MicOff, Sparkles } from "lucide-react";

import { api } from "@/lib/api";
import type { Signal } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Badge } from "@/components/ui/Badge";
import { categoryLabel } from "@/lib/format";

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
        "Le Pr. El Idrissi indique que trois patients diabétiques ont demandé un équivalent moins coûteux après le dernier ajustement tarifaire. Il évoque un problème de remboursement partiel et mentionne qu'un confrère prescrit désormais l'alternative générique. Il demande des données coût-efficacité actualisées."
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
        "Le service d'oncologie signale une rupture de stock sur la présentation 100 mg depuis 9 jours. La pharmacie hospitalière confirme une commande non livrée. L'équipe demande une visibilité sur la date de réapprovisionnement."
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
        "Le Dr. Trabelsi rapporte une visite récente d'un délégué concurrent qui a présenté une nouvelle étude comparative. Deux praticiens envisagent de changer leurs nouveaux patients. Le Dr. Trabelsi reste favorable à notre molécule mais demande nos données comparatives récentes."
    }
  }
];

export function ReportForm() {
  const [form, setForm] = useState(initial);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<Signal | null>(null);
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setAnalysis(null);

    try {
      const report = await api.createReport({
        ...form,
        visit_date: new Date(`${form.visit_date}T09:00:00`).toISOString()
      });
      const analyzed = await api.analyzeReport(report.id);
      setAnalysis(analyzed);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Impossible de structurer le rapport");
    } finally {
      setLoading(false);
    }
  }

  function update(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function applyScenario(data: (typeof scenarios)[number]["data"]) {
    setAnalysis(null);
    setError(null);
    setVoiceStatus(null);
    setForm((current) => ({ ...current, ...data }));
  }

  async function startRecording() {
    setError(null);
    setVoiceStatus(null);

    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setError("L'enregistrement vocal n'est pas pris en charge par ce navigateur.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];

      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
        stream.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        void transcribeRecording(blob);
      };

      recorder.start();
      setRecording(true);
      setVoiceStatus("Enregistrement en cours… Parlez naturellement, puis arrêtez la dictée.");
    } catch {
      setError("Accès au microphone refusé ou indisponible.");
    }
  }

  function stopRecording() {
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state === "inactive") return;
    recorder.stop();
    setRecording(false);
    setVoiceStatus("Enregistrement terminé. Transcription en cours…");
  }

  async function transcribeRecording(blob: Blob) {
    setTranscribing(true);
    try {
      const extension = blob.type.includes("ogg") ? "ogg" : blob.type.includes("mp4") ? "mp4" : "webm";
      const file = new File([blob], `rapport-terrain.${extension}`, { type: blob.type || "audio/webm" });
      const result = await api.transcribeFieldReport(file);

      if (!result.text) {
        setVoiceStatus("Aucun texte détecté. Vous pouvez réessayer ou saisir le rapport manuellement.");
        return;
      }

      setForm((current) => ({
        ...current,
        report_text: current.report_text.trim()
          ? `${current.report_text.trim()}\n\n${result.text}`
          : result.text
      }));
      setVoiceStatus("Transcription ajoutée. Relisez et corrigez le texte avant de le structurer.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "La transcription vocale a échoué.");
      setVoiceStatus(null);
    } finally {
      setTranscribing(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
      <form onSubmit={onSubmit} className="rounded-lg border border-white/10 bg-card p-5 shadow-glow">
        <div className="mb-5">
          <p className="text-xs font-semibold uppercase text-accent">Capture terrain</p>
          <h2 className="mt-1 text-lg font-semibold text-text">Rapport de visite</h2>
          <p className="mt-1 text-sm leading-6 text-muted">
            Le délégué peut écrire ou dicter son rapport. L'IA aide à transcrire, synthétiser et structurer l'information ; elle ne décide pas à sa place.
          </p>
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
          <Field label="Prescripteur / interlocuteur">
            <Input value={form.healthcare_provider} onChange={(event) => update("healthcare_provider", event.target.value)} required />
          </Field>
          <Field label="Institution / pharmacie">
            <Input value={form.institution} onChange={(event) => update("institution", event.target.value)} />
          </Field>
        </div>

        <div className="mt-4">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs font-semibold uppercase text-muted">Rapport terrain brut</span>
            <Button
              type="button"
              variant={recording ? "secondary" : "secondary"}
              onClick={recording ? stopRecording : startRecording}
              disabled={transcribing}
            >
              {transcribing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : recording ? (
                <MicOff className="h-4 w-4" />
              ) : (
                <Mic className="h-4 w-4" />
              )}
              {transcribing ? "Transcription…" : recording ? "Arrêter la dictée" : "Dicter le rapport"}
            </Button>
          </div>

          <Textarea
            value={form.report_text}
            onChange={(event) => update("report_text", event.target.value)}
            placeholder="Décrivez librement la visite : disponibilité, rotation, demande du client, objection, concurrence, prochaine étape…"
            required
          />

          {voiceStatus ? (
            <div className="mt-2 flex items-start gap-2 rounded-md border border-accent/20 bg-accent/5 p-2 text-xs leading-5 text-muted">
              <Mic className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" />
              <span>{voiceStatus}</span>
            </div>
          ) : null}

          <div className="mt-2 flex items-start gap-2 text-[11px] leading-4 text-muted">
            <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" />
            <span>Le texte reste modifiable avant analyse. Dans ce prototype, l'audio envoyé à la transcription n'est pas enregistré par Smart Pharma.</span>
          </div>
        </div>

        {error ? <p className="mt-4 rounded-md border border-critical/30 bg-critical/10 p-3 text-sm text-critical">{error}</p> : null}

        <div className="mt-5 flex justify-end">
          <Button disabled={loading || recording || transcribing}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            Structurer le rapport
          </Button>
        </div>
      </form>

      <aside className="rounded-lg border border-white/10 bg-panel p-5">
        <p className="text-xs font-semibold uppercase text-accent">Assistance IA</p>
        <h2 className="mt-1 text-lg font-semibold text-text">Synthèse structurée</h2>
        <p className="mt-1 text-sm leading-6 text-muted">
          L'IA reformule et extrait des éléments du rapport. Le résultat reste une aide à la lecture, pas une décision automatique.
        </p>

        {loading ? (
          <div className="mt-8 flex items-center gap-3 text-sm text-muted">
            <Loader2 className="h-5 w-5 animate-spin text-accent" />
            Structuration du rapport en cours
          </div>
        ) : analysis ? (
          <div className="mt-5 space-y-4">
            <div className="rounded-md border border-accent/20 bg-accent/5 p-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-semibold uppercase text-accent">Statut</p>
                <Badge tone="cyan">À valider</Badge>
              </div>
              <p className="mt-2 text-xs leading-5 text-muted">
                Extraction automatique à relire avant qualification ou action.
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase text-muted">Résumé de la visite</p>
              <p className="mt-2 text-sm leading-6 text-text">{analysis.summary}</p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase text-muted">Catégorie détectée</p>
              <div className="mt-2">
                <Badge tone="cyan">{categoryLabel(analysis.category)}</Badge>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase text-muted">Éléments extraits</p>
              {analysis.detected_entities.length ? (
                <div className="mt-2 flex flex-wrap gap-2">
                  {analysis.detected_entities.map((entity) => (
                    <span key={entity} className="rounded-md border border-white/10 bg-card px-2 py-1 text-xs text-text">
                      {entity}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="mt-2 text-xs text-muted">Aucun élément spécifique extrait.</p>
              )}
            </div>

            <div className="rounded-md border border-white/10 bg-card p-3">
              <p className="text-xs font-semibold uppercase text-muted">Principe du prototype</p>
              <p className="mt-2 text-xs leading-5 text-muted">
                Une observation peut être exacte sans suffire pour décider. La qualification, le contexte management et les directives sont traités séparément.
              </p>
            </div>
          </div>
        ) : (
          <p className="mt-5 text-sm leading-6 text-muted">
            La synthèse et les éléments extraits apparaîtront ici après validation du texte du rapport.
          </p>
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
