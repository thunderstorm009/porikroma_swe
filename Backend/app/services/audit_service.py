"""Small audit helper used by role and provider workflows."""

from __future__ import annotations

from uuid import UUID

from sqlalchemy.orm import Session

from app.models import AuditLog


def record_audit(
    db: Session,
    *,
    actor_id: UUID | None,
    action: str,
    resource_type: str,
    resource_id: UUID | None = None,
    metadata: dict | None = None,
) -> AuditLog:
    row = AuditLog(
        actor_id=actor_id,
        action=action,
        resource_type=resource_type,
        resource_id=resource_id,
        metadata_json=metadata or {},
    )
    db.add(row)
    return row
