export function titleize(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function categoryLabel(value: string) {
  const labels: Record<string, string> = {
    competitor_activity: "Pression concurrentielle",
    product_feedback: "Retour clinique produit",
    stock_issue: "Rupture d'approvisionnement",
    pricing_pressure: "Objection prix et accès",
    prescriber_sentiment: "Signal prescripteur",
    market_access: "Accès au marché",
    safety_concern: "Pharmacovigilance",
    opportunity: "Levier de prescription"
  };
  return labels[value] ?? titleize(value);
}

export function severityLabel(value: string) {
  const labels: Record<string, string> = {
    low: "Faible",
    medium: "Modéré",
    high: "Élevé",
    critical: "Critique"
  };
  return labels[value] ?? titleize(value);
}

export function urgencyLabel(value: string) {
  const labels: Record<string, string> = {
    low: "Faible",
    medium: "Modérée",
    high: "Élevée",
    critical: "Critique"
  };
  return labels[value] ?? titleize(value);
}

export function potentialLabel(value: string) {
  const labels: Record<string, string> = {
    low: "Faible",
    medium: "Moyen",
    high: "Élevé"
  };
  return labels[value] ?? titleize(value);
}

export function priorityLabel(value: string) {
  const labels: Record<string, string> = {
    low: "Faible",
    medium: "Modérée",
    high: "Haute",
    urgent: "Urgente"
  };
  return labels[value] ?? titleize(value);
}

export function actionTypeLabel(value: string) {
  const labels: Record<string, string> = {
    pharmacovigilance_escalation: "Escalade pharmacovigilance",
    supply_remediation: "Remédiation approvisionnement",
    counter_positioning: "Contre-positionnement",
    access_dossier: "Dossier accès",
    access_barrier_analysis: "Analyse accès",
    scientific_consolidation: "Consolidation scientifique",
    clinical_feedback_qualification: "Qualification clinique",
    prescription_lever: "Levier de prescription",
    supply_check: "Remédiation approvisionnement",
    investigate: "Contre-positionnement",
    educate: "Dossier accès",
    escalate: "Escalade",
    monitor: "Qualification clinique",
    follow_up: "Suivi scientifique"
  };
  return labels[value] ?? titleize(value);
}

export function statusLabel(value: string) {
  const labels: Record<string, string> = {
    new: "Nouveau",
    reviewed: "Revu",
    in_progress: "En cours",
    resolved: "Résolu",
    dismissed: "Écarté"
  };
  return labels[value] ?? titleize(value);
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date(value));
}

export function percent(value: number) {
  return `${Math.round(value * 100)}%`;
}
