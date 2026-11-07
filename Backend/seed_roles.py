"""CLI tool and script to seed and manage platform admin and non-traveler roles in Porikroma.

Usage:
    # Run full seed for roles and demo personas:
    python seed_roles.py

    # List all users, assigned roles, and provider verification status:
    python seed_roles.py --list

    # Grant all non-traveler roles (+ approved provider profile) to a user:
    python seed_roles.py --grant-all --user abrar.porikroma
    python seed_roles.py --grant-all --user a18357a3-b1ee-4377-aeba-750194f66615

    # Grant a specific role:
    python seed_roles.py --grant platform_admin --user abrar.porikroma
    python seed_roles.py --grant provider --user demo_provider

    # Revoke a specific role:
    python seed_roles.py --revoke provider --user demo_tanvir
"""

from __future__ import annotations

import os

import argparse
from datetime import datetime, timezone
import sys
from uuid import UUID

from sqlalchemy import select

from app.core.permissions import ensure_role, revoke_role, role_names
from app.db.database import SessionLocal
from app.models import Profile, ProviderProfile, Role

ALL_ROLES = [
    ("traveler", "Create and manage personal travel plans and community activity."),
    ("provider", "Manage an approved provider profile, tours and reservation requests."),
    ("provider_reviewer", "Review provider applications and verification documents."),
    ("catalog_staff", "Review and manage the public tour catalog."),
    ("moderator", "Moderate forum content and community reports."),
    ("support", "Assist users with account and reservation support workflows."),
    ("platform_admin", "Full platform administration and role management."),
]

NON_TRAVELER_ROLES = [
    "platform_admin",
    "provider",
    "provider_reviewer",
    "catalog_staff",
    "moderator",
    "support",
]


def find_profile(db, identifier: str) -> Profile | None:
    try:
        user_uuid = UUID(identifier)
        p = db.get(Profile, user_uuid)
        if p:
            return p
    except ValueError:
        pass

    # Match by username or partial match
    p = db.scalar(select(Profile).where(Profile.username == identifier))
    if p:
        return p

    # Case-insensitive match on username
    p = db.scalar(select(Profile).where(Profile.username.ilike(identifier)))
    if p:
        return p

    # Partial match on username or full_name
    p = db.scalar(select(Profile).where(Profile.username.ilike(f"%{identifier}%")))
    if p:
        return p

    return db.scalar(select(Profile).where(Profile.full_name.ilike(f"%{identifier}%")))


def seed_all_roles() -> None:
    with SessionLocal() as db:
        print("Ensuring all role definitions exist in database...")
        for r_name, r_desc in ALL_ROLES:
            role = db.scalar(select(Role).where(Role.name == r_name))
            if not role:
                role = Role(name=r_name, description=r_desc)
                db.add(role)
                print(f"  [+] Created role: {r_name}")
            else:
                role.description = r_desc
                print(f"  [=] Role exists: {r_name}")
        db.commit()

        # Seed demo user roles if profiles exist
        demo_role_map = {
            "demo_sarah": ["traveler", "platform_admin"],
            "demo_tanvir": ["traveler"],
            "demo_nusrat": ["traveler"],
            "demo_admin": ["platform_admin", "traveler"],
            "demo_provider": ["provider", "traveler"],
            "demo_reviewer": ["provider_reviewer", "traveler"],
            "demo_catalog": ["catalog_staff", "traveler"],
            "demo_moderator": ["moderator", "traveler"],
            "demo_support": ["support", "traveler"],
        }

        print("\nSyncing demo personas with non-traveler roles...")
        for username, roles in demo_role_map.items():
            p = db.scalar(select(Profile).where(Profile.username == username))
            if p:
                for r in roles:
                    ensure_role(db, p.id, r)
                print(f"  [+] {username} ({p.id}) -> roles: {sorted(role_names(db, p.id))}")

        # Active test / developer profile
        active_admin_id = UUID("a18357a3-b1ee-4377-aeba-750194f66615")
        active_admin = db.get(Profile, active_admin_id)
        if active_admin:
            print(f"\nSeeding non-traveler roles for active user {active_admin.username} ({active_admin.id})...")
            for r in ["platform_admin", "provider", "provider_reviewer", "catalog_staff", "moderator", "support", "traveler"]:
                ensure_role(db, active_admin.id, r, granted_by=active_admin.id)
            
            # Ensure approved ProviderProfile
            prov = db.scalar(select(ProviderProfile).where(ProviderProfile.user_id == active_admin.id))
            if not prov:
                prov = ProviderProfile(
                    user_id=active_admin.id,
                    business_name="Abrar Expeditions & Tours",
                    display_name="Abrar Expeditions",
                    description="Premium guided cultural and outdoor expeditions across Bangladesh.",
                    phone="+880 1700-000001",
                    website="https://abrarexpeditions.example.com",
                    verification_status="approved",
                    reviewed_by=active_admin.id,
                    review_notes="Developer account verified provider profile",
                    approved_at=datetime.now(timezone.utc),
                )
                db.add(prov)
                print("  [+] Created approved ProviderProfile for active user")
            else:
                prov.verification_status = "approved"
                if not prov.approved_at:
                    prov.approved_at = datetime.now(timezone.utc)
                print("  [=] Updated ProviderProfile to approved for active user")

        # Team developer accounts by profile id (SEED_TEAM_ADMIN_USER_IDS, comma-separated).
        # Usernames are user-editable, so they must never decide who becomes admin.
        for raw_team_id in filter(None, (part.strip() for part in os.getenv("SEED_TEAM_ADMIN_USER_IDS", "").split(","))):
            try:
                team_profile = db.get(Profile, UUID(raw_team_id))
            except ValueError:
                print(f"Ignoring invalid id in SEED_TEAM_ADMIN_USER_IDS: {raw_team_id}")
                continue
            if team_profile:
                for r_name in ["platform_admin", "provider", "traveler"]:
                    ensure_role(db, team_profile.id, r_name)
                print(f"  [+] Team profile {team_profile.username} -> roles: {sorted(role_names(db, team_profile.id))}")

        db.commit()
        print("\nAll roles and non-traveler seed assignments completed successfully!")


def list_users() -> None:
    with SessionLocal() as db:
        profiles = db.scalars(select(Profile).order_by(Profile.created_at.asc())).all()
        print(f"\n{'ID':<38} | {'Username':<18} | {'Full Name':<22} | {'Provider':<10} | Roles")
        print("-" * 125)
        for p in profiles:
            roles = sorted(role_names(db, p.id))
            prov = db.scalar(select(ProviderProfile).where(ProviderProfile.user_id == p.id))
            prov_status = prov.verification_status if prov else "None"
            print(f"{str(p.id):<38} | {p.username or 'None':<18} | {(p.full_name or '')[:20]:<22} | {prov_status:<10} | {', '.join(roles)}")
        print("-" * 125)


def grant_roles(identifier: str, roles: list[str]) -> None:
    with SessionLocal() as db:
        p = find_profile(db, identifier)
        if not p:
            print(f"Error: Profile matching '{identifier}' not found.")
            sys.exit(1)

        print(f"Granting roles to {p.username} ({p.id}): {roles}")
        for r in roles:
            ensure_role(db, p.id, r)
            print(f"  [+] Granted role: {r}")

        if "provider" in roles:
            prov = db.scalar(select(ProviderProfile).where(ProviderProfile.user_id == p.id))
            if not prov:
                prov = ProviderProfile(
                    user_id=p.id,
                    business_name=f"{p.full_name or p.username} Tours",
                    display_name=p.full_name or p.username,
                    description=f"Official provider operations for {p.full_name or p.username}",
                    phone="+880 1700-000000",
                    verification_status="approved",
                    approved_at=datetime.now(timezone.utc),
                )
                db.add(prov)
                print(f"  [+] Created approved ProviderProfile for {p.username}")
            else:
                prov.verification_status = "approved"
                if not prov.approved_at:
                    prov.approved_at = datetime.now(timezone.utc)
                print(f"  [=] ProviderProfile marked as approved for {p.username}")

        db.commit()
        updated_roles = sorted(role_names(db, p.id))
        print(f"\nSuccess! User {p.username} now has roles: {updated_roles}")


def revoke_role_cli(identifier: str, role_name: str) -> None:
    with SessionLocal() as db:
        p = find_profile(db, identifier)
        if not p:
            print(f"Error: Profile matching '{identifier}' not found.")
            sys.exit(1)

        if role_name == "traveler":
            print("Error: The base traveler role cannot be revoked.")
            sys.exit(1)

        if revoke_role(db, p.id, role_name):
            db.commit()
            print(f"Success! Revoked role '{role_name}' from {p.username}.")
        else:
            print(f"Role '{role_name}' was not active on {p.username}.")


def main() -> None:
    parser = argparse.ArgumentParser(description="Porikroma Role Management & Seed Tool")
    parser.add_argument("--list", action="store_true", help="List all users, their roles, and provider status")
    parser.add_argument("--grant-all", action="store_true", help="Grant all non-traveler roles and approve provider profile")
    parser.add_argument("--grant", type=str, help="Grant a specific role (e.g. platform_admin, provider, catalog_staff)")
    parser.add_argument("--revoke", type=str, help="Revoke a specific role")
    parser.add_argument("--user", type=str, help="Target user by username, email, or UUID")
    args = parser.parse_args()

    if args.list:
        list_users()
        return

    if args.grant_all:
        if not args.user:
            print("Error: --user is required when using --grant-all.")
            sys.exit(1)
        roles = ["platform_admin", "provider", "provider_reviewer", "catalog_staff", "moderator", "support", "traveler"]
        grant_roles(args.user, roles)
        return

    if args.grant:
        if not args.user:
            print("Error: --user is required when using --grant.")
            sys.exit(1)
        grant_roles(args.user, [args.grant])
        return

    if args.revoke:
        if not args.user:
            print("Error: --user is required when using --revoke.")
            sys.exit(1)
        revoke_role_cli(args.user, args.revoke)
        return

    # Default action: run full seed
    seed_all_roles()


if __name__ == "__main__":
    main()
