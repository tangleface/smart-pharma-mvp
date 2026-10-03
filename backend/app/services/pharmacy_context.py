from datetime import datetime, timezone
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy import and_, or_, select
from sqlalchemy.orm import Session, aliased

from app.models_vnext import (
    VNextAction,
    VNextClassification,
    VNextDirective,
    VNextObservation,
    VNextPharmacy,
    VNextProduct,
    VNextTerritory,
    VNextUser,
    VNextVisit,
)
from app.schemas_vnext import (
    PharmacyActionContext,
    PharmacyContextResponse,
    PharmacyDirectiveContext,
    PharmacyObservationContext,
)


def get_pharmacy_context(db: Session, pharmacy_id: UUID) -> PharmacyContextResponse:
    now = datetime.now(timezone.utc)

    base = db.execute(
        select(
            VNextPharmacy.id,
            VNextPharmacy.organization_id,
            VNextPharmacy.territory_id,
            VNextPharmacy.name,
            VNextPharmacy.internal_code,
            VNextPharmacy.segment,
            VNextPharmacy.status.label("pharmacy_status"),
            VNextTerritory.name.label("territory"),
            VNextUser.full_name.label("delegate"),
        )
        .outerjoin(VNextTerritory, VNextTerritory.id == VNextPharmacy.territory_id)
        .outerjoin(VNextUser, VNextUser.id == VNextPharmacy.assigned_delegate_id)
        .where(VNextPharmacy.id == pharmacy_id)
    ).one_or_none()

    if base is None:
        raise HTTPException(status_code=404, detail="Pharmacy not found")

    priority = db.execute(
        select(VNextClassification.value, VNextClassification.reason)
        .where(
            VNextClassification.pharmacy_id == pharmacy_id,
            VNextClassification.classification_type == "priority",
            VNextClassification.valid_from <= now,
            or_(
                VNextClassification.valid_until.is_(None),
                VNextClassification.valid_until >= now,
            ),
        )
        .order_by(VNextClassification.valid_from.desc())
        .limit(1)
    ).one_or_none()

    validator = aliased(VNextUser)
    observations = db.execute(
        select(
            VNextObservation.id,
            VNextObservation.category,
            VNextObservation.observation_text,
            VNextProduct.name.label("product"),
            VNextObservation.source,
            VNextObservation.validation_status,
            VNextObservation.created_at,
            VNextObservation.validated_at,
            validator.full_name.label("validated_by"),
        )
        .join(VNextVisit, VNextVisit.id == VNextObservation.visit_id)
        .outerjoin(VNextProduct, VNextProduct.id == VNextObservation.product_id)
        .outerjoin(validator, validator.id == VNextObservation.validated_by)
        .where(VNextVisit.pharmacy_id == pharmacy_id)
        .order_by(VNextObservation.created_at.desc())
        .limit(5)
    ).all()

    directive_creator = aliased(VNextUser)
    directives = db.execute(
        select(
            VNextDirective.id,
            VNextDirective.title,
            VNextDirective.instruction,
            VNextDirective.reason,
            VNextDirective.pharmacy_id,
            VNextProduct.name.label("product"),
            VNextDirective.status,
            VNextDirective.valid_from,
            VNextDirective.valid_until,
            directive_creator.full_name.label("created_by"),
        )
        .outerjoin(VNextProduct, VNextProduct.id == VNextDirective.product_id)
        .join(directive_creator, directive_creator.id == VNextDirective.created_by)
        .where(
            VNextDirective.organization_id == base.organization_id,
            VNextDirective.status == "active",
            VNextDirective.valid_from <= now,
            or_(VNextDirective.valid_until.is_(None), VNextDirective.valid_until >= now),
            or_(
                VNextDirective.pharmacy_id == pharmacy_id,
                and_(
                    VNextDirective.pharmacy_id.is_(None),
                    VNextDirective.territory_id == base.territory_id,
                ),
            ),
        )
        .order_by(VNextDirective.valid_from.desc())
    ).all()

    assignee = aliased(VNextUser)
    action_creator = aliased(VNextUser)
    actions = db.execute(
        select(
            VNextAction.id,
            VNextAction.title,
            VNextAction.action_type,
            VNextAction.status,
            VNextAction.priority,
            VNextAction.source,
            VNextAction.rationale,
            VNextAction.due_at,
            assignee.full_name.label("assigned_to"),
            action_creator.full_name.label("created_by"),
        )
        .outerjoin(assignee, assignee.id == VNextAction.assigned_to)
        .join(action_creator, action_creator.id == VNextAction.created_by)
        .where(
            VNextAction.pharmacy_id == pharmacy_id,
            VNextAction.status.in_(["open", "in_progress"]),
        )
        .order_by(VNextAction.created_at.desc())
    ).all()

    return PharmacyContextResponse(
        pharmacy_id=base.id,
        name=base.name,
        internal_code=base.internal_code,
        territory=base.territory,
        delegate=base.delegate,
        segment=base.segment,
        pharmacy_status=base.pharmacy_status,
        management_priority=priority.value if priority else None,
        management_priority_reason=priority.reason if priority else None,
        observations=[
            PharmacyObservationContext(
                id=row.id,
                category=row.category,
                text=row.observation_text,
                product=row.product,
                source=row.source,
                validation_status=row.validation_status,
                observed_at=row.created_at,
                validated_at=row.validated_at,
                validated_by=row.validated_by,
            )
            for row in observations
        ],
        directives=[
            PharmacyDirectiveContext(
                id=row.id,
                title=row.title,
                instruction=row.instruction,
                reason=row.reason,
                product=row.product,
                scope="pharmacy" if row.pharmacy_id == pharmacy_id else "territory",
                status=row.status,
                valid_from=row.valid_from,
                valid_until=row.valid_until,
                created_by=row.created_by,
            )
            for row in directives
        ],
        actions=[
            PharmacyActionContext(
                id=row.id,
                title=row.title,
                action_type=row.action_type,
                status=row.status,
                priority=row.priority,
                source=row.source,
                rationale=row.rationale,
                due_at=row.due_at,
                assigned_to=row.assigned_to,
                created_by=row.created_by,
            )
            for row in actions
        ],
    )
