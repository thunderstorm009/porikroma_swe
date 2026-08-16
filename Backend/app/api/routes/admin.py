from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.permissions import ensure_role, require_roles, revoke_role, role_names
from app.db.database import get_db
from app.models import AuditLog, Profile, ProviderProfile, Tour
from app.schemas import AccountStatusUpdate, ProfileRead, ProviderProfileRead, ReviewUpdate, RoleAssignment, TourRead
from app.services.audit_service import record_audit

router = APIRouter(prefix="/admin", tags=["Admin"])


@router.get("/providers", summary="List provider applications")
def list_provider_applications(
    status_filter: str | None = Query(None, alias="status"),
    _: Profile = Depends(require_roles("platform_admin", "provider_reviewer")),
    db: Session = Depends(get_db),
):
    stmt = select(ProviderProfile).order_by(ProviderProfile.created_at.desc())
    if status_filter:
        stmt = stmt.where(ProviderProfile.verification_status == status_filter)
    rows = db.scalars(stmt).all()
    return {"data": [ProviderProfileRead.model_validate(row) for row in rows]}


@router.patch("/providers/{provider_id}/review", summary="Approve or reject a provider application")
def review_provider(
    provider_id: UUID,
    payload: ReviewUpdate,
    reviewer: Profile = Depends(require_roles("platform_admin", "provider_reviewer")),
    db: Session = Depends(get_db),
):
    new_status = payload.status
    if new_status not in {"approved", "rejected", "suspended", "pending"}:
        raise HTTPException(status_code=422, detail="Invalid provider review status")
    provider = db.get(ProviderProfile, provider_id)
    if provider is None:
        raise HTTPException(status_code=404, detail="Provider application not found")
    provider.verification_status = new_status
    provider.reviewed_by = reviewer.id
    provider.review_notes = payload.review_notes
    if new_status == "approved":
        from datetime import datetime, timezone

        provider.approved_at = datetime.now(timezone.utc)
        ensure_role(db, provider.user_id, "provider", reviewer.id)
    else:
        revoke_role(db, provider.user_id, "provider")
    record_audit(db, actor_id=reviewer.id, action="provider_reviewed", resource_type="provider_profile", resource_id=provider.id, metadata={"status": new_status})
    db.commit()
    db.refresh(provider)
    return {"data": ProviderProfileRead.model_validate(provider)}


@router.get("/tours", summary="List tours for catalog review")
def list_catalog_tours(
    status_filter: str | None = Query(None, alias="status"),
    _: Profile = Depends(require_roles("platform_admin", "catalog_staff")),
    db: Session = Depends(get_db),
):
    stmt = select(Tour).order_by(Tour.created_at.desc())
    if status_filter:
        stmt = stmt.where(Tour.status == status_filter)
    return {"data": [TourRead.model_validate(row) for row in db.scalars(stmt).all()]}


@router.patch("/tours/{tour_id}/review", summary="Publish, pause or reject a tour")
def review_tour(
    tour_id: UUID,
    payload: ReviewUpdate,
    reviewer: Profile = Depends(require_roles("platform_admin", "catalog_staff")),
    db: Session = Depends(get_db),
):
    new_status = payload.status
    if new_status not in {"published", "paused", "archived", "rejected"}:
        raise HTTPException(status_code=422, detail="Invalid catalog status")
    tour = db.get(Tour, tour_id)
    if tour is None:
        raise HTTPException(status_code=404, detail="Tour not found")
    if new_status == "published" and tour.provider.verification_status != "approved":
        raise HTTPException(status_code=409, detail="Tour provider is not approved")
    tour.status = new_status
    record_audit(db, actor_id=reviewer.id, action="tour_reviewed", resource_type="tour", resource_id=tour.id, metadata={"status": new_status})
    db.commit()
    db.refresh(tour)
    return {"data": TourRead.model_validate(tour)}


@router.get("/users/{user_id}/access", summary="Inspect a user's roles")
def get_user_access(user_id: UUID, _: Profile = Depends(require_roles("platform_admin", "support")), db: Session = Depends(get_db)):
    profile = db.get(Profile, user_id)
    if profile is None:
        raise HTTPException(status_code=404, detail="User not found")
    return {"data": {"profile": ProfileRead.model_validate(profile), "roles": sorted(role_names(db, profile.id))}}


@router.post("/users/{user_id}/roles", summary="Grant a platform role")
def grant_user_role(
    user_id: UUID,
    payload: RoleAssignment,
    admin: Profile = Depends(require_roles("platform_admin")),
    db: Session = Depends(get_db),
):
    if db.get(Profile, user_id) is None:
        raise HTTPException(status_code=404, detail="User not found")
    assignment = ensure_role(db, user_id, payload.role, admin.id)
    record_audit(db, actor_id=admin.id, action="role_granted", resource_type="user_role", resource_id=assignment.id, metadata={"user_id": str(user_id), "role": payload.role})
    db.commit()
    return {"data": {"user_id": user_id, "role": payload.role, "active": True}}


@router.delete("/users/{user_id}/roles/{role_name}", summary="Revoke a platform role")
def remove_user_role(user_id: UUID, role_name: str, admin: Profile = Depends(require_roles("platform_admin")), db: Session = Depends(get_db)):
    if role_name == "traveler":
        raise HTTPException(status_code=400, detail="The base traveler role cannot be revoked")
    if not revoke_role(db, user_id, role_name):
        raise HTTPException(status_code=404, detail="Active role assignment not found")
    record_audit(db, actor_id=admin.id, action="role_revoked", resource_type="user", resource_id=user_id, metadata={"role": role_name})
    db.commit()
    return {"data": {"user_id": user_id, "role": role_name, "active": False}}


@router.patch("/users/{user_id}/status", summary="Suspend or reactivate a user account")
def update_user_status(user_id: UUID, payload: AccountStatusUpdate, admin: Profile = Depends(require_roles("platform_admin")), db: Session = Depends(get_db)):
    profile = db.get(Profile, user_id)
    if profile is None:
        raise HTTPException(status_code=404, detail="User not found")
    if profile.id == admin.id and payload.account_status != "active":
        raise HTTPException(status_code=400, detail="An administrator cannot suspend their own account")
    profile.account_status = payload.account_status
    record_audit(db, actor_id=admin.id, action="account_status_changed", resource_type="profile", resource_id=profile.id, metadata={"account_status": payload.account_status})
    db.commit()
    return {"data": ProfileRead.model_validate(profile)}


@router.get("/audit-logs", summary="List administrative audit logs")
def list_audit_logs(
    _: Profile = Depends(require_roles("platform_admin")),
    db: Session = Depends(get_db),
    limit: int = Query(100, ge=1, le=500),
):
    rows = db.scalars(select(AuditLog).order_by(AuditLog.created_at.desc()).limit(limit)).all()
    return {"data": [{"id": row.id, "actor_id": row.actor_id, "action": row.action, "resource_type": row.resource_type, "resource_id": row.resource_id, "metadata": row.metadata_json, "created_at": row.created_at} for row in rows]}
