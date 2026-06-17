from collections import Counter, defaultdict
from sqlalchemy.orm import Session

from app.models import OperationalSignal
from app.schemas import PharmacyRiskItem, PharmacyRiskResponse, PharmacyRiskSummary, PharmacyRiskZone


DELEGATE_PROFILES = {
    "Karim": {
        "zone": "Oran Est",
        "strength": "Suivi des ruptures et coordination grossiste-répartiteur",
        "workload": "Disponible pour 3 visites prioritaires cette semaine",
        "familiarity": "Historique de visites sur les pharmacies critiques d'Oran Est",
    },
    "Samir": {
        "zone": "Alger Centre",
        "strength": "Pharmacies urbaines centrales et dossiers d'activité concurrentielle",
        "workload": "Charge modérée, créneau disponible sous 72 h",
        "familiarity": "Connaissance des points de dispensation stratégiques d'Alger Centre",
    },
    "Amine": {
        "zone": "Blida Nord",
        "strength": "Rattrapage de couverture terrain et rotations à accélérer",
        "workload": "Capacité disponible pour absorber une visite additionnelle cette semaine",
        "familiarity": "Suivi régulier du secteur Blida et des pharmacies à potentiel élevé",
    },
    "Lina": {
        "zone": "Constantine Centre",
        "strength": "Visibilité officinale et consolidation des messages clés",
        "workload": "Charge maîtrisée, visite de consolidation possible sous 7 jours",
        "familiarity": "Assignée aux suivis visibilité sur Constantine Centre",
    },
    "Nadia": {
        "zone": "Tizi Ouzou Ville",
        "strength": "Suivi standard des pharmacies stables et surveillance disponibilité",
        "workload": "Rotation normale maintenue sans conflit de priorité",
        "familiarity": "Familiarité avec les pharmacies stables de Tizi Ouzou",
    },
}


DEMO_PHARMACIES = [
    {
        "id": "pha-el-amel-oran-est",
        "pharmacy_name": "Pharmacie El Amel",
        "zone": "Oran Est",
        "city": "Oran",
        "last_visit_days": 46,
        "base_score": 93,
        "main_issue": "Rupture de stock répétée sur une pharmacie à fort potentiel.",
        "priority_explanation": "Cette pharmacie est prioritaire car elle combine une rupture produit répétée, un retard de visite significatif et un potentiel élevé dans Oran Est.",
        "suggested_delegate": "Karim",
        "recommended_action": "Planifier une visite sous 48 h, confirmer la disponibilité produit et coordonner une remédiation avec le grossiste.",
        "recommended_timeframe": "Sous 48 h",
        "confidence_level": "Élevé",
        "rotation_reason": "Rotation prioritaire car la pharmacie combine rupture, retard de visite et potentiel élevé.",
        "potential_level": "high",
        "score_breakdown": [
            {
                "label": "Rupture ou faible disponibilité",
                "value": 30,
                "reason": "Signal terrain indiquant une rupture produit répétée ou une disponibilité insuffisante.",
            },
            {
                "label": "Retard de visite",
                "value": 20,
                "reason": "Dernière visite supérieure au seuil recommandé pour une pharmacie prioritaire.",
            },
            {
                "label": "Potentiel commercial",
                "value": 15,
                "reason": "Pharmacie classée à potentiel élevé dans la zone Oran Est.",
            },
            {
                "label": "Actions non clôturées",
                "value": 10,
                "reason": "Des actions terrain restent à sécuriser avec la pharmacie et le grossiste.",
            },
            {
                "label": "Signaux négatifs répétés",
                "value": 10,
                "reason": "Les signaux de disponibilité et de commande se répètent sur plusieurs cycles.",
            },
            {
                "label": "Baisse des commandes",
                "value": 8,
                "reason": "La dynamique de réassort montre un risque de décrochage commercial.",
            },
        ],
        "flags": {
            "stock_rupture": True,
            "competitor_activity": False,
            "order_decrease": True,
            "unresolved_actions": True,
            "repeated_negative_signals": True,
            "rotation_delay": True,
            "visibility_issue": False,
            "stable": False,
        },
    },
    {
        "id": "pha-centrale-alger-centre",
        "pharmacy_name": "Pharmacie Centrale",
        "zone": "Alger Centre",
        "city": "Alger",
        "last_visit_days": 24,
        "base_score": 76,
        "main_issue": "Pression concurrentielle et baisse des commandes sur un point de dispensation stratégique.",
        "priority_explanation": "La pharmacie est priorisée car l'activité concurrentielle coïncide avec une baisse des commandes sur un point de dispensation central.",
        "suggested_delegate": "Samir",
        "recommended_action": "Organiser une visite ciblée, documenter les objections concurrentielles et sécuriser le réassort prioritaire.",
        "recommended_timeframe": "Cette semaine",
        "confidence_level": "Élevé",
        "rotation_reason": "Rotation suggérée pour contrer l'activité concurrentielle avant perte de préférence.",
        "potential_level": "high",
        "score_breakdown": [
            {
                "label": "Pression concurrentielle",
                "value": 25,
                "reason": "Activité concurrentielle détectée sur une pharmacie urbaine stratégique.",
            },
            {
                "label": "Baisse des commandes",
                "value": 18,
                "reason": "La baisse de réassort signale un risque de perte de préférence.",
            },
            {
                "label": "Potentiel commercial",
                "value": 15,
                "reason": "Point de dispensation classé à potentiel élevé dans Alger Centre.",
            },
            {
                "label": "Actions non clôturées",
                "value": 10,
                "reason": "Un suivi terrain reste nécessaire pour documenter les objections et sécuriser le réassort.",
            },
            {
                "label": "Rotation à surveiller",
                "value": 8,
                "reason": "La dernière visite approche du seuil de relance recommandé.",
            },
        ],
        "flags": {
            "stock_rupture": False,
            "competitor_activity": True,
            "order_decrease": True,
            "unresolved_actions": True,
            "repeated_negative_signals": False,
            "rotation_delay": False,
            "visibility_issue": False,
            "stable": False,
        },
    },
    {
        "id": "pha-ennour-blida",
        "pharmacy_name": "Pharmacie Ennour",
        "zone": "Blida Nord",
        "city": "Blida",
        "last_visit_days": 52,
        "base_score": 72,
        "main_issue": "Retard de visite important sur pharmacie à potentiel élevé.",
        "priority_explanation": "Cette pharmacie remonte dans les priorités car le délai sans visite est élevé et le potentiel de la zone nécessite une couverture rapprochée.",
        "suggested_delegate": "Amine",
        "recommended_action": "Inscrire la pharmacie dans la rotation de la semaine et vérifier disponibilité, commandes et objections terrain.",
        "recommended_timeframe": "Cette semaine",
        "confidence_level": "Élevé",
        "rotation_reason": "Rotation à accélérer car l'absence de visite augmente le risque de décrochage.",
        "potential_level": "high",
        "score_breakdown": [
            {
                "label": "Retard de visite",
                "value": 25,
                "reason": "La pharmacie n'a pas été visitée récemment malgré son importance terrain.",
            },
            {
                "label": "Potentiel commercial",
                "value": 15,
                "reason": "Pharmacie à potentiel élevé dans le secteur Blida Nord.",
            },
            {
                "label": "Délai de rotation",
                "value": 12,
                "reason": "Le planning de rotation doit être accéléré pour éviter un décrochage.",
            },
            {
                "label": "Baisse des commandes",
                "value": 10,
                "reason": "Le signal de commande justifie une vérification terrain ciblée.",
            },
            {
                "label": "Visibilité produit",
                "value": 10,
                "reason": "La visibilité en officine doit être vérifiée lors du prochain passage.",
            },
        ],
        "flags": {
            "stock_rupture": False,
            "competitor_activity": False,
            "order_decrease": True,
            "unresolved_actions": False,
            "repeated_negative_signals": False,
            "rotation_delay": True,
            "visibility_issue": True,
            "stable": False,
        },
    },
    {
        "id": "pha-el-yasmine-constantine",
        "pharmacy_name": "Pharmacie El Yasmine",
        "zone": "Constantine Centre",
        "city": "Constantine",
        "last_visit_days": 19,
        "base_score": 48,
        "main_issue": "Visibilité produit insuffisante et risque de décrochage modéré.",
        "priority_explanation": "La pharmacie nécessite une consolidation car le risque porte surtout sur la visibilité produit et la qualité d'exécution officinale.",
        "suggested_delegate": "Lina",
        "recommended_action": "Prévoir une visite de consolidation pour vérifier visibilité, stock et messages clés auprès de l'équipe officinale.",
        "recommended_timeframe": "Prochain cycle terrain",
        "confidence_level": "Moyen",
        "rotation_reason": "Rotation suggérée pour corriger un signal faible avant dégradation.",
        "potential_level": "medium",
        "score_breakdown": [
            {
                "label": "Visibilité produit",
                "value": 22,
                "reason": "La visibilité en officine est insuffisante et peut limiter la recommandation.",
            },
            {
                "label": "Rotation à surveiller",
                "value": 10,
                "reason": "La dernière visite reste dans une zone de vigilance opérationnelle.",
            },
            {
                "label": "Potentiel moyen",
                "value": 8,
                "reason": "La pharmacie conserve un intérêt terrain mais n'est pas en priorité critique.",
            },
            {
                "label": "Signal faible",
                "value": 8,
                "reason": "Le signal est modéré mais mérite un suivi avant dégradation.",
            },
        ],
        "flags": {
            "stock_rupture": False,
            "competitor_activity": False,
            "order_decrease": False,
            "unresolved_actions": False,
            "repeated_negative_signals": False,
            "rotation_delay": False,
            "visibility_issue": True,
            "stable": False,
        },
    },
    {
        "id": "pha-tizi-sante-tizi-ouzou",
        "pharmacy_name": "Pharmacie Tizi Santé",
        "zone": "Tizi Ouzou Ville",
        "city": "Tizi Ouzou",
        "last_visit_days": 9,
        "base_score": 24,
        "main_issue": "Pharmacie stable, disponibilité et rotation sous contrôle.",
        "priority_explanation": "La pharmacie reste en suivi standard car la disponibilité, la rotation et les signaux terrain sont sous contrôle.",
        "suggested_delegate": "Nadia",
        "recommended_action": "Maintenir la cadence de visite actuelle et surveiller les signaux de disponibilité.",
        "recommended_timeframe": "Rotation standard",
        "confidence_level": "Moyen",
        "rotation_reason": "Rotation standard suffisante, sans action urgente détectée.",
        "potential_level": "medium",
        "score_breakdown": [
            {
                "label": "Potentiel moyen",
                "value": 8,
                "reason": "La pharmacie conserve un niveau d'intérêt terrain modéré.",
            },
            {
                "label": "Surveillance disponibilité",
                "value": 6,
                "reason": "Une surveillance légère reste utile pour détecter une future rupture.",
            },
            {
                "label": "Rotation récente",
                "value": 5,
                "reason": "La visite récente limite le risque mais justifie un suivi standard.",
            },
            {
                "label": "Situation stable",
                "value": 5,
                "reason": "Aucun signal défavorable majeur n'est détecté à ce stade.",
            },
        ],
        "flags": {
            "stock_rupture": False,
            "competitor_activity": False,
            "order_decrease": False,
            "unresolved_actions": False,
            "repeated_negative_signals": False,
            "rotation_delay": False,
            "visibility_issue": False,
            "stable": True,
        },
    },
]


def build_pharmacy_risk_intelligence(db: Session) -> PharmacyRiskResponse:
    signals = db.query(OperationalSignal).all()
    pharmacies = [_build_pharmacy(item, signals) for item in DEMO_PHARMACIES]
    pharmacies.sort(key=lambda item: item.risk_score, reverse=True)

    zones = _build_zones(pharmacies)
    summary = PharmacyRiskSummary(
        critical_pharmacies=sum(1 for item in pharmacies if item.urgency_level == "critical"),
        high_risk_pharmacies=sum(1 for item in pharmacies if item.urgency_level == "high"),
        zones_requiring_action=sum(1 for item in zones if item.urgency_level in {"high", "critical"}),
        suggested_visits_this_week=sum(1 for item in pharmacies if item.urgency_level in {"high", "critical"}),
    )
    return PharmacyRiskResponse(summary=summary, pharmacies=pharmacies, zones=zones)


def _build_pharmacy(item: dict, signals: list[OperationalSignal]) -> PharmacyRiskItem:
    related_signals = _related_signals(item, signals)
    risk_score = _score(item, related_signals)
    assignment = _delegate_assignment(item, risk_score)
    return PharmacyRiskItem(
        id=item["id"],
        pharmacy_name=item["pharmacy_name"],
        zone=item["zone"],
        city=item["city"],
        last_visit_days=item["last_visit_days"],
        risk_score=risk_score,
        urgency_level=_urgency_level(risk_score),
        score_breakdown=_score_breakdown(item, risk_score),
        main_issue=item["main_issue"],
        priority_explanation=item["priority_explanation"],
        suggested_delegate=item["suggested_delegate"],
        delegate_zone=assignment["delegate_zone"],
        delegate_strength=assignment["delegate_strength"],
        delegate_workload=assignment["delegate_workload"],
        delegate_explanation=assignment["delegate_explanation"],
        recommended_action=item["recommended_action"],
        recommended_timeframe=item["recommended_timeframe"],
        rotation_reason=assignment["rotation_reason"],
        assignment_criteria=assignment["assignment_criteria"],
        confidence_level=item["confidence_level"],
        signals_count=len(related_signals),
        potential_level=item["potential_level"],
        risk_factors=_risk_factors(item, related_signals),
    )


def _delegate_assignment(item: dict, risk_score: int) -> dict:
    delegate = item["suggested_delegate"]
    profile = DELEGATE_PROFILES[delegate]
    priority = _assignment_priority(item, risk_score)
    action_timing = _action_timing(risk_score)

    return {
        "delegate_zone": profile["zone"],
        "delegate_strength": profile["strength"],
        "delegate_workload": profile["workload"],
        "delegate_explanation": (
            f"{delegate} est sélectionné car la couverture géographique correspond à {profile['zone']}, "
            f"son point fort est adapté au dossier ({profile['strength'].lower()}) "
            f"et sa charge permet le délai recommandé."
        ),
        "rotation_reason": (
            f"{delegate} est proposé pour cette rotation car la zone couverte correspond à {profile['zone']}, "
            f"l'expertise terrain est adaptée ({profile['strength'].lower()}) "
            f"et la charge actuelle reste compatible avec la priorité détectée."
        ),
        "assignment_criteria": [
            f"Zone couverte : {profile['zone']}",
            f"Priorité : {priority}",
            f"Action : {action_timing}",
            f"Familiarité : {profile['familiarity']}",
        ],
    }


def _assignment_priority(item: dict, risk_score: int) -> str:
    flags = item["flags"]
    if flags["stock_rupture"] and item["potential_level"] == "high":
        return "rupture critique + potentiel élevé"
    if flags["competitor_activity"]:
        return "pression concurrentielle + baisse des commandes"
    if flags["rotation_delay"] and item["potential_level"] == "high":
        return "retard de couverture + pharmacie à potentiel élevé"
    if flags["visibility_issue"]:
        return "visibilité officinale à consolider"
    if flags["stable"]:
        return "suivi standard d'une pharmacie stable"
    return f"score de risque {_urgency_level(risk_score)}"


def _action_timing(risk_score: int) -> str:
    if risk_score >= 85:
        return "visite sous 48 h"
    if risk_score >= 65:
        return "visite prioritaire cette semaine"
    if risk_score >= 40:
        return "visite de consolidation au prochain cycle"
    return "surveillance dans la rotation standard"


def _score_breakdown(item: dict, risk_score: int) -> list[dict]:
    breakdown = [entry.copy() for entry in item["score_breakdown"]]
    total = sum(entry["value"] for entry in breakdown)
    if total != risk_score and breakdown:
        breakdown[-1]["value"] += risk_score - total
        breakdown[-1]["reason"] += " Ajustement déterministe pour conserver la cohérence du score total."
    return breakdown


def _score(item: dict, related_signals: list[OperationalSignal]) -> int:
    if "base_score" in item:
        return max(0, min(int(item["base_score"]), 100))

    flags = item["flags"]
    score = 0
    last_visit_days = item["last_visit_days"]

    if last_visit_days > 30:
        score += 25
    elif last_visit_days > 20:
        score += 15
    elif last_visit_days > 14:
        score += 8

    if flags["stock_rupture"]:
        score += 25
    if flags["competitor_activity"]:
        score += 18
    if flags["order_decrease"]:
        score += 15
    if item["potential_level"] == "high":
        score += 15
    elif item["potential_level"] == "medium":
        score += 8
    if flags["unresolved_actions"]:
        score += 10
    if flags["repeated_negative_signals"]:
        score += 10
    if flags["rotation_delay"]:
        score += 12
    if flags["visibility_issue"]:
        score += 18
    if flags["stable"]:
        score -= 8

    score += min(len(related_signals) * 3, 9)
    return max(0, min(score, 100))


def _risk_factors(item: dict, related_signals: list[OperationalSignal]) -> list[str]:
    flags = item["flags"]
    factors = []
    if item["last_visit_days"] > 30:
        factors.append("Retard de visite supérieur à 30 jours")
    elif item["last_visit_days"] > 14:
        factors.append("Rotation terrain à surveiller")
    if flags["stock_rupture"]:
        factors.append("Rupture ou faible disponibilité")
    if flags["competitor_activity"]:
        factors.append("Activité concurrentielle détectée")
    if flags["order_decrease"]:
        factors.append("Baisse des commandes")
    if item["potential_level"] == "high":
        factors.append("Potentiel commercial élevé")
    if flags["unresolved_actions"]:
        factors.append("Actions terrain non clôturées")
    if flags["repeated_negative_signals"]:
        factors.append("Signaux négatifs répétés")
    if flags["rotation_delay"]:
        factors.append("Délai de rotation délégué")
    if flags["visibility_issue"]:
        factors.append("Visibilité produit insuffisante")
    if related_signals:
        factors.append("Signaux opérationnels associés")
    if flags["stable"]:
        factors.append("Situation stable")
    return factors


def _related_signals(item: dict, signals: list[OperationalSignal]) -> list[OperationalSignal]:
    city = item["city"].lower()
    zone = item["zone"].lower()
    related_categories = _categories_for_flags(item["flags"])
    related = []
    for signal in signals:
        location = f"{signal.region} {signal.territory}".lower()
        if city in location or zone in location or signal.category in related_categories:
            related.append(signal)
    return related[:4]


def _categories_for_flags(flags: dict) -> set[str]:
    categories = set()
    if flags["stock_rupture"]:
        categories.add("stock_issue")
    if flags["competitor_activity"]:
        categories.add("competitor_activity")
    if flags["order_decrease"]:
        categories.add("pricing_pressure")
    if flags["visibility_issue"]:
        categories.add("product_feedback")
    return categories


def _build_zones(pharmacies: list[PharmacyRiskItem]) -> list[PharmacyRiskZone]:
    grouped: dict[tuple[str, str], list[PharmacyRiskItem]] = defaultdict(list)
    for pharmacy in pharmacies:
        grouped[(pharmacy.zone, pharmacy.city)].append(pharmacy)

    zones = []
    for (zone, city), items in grouped.items():
        top_item = max(items, key=lambda item: item.risk_score)
        issue_counts = Counter(item.main_issue for item in items)
        risk_score = round(sum(item.risk_score for item in items) / len(items))
        zones.append(
            PharmacyRiskZone(
                zone=zone,
                city=city,
                risk_score=risk_score,
                urgency_level=_urgency_level(risk_score),
                pharmacies_count=len(items),
                main_issue=issue_counts.most_common(1)[0][0],
                suggested_delegate=top_item.suggested_delegate,
                recommended_action=top_item.recommended_action,
                top_pharmacy=top_item.pharmacy_name,
                risk_drivers=top_item.risk_factors[:4],
                action_timeframe=top_item.recommended_timeframe,
            )
        )
    return sorted(zones, key=lambda item: item.risk_score, reverse=True)


def _urgency_level(score: int) -> str:
    if score >= 85:
        return "critical"
    if score >= 65:
        return "high"
    if score >= 40:
        return "medium"
    return "low"
