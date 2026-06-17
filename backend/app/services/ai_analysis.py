from __future__ import annotations

import json
from collections import Counter
from typing import Any

from openai import OpenAI
from pydantic import ValidationError

from app.config import get_settings
from app.models import DelegateReport
from app.schemas import AnalysisPayload, NextBestActionPayload


RULES = [
    {
        "category": "safety_concern",
        "terms": [
            "side effect",
            "adverse",
            "reaction",
            "safety",
            "rash",
            "dizziness",
            "effet indésirable",
            "pharmacovigilance",
            "tolérance",
        ],
        "severity": "critical",
        "urgency": 95,
        "action": "Escalader au Responsable Pharmacovigilance et collecter les informations structurées sous 24 h.",
        "action_type": "pharmacovigilance_escalation",
        "priority": "urgent",
        "due": 1,
    },
    {
        "category": "stock_issue",
        "terms": [
            "stock out",
            "stockout",
            "shortage",
            "unavailable",
            "not available",
            "supply",
            "rupture de stock",
            "rupture",
            "non livrée",
            "non livré",
            "grossiste",
            "réapprovisionnement",
            "commande non livrée",
        ],
        "severity": "high",
        "urgency": 88,
        "action": "Coordonner la remédiation d'approvisionnement avec Supply Chain et notifier la pharmacie hospitalière.",
        "action_type": "supply_remediation",
        "priority": "urgent",
        "due": 1,
    },
    {
        "category": "competitor_activity",
        "terms": [
            "competitor",
            "rival",
            "switching",
            "new brand",
            "campaign",
            "rep visited",
            "concurrent",
            "laboratoire x",
            "head-to-head",
            "switcher",
            "support patient",
            "remise",
        ],
        "severity": "high",
        "urgency": 78,
        "action": "Diffuser une note de contre-positionnement validée et briefer l'équipe terrain régionale.",
        "action_type": "counter_positioning",
        "priority": "high",
        "due": 5,
    },
    {
        "category": "pricing_pressure",
        "terms": [
            "price",
            "discount",
            "cheaper",
            "cost",
            "reimbursement",
            "affordability",
            "prix",
            "coûteux",
            "cout",
            "coût",
            "tarifaire",
            "remboursement",
            "cnss",
            "coût-efficacité",
            "cout-efficacité",
            "générique",
            "argumentaire d'accès",
        ],
        "severity": "high",
        "urgency": 74,
        "action": "Transmettre un dossier accès et coût-efficacité pour soutenir le prescripteur et le comité du médicament.",
        "action_type": "access_dossier",
        "priority": "high",
        "due": 3,
    },
    {
        "category": "market_access",
        "terms": ["formulary", "tender", "hospital list", "access", "approval", "committee", "comité", "accès", "dossier d'accès"],
        "severity": "high",
        "urgency": 79,
        "action": "Analyser la barrière d'accès et coordonner un dossier institutionnel avec Market Access.",
        "action_type": "access_barrier_analysis",
        "priority": "high",
        "due": 5,
    },
    {
        "category": "prescriber_sentiment",
        "terms": ["concerned", "hesitant", "positive", "satisfied", "doubt", "preference", "favorable", "hésitant", "réticent"],
        "severity": "medium",
        "urgency": 58,
        "action": "Planifier une visite de consolidation scientifique avec le prescripteur.",
        "action_type": "scientific_consolidation",
        "priority": "medium",
        "due": 7,
    },
    {
        "category": "product_feedback",
        "terms": ["feedback", "tolerability", "efficacy", "dose", "packaging", "patient response", "retour", "efficacité", "présentation"],
        "severity": "medium",
        "urgency": 55,
        "action": "Qualifier le retour clinique produit avec Medical Affairs et préparer une réponse médicale validée.",
        "action_type": "clinical_feedback_qualification",
        "priority": "medium",
        "due": 4,
    },
    {
        "category": "opportunity",
        "terms": ["interested", "requested", "trial", "samples", "presentation", "meeting", "demande", "atelier", "rcp", "données"],
        "severity": "medium",
        "urgency": 61,
        "action": "Activer le levier de prescription détecté avec un suivi scientifique ciblé.",
        "action_type": "prescription_lever",
        "priority": "medium",
        "due": 7,
    },
]

NEXT_BEST_ACTIONS = {
    "stock_issue": {
        "title": "Coordonner la remédiation d'approvisionnement",
        "rationale": "Coordonner avec Supply Chain, confirmer la date de réapprovisionnement et notifier le pharmacien hospitalier sous 24 h.",
        "suggested_owner": "Supply Operations Lead",
        "priority": "urgent",
        "due_in_days": 1,
    },
    "competitor_activity": {
        "title": "Diffuser une note de contre-positionnement",
        "rationale": "Préparer une réponse validée par Medical Affairs et briefer l'équipe terrain régionale avant le prochain cycle de visite.",
        "suggested_owner": "Medical Affairs Manager",
        "priority": "high",
        "due_in_days": 5,
    },
    "pricing_pressure": {
        "title": "Transmettre un dossier accès et coût-efficacité",
        "rationale": "Préparer un argumentaire d'accès au marché et des données coût-efficacité pour soutenir le prescripteur et le comité du médicament.",
        "suggested_owner": "Market Access Lead",
        "priority": "high",
        "due_in_days": 3,
    },
    "safety_concern": {
        "title": "Escalader au Responsable Pharmacovigilance",
        "rationale": "Ouvrir une déclaration d'évènement indésirable et collecter les informations structurées auprès du prescripteur sous 24 h.",
        "suggested_owner": "Pharmacovigilance Officer",
        "priority": "urgent",
        "due_in_days": 1,
    },
    "product_feedback": {
        "title": "Qualifier le retour clinique produit",
        "rationale": "Transmettre le retour à Medical Affairs pour qualification scientifique et préparation d'une réponse médicale validée.",
        "suggested_owner": "Medical Affairs Manager",
        "priority": "medium",
        "due_in_days": 4,
    },
    "market_access": {
        "title": "Analyser la barrière d'accès",
        "rationale": "Identifier la barrière institutionnelle, préparer un dossier d'accès et coordonner avec Market Access.",
        "suggested_owner": "Market Access Lead",
        "priority": "high",
        "due_in_days": 5,
    },
    "prescriber_sentiment": {
        "title": "Planifier une visite de consolidation scientifique",
        "rationale": "Renforcer la relation médicale avec le prescripteur et adresser les signaux faibles détectés.",
        "suggested_owner": "Field Medical Lead",
        "priority": "medium",
        "due_in_days": 7,
    },
    "opportunity": {
        "title": "Activer le levier de prescription détecté",
        "rationale": "Planifier un suivi scientifique ciblé pour convertir le signal positif en action terrain mesurable.",
        "suggested_owner": "Business Unit Manager",
        "priority": "medium",
        "due_in_days": 7,
    },
}


def analyze_report(report: DelegateReport) -> AnalysisPayload:
    settings = get_settings()
    if settings.openai_api_key:
        try:
            return _analyze_with_openai(report)
        except Exception:
            return _fallback_analysis(report, ai_failed=True)
    return _fallback_analysis(report, ai_failed=False)


def _analyze_with_openai(report: DelegateReport) -> AnalysisPayload:
    settings = get_settings()
    client = OpenAI(api_key=settings.openai_api_key)
    schema = _analysis_json_schema()
    prompt = f"""
Analyze this pharmaceutical delegate field report and return only structured JSON.

Context:
- Region: {report.region}
- Territory: {report.territory}
- Healthcare provider: {report.healthcare_provider}
- Institution: {report.institution or "Not specified"}
- Visit date: {report.visit_date.isoformat()}

Report:
{report.report_text}

Interpret it as operational field intelligence, not CRM notes.
"""
    response = client.responses.create(
        model=settings.openai_model,
        input=[
            {
                "role": "system",
                "content": (
                    "You are a pharmaceutical field intelligence analyst. "
                    "Extract the most important operational signal, alert level, entities, "
                    "recommended action, and a pharma-specific next best action for field, "
                    "medical, market access, supply, or pharmacovigilance teams. Avoid CRM, "
                    "sales pipeline, lead, and deal vocabulary. Output valid JSON."
                ),
            },
            {"role": "user", "content": prompt},
        ],
        text={
            "format": {
                "type": "json_schema",
                "name": "smart_pharma_signal",
                "strict": True,
                "schema": schema,
            }
        },
    )
    payload = json.loads(response.output_text)
    return _normalize_payload(payload)


def _fallback_analysis(report: DelegateReport, ai_failed: bool) -> AnalysisPayload:
    text = report.report_text.lower()
    scores: Counter[str] = Counter()
    matched_terms: list[str] = []
    best_rule = RULES[-1]

    for rule in RULES:
        count = sum(1 for term in rule["terms"] if term in text)
        if count:
            scores[rule["category"]] += count
            matched_terms.extend([term for term in rule["terms"] if term in text])
        if count > scores[best_rule["category"]]:
            best_rule = rule

    if scores:
        best_category = scores.most_common(1)[0][0]
        best_rule = next(rule for rule in RULES if rule["category"] == best_category)

    severity = best_rule["severity"]
    confidence = 0.68 if scores else 0.5
    if ai_failed:
        confidence -= 0.05

    entities = _extract_entities(report, matched_terms)
    title = _title_for(best_rule["category"], report.territory)
    summary = (
        f"{report.healthcare_provider} a remonté un signal {pharma_category_label(best_rule['category']).lower()} "
        f"sur {report.territory}. {pharma_summary_sentence_for(best_rule['category'])}"
    )
    if ai_failed:
        summary += " AI analysis failed, so deterministic fallback classification was used."

    return AnalysisPayload(
        title=title,
        summary=summary,
        category=best_rule["category"],
        severity=severity,
        confidence_score=round(confidence, 2),
        urgency_score=float(best_rule["urgency"]),
        detected_entities=entities,
        recommended_action=best_rule["action"],
        next_best_action=pharma_next_best_action_for(best_rule["category"]),
    )


def _normalize_payload(payload: dict[str, Any]) -> AnalysisPayload:
    try:
        parsed = AnalysisPayload.model_validate(payload)
    except ValidationError:
        raise

    categories = {rule["category"] for rule in RULES}
    severities = {"low", "medium", "high", "critical"}

    parsed.category = parsed.category if parsed.category in categories else "opportunity"
    parsed.severity = parsed.severity if parsed.severity in severities else "medium"
    parsed.confidence_score = max(0.0, min(1.0, parsed.confidence_score))
    parsed.urgency_score = max(0.0, min(100.0, parsed.urgency_score))
    parsed.next_best_action = pharma_next_best_action_for(parsed.category)
    return parsed


def pharma_next_best_action_for(category: str) -> NextBestActionPayload:
    rule = next((item for item in RULES if item["category"] == category), RULES[-1])
    return NextBestActionPayload(
        action_type=rule["action_type"],
        **NEXT_BEST_ACTIONS[rule["category"]],
    )


def pharma_recommended_action_for(category: str) -> str:
    rule = next((item for item in RULES if item["category"] == category), RULES[-1])
    return str(rule["action"])


def pharma_signal_title_for(category: str, territory: str) -> str:
    return _title_for(category, territory)


def pharma_signal_summary_for(category: str, territory: str, healthcare_provider: str) -> str:
    return (
        f"{healthcare_provider} a remonté un signal {pharma_category_label(category).lower()} "
        f"sur {territory}. {pharma_summary_sentence_for(category)}"
    )


def pharma_summary_sentence_for(category: str) -> str:
    sentences = {
        "stock_issue": (
            "Le risque principal concerne la continuité de traitement et nécessite une coordination rapide "
            "avec Supply Chain et la pharmacie hospitalière."
        ),
        "competitor_activity": (
            "La dynamique concurrentielle peut influencer les prochains choix de prescription et appelle "
            "une réponse médicale validée."
        ),
        "pricing_pressure": (
            "L'objection économique peut freiner l'accès patient et doit être traitée par un dossier accès "
            "et coût-efficacité."
        ),
        "safety_concern": (
            "Le signal doit être qualifié sans délai avec le circuit Pharmacovigilance et le prescripteur."
        ),
        "product_feedback": (
            "Le retour clinique doit être qualifié par Medical Affairs pour préparer une réponse scientifique validée."
        ),
        "market_access": (
            "La barrière institutionnelle doit être documentée avec Market Access pour soutenir la décision locale."
        ),
        "prescriber_sentiment": (
            "Le signal faible nécessite une consolidation scientifique ciblée auprès du prescripteur."
        ),
        "opportunity": (
            "Le levier détecté peut être converti en action terrain mesurable avec un suivi scientifique ciblé."
        ),
    }
    return sentences.get(category, "Le signal nécessite une décision opérationnelle priorisée.")


def pharma_category_label(category: str) -> str:
    labels = {
        "competitor_activity": "Pression concurrentielle",
        "product_feedback": "Retour clinique produit",
        "stock_issue": "Rupture d'approvisionnement",
        "pricing_pressure": "Objection prix et accès",
        "prescriber_sentiment": "Signal prescripteur",
        "market_access": "Accès au marché",
        "safety_concern": "Pharmacovigilance",
        "opportunity": "Levier de prescription",
    }
    return labels.get(category, "opérationnel")


def _extract_entities(report: DelegateReport, matched_terms: list[str]) -> list[str]:
    entities = [report.healthcare_provider, report.region, report.territory]
    if report.institution:
        entities.append(report.institution)
    entities.extend(sorted(set(matched_terms))[:4])
    return [entity for entity in entities if entity]


def _title_for(category: str, territory: str) -> str:
    labels = {
        "safety_concern": "Escalade pharmacovigilance potentielle",
        "stock_issue": "Rupture d'approvisionnement détectée",
        "competitor_activity": "Pression concurrentielle détectée",
        "pricing_pressure": "Objection prix / accès détectée",
        "market_access": "Barrière d'accès institutionnelle",
        "prescriber_sentiment": "Signal faible prescripteur",
        "product_feedback": "Retour clinique produit",
        "opportunity": "Levier de prescription détecté",
    }
    return f"{labels.get(category, 'Signal opérationnel')} — {territory}"


def _analysis_json_schema() -> dict[str, Any]:
    return {
        "type": "object",
        "additionalProperties": False,
        "required": [
            "title",
            "summary",
            "category",
            "severity",
            "confidence_score",
            "urgency_score",
            "detected_entities",
            "recommended_action",
            "next_best_action",
        ],
        "properties": {
            "title": {"type": "string"},
            "summary": {"type": "string"},
            "category": {
                "type": "string",
                "enum": [
                    "competitor_activity",
                    "product_feedback",
                    "stock_issue",
                    "pricing_pressure",
                    "prescriber_sentiment",
                    "market_access",
                    "safety_concern",
                    "opportunity",
                ],
            },
            "severity": {"type": "string", "enum": ["low", "medium", "high", "critical"]},
            "confidence_score": {"type": "number"},
            "urgency_score": {"type": "number"},
            "detected_entities": {"type": "array", "items": {"type": "string"}},
            "recommended_action": {"type": "string"},
            "next_best_action": {
                "type": "object",
                "additionalProperties": False,
                "required": [
                    "action_type",
                    "title",
                    "rationale",
                    "suggested_owner",
                    "priority",
                    "due_in_days",
                ],
                "properties": {
                    "action_type": {"type": "string"},
                    "title": {"type": "string"},
                    "rationale": {"type": "string"},
                    "suggested_owner": {"type": "string"},
                    "priority": {"type": "string", "enum": ["low", "medium", "high", "urgent"]},
                    "due_in_days": {"type": "integer"},
                },
            },
        },
    }
