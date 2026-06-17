from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from app.models import DelegateReport
from app.routes.reports import analyze


DEMO_REPORTS = [
    {
        "delegate_name": "Amira Haddad",
        "region": "Central",
        "territory": "Algiers East",
        "healthcare_provider": "Dr. Samir Benali",
        "institution": "CHU Mustapha",
        "report_text": (
            "Physician reported two patients could not start therapy because the product was not "
            "available at the hospital pharmacy. Staff mentioned a possible stock out lasting one week."
        ),
    },
    {
        "delegate_name": "Karim Mansouri",
        "region": "West",
        "territory": "Oran",
        "healthcare_provider": "Dr. Nadia Belkacem",
        "institution": "EHU Oran",
        "report_text": (
            "Competitor rep visited the department with a strong discount message. Some prescribers "
            "are considering switching new patients because the rival brand is presented as cheaper."
        ),
    },
    {
        "delegate_name": "Lina Saidi",
        "region": "East",
        "territory": "Constantine",
        "healthcare_provider": "Dr. Yacine Rahmani",
        "institution": "Clinique El Amir",
        "report_text": (
            "Doctor asked for updated efficacy data and requested a short presentation for residents. "
            "The team is interested in identifying patient profiles for a trial period."
        ),
    },
    {
        "delegate_name": "Youcef Merabet",
        "region": "South",
        "territory": "Ouargla",
        "healthcare_provider": "Dr. Rania Toumi",
        "institution": "EPH Ouargla",
        "report_text": (
            "One patient reported dizziness after treatment initiation. The doctor asked whether this "
            "side effect was expected and requested medical guidance."
        ),
    },
]


def seed_demo_data(db: Session) -> None:
    if db.query(DelegateReport).count() > 0:
        return

    base_date = datetime.now(timezone.utc)
    for index, item in enumerate(DEMO_REPORTS):
        report = DelegateReport(
            **item,
            visit_date=base_date - timedelta(days=4 - index),
        )
        db.add(report)
        db.commit()
        db.refresh(report)
        analyze(report.id, db)

