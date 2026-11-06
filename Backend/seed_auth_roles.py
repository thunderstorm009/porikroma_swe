"""Seed Supabase Auth users and assign platform admin and non-traveler roles in Porikroma.

This script:
1. Idempotently provisions Supabase Auth users with pre-confirmed emails and known passwords.
2. Synchronizes their Profiles in PostgreSQL.
3. Assigns their platform admin and non-traveler roles in user_roles.
4. Provisions approved ProviderProfile records where applicable.
5. Tests the login for each account via Supabase Auth password grant to guarantee credentials work.
"""

from __future__ import annotations

from datetime import datetime, timezone
import os
import sys
from uuid import UUID

from dotenv import load_dotenv
import httpx
from sqlalchemy import select

from app.core.permissions import ensure_role, role_names
from app.db.database import SessionLocal
from app.models import Profile, ProviderProfile, Role

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
PUBLISHABLE_KEY = os.getenv("SUPABASE_PUBLISHABLE_KEY")
SECRET_KEY = os.getenv("SUPABASE_SECRET_KEY")

if not SUPABASE_URL or not SECRET_KEY:
    print("Error: SUPABASE_URL and SUPABASE_SECRET_KEY must be configured in .env")
    sys.exit(1)

ROLE_ACCOUNTS = [
    {
        "role_key": "platform_admin",
        "role_display": "Platform Admin (Super Admin)",
        "email": "admin.porikroma@gmail.com",
        "password": "Password123!",
        "username": "admin.porikroma",
        "full_name": "Porikroma Platform Admin",
        "bio": "System Administrator & Platform Governance Lead",
        "roles": ["platform_admin", "traveler"],
    },
    {
        "role_key": "provider",
        "role_display": "Tour Provider (Approved Operator)",
        "email": "provider.porikroma@gmail.com",
        "password": "Password123!",
        "username": "provider.porikroma",
        "full_name": "Bengal Eco Adventures",
        "bio": "Certified Tour Operator specializing in eco-tours across Bangladesh",
        "roles": ["provider", "traveler"],
        "provider_profile": {
            "business_name": "Bengal Eco Adventures Ltd.",
            "display_name": "Bengal Eco Adventures",
            "description": "Certified eco-tours and cultural expeditions across the Sundarbans, Sajek, and Bandarban.",
            "phone": "+880 1712-345678",
            "website": "https://bengaleco.example.com",
            "verification_status": "approved",
        },
    },
    {
        "role_key": "provider_reviewer",
        "role_display": "Provider Reviewer (Staff)",
        "email": "reviewer.porikroma@gmail.com",
        "password": "Password123!",
        "username": "reviewer.porikroma",
        "full_name": "Rahim Reviewer",
        "bio": "Provider Verification & Compliance Specialist",
        "roles": ["provider_reviewer", "traveler"],
    },
    {
        "role_key": "catalog_staff",
        "role_display": "Catalog Staff (Inventory & Tours)",
        "email": "catalog.porikroma@gmail.com",
        "password": "Password123!",
        "username": "catalog.porikroma",
        "full_name": "Kamal Catalog",
        "bio": "Tour Inventory & Catalog Operations Coordinator",
        "roles": ["catalog_staff", "traveler"],
    },
    {
        "role_key": "moderator",
        "role_display": "Community Moderator",
        "email": "moderator.porikroma@gmail.com",
        "password": "Password123!",
        "username": "moderator.porikroma",
        "full_name": "Mitu Moderator",
        "bio": "Community Forum Moderator & Trust & Safety Lead",
        "roles": ["moderator", "traveler"],
    },
    {
        "role_key": "support",
        "role_display": "Customer Support Agent",
        "email": "support.porikroma@gmail.com",
        "password": "Password123!",
        "username": "support.porikroma",
        "full_name": "Samiha Support",
        "bio": "Customer Support & Reservation Assistance Agent",
        "roles": ["support", "traveler"],
    },
    {
        "role_key": "traveler",
        "role_display": "Standard Traveler",
        "email": "traveler.porikroma@gmail.com",
        "password": "Password123!",
        "username": "traveler.porikroma",
        "full_name": "Porikroma Solo Traveler",
        "bio": "Explorer and travel enthusiast across Bangladesh",
        "roles": ["traveler"],
    },
    {
        "role_key": "all_in_one",
        "role_display": "Developer / All Roles (Platform Admin & Provider)",
        "email": "abrar.porikroma@gmail.com",
        "password": "TestPassword123!",
        "username": "abrar.porikroma",
        "full_name": "Abrar Al-Mamun",
        "bio": "Lead Developer & Super Admin with all platform capabilities enabled",
        "roles": [
            "platform_admin",
            "provider",
            "provider_reviewer",
            "catalog_staff",
            "moderator",
            "support",
            "traveler",
        ],
        "provider_profile": {
            "business_name": "Abrar Expeditions & Tours",
            "display_name": "Abrar Expeditions",
            "description": "Premium guided tours and outdoor expeditions across Bangladesh.",
            "phone": "+880 1700-000001",
            "website": "https://abrarexpeditions.example.com",
            "verification_status": "approved",
        },
    },
]


def sync_auth_users() -> list[dict]:
    admin_headers = {
        "apikey": SECRET_KEY,
        "Authorization": f"Bearer {SECRET_KEY}",
        "Content-Type": "application/json",
    }

    with httpx.Client(timeout=20.0) as client:
        # 1. Fetch existing Supabase auth users
        resp = client.get(f"{SUPABASE_URL}/auth/v1/admin/users?per_page=100", headers=admin_headers)
        if resp.status_code != 200:
            print(f"Failed to fetch users from Supabase: {resp.status_code} {resp.text}")
            sys.exit(1)
        existing_users_by_email = {u["email"].lower(): u for u in resp.json().get("users", []) if u.get("email")}

        seeded_results = []

        with SessionLocal() as db:
            for acc in ROLE_ACCOUNTS:
                email = acc["email"].lower()
                password = acc["password"]
                full_name = acc["full_name"]
                username = acc["username"]

                user_id = None
                if email in existing_users_by_email:
                    existing = existing_users_by_email[email]
                    user_id = UUID(existing["id"])
                    # Update password and confirm email
                    up_resp = client.put(
                        f"{SUPABASE_URL}/auth/v1/admin/users/{user_id}",
                        headers=admin_headers,
                        json={
                            "password": password,
                            "email_confirm": True,
                            "user_metadata": {"full_name": full_name, "username": username},
                        },
                    )
                    if up_resp.status_code not in (200, 204):
                        print(f"  [!] Notice updating {email}: {up_resp.status_code} {up_resp.text}")
                    else:
                        print(f"  [=] Updated credentials for existing user {email}")
                else:
                    # Create new Supabase auth user
                    cr_resp = client.post(
                        f"{SUPABASE_URL}/auth/v1/admin/users",
                        headers=admin_headers,
                        json={
                            "email": email,
                            "password": password,
                            "email_confirm": True,
                            "user_metadata": {"full_name": full_name, "username": username},
                        },
                    )
                    if cr_resp.status_code not in (200, 201):
                        print(f"  [!] Failed to create user {email}: {cr_resp.status_code} {cr_resp.text}")
                        continue
                    new_user = cr_resp.json()
                    user_id = UUID(new_user["id"])
                    print(f"  [+] Created new Supabase user {email} (ID: {user_id})")

                # Synchronize PostgreSQL Profile
                profile = db.get(Profile, user_id)
                if not profile:
                    profile = Profile(
                        id=user_id,
                        username=username,
                        full_name=full_name,
                        bio=acc["bio"],
                        account_status="active",
                    )
                    db.add(profile)
                    db.flush()
                else:
                    profile.full_name = full_name
                    profile.bio = acc["bio"]
                    profile.account_status = "active"

                # Assign roles in user_roles
                for r in acc["roles"]:
                    ensure_role(db, user_id, r)

                # Assign ProviderProfile if configured
                prov_config = acc.get("provider_profile")
                if prov_config:
                    prov = db.scalar(select(ProviderProfile).where(ProviderProfile.user_id == user_id))
                    if not prov:
                        prov = ProviderProfile(
                            user_id=user_id,
                            business_name=prov_config["business_name"],
                            display_name=prov_config["display_name"],
                            description=prov_config["description"],
                            phone=prov_config["phone"],
                            website=prov_config.get("website"),
                            verification_status=prov_config["verification_status"],
                            approved_at=datetime.now(timezone.utc),
                        )
                        db.add(prov)
                    else:
                        prov.business_name = prov_config["business_name"]
                        prov.display_name = prov_config["display_name"]
                        prov.verification_status = prov_config["verification_status"]
                        if not prov.approved_at:
                            prov.approved_at = datetime.now(timezone.utc)

                db.commit()

                # Verify login works via Supabase Auth password grant
                auth_resp = client.post(
                    f"{SUPABASE_URL}/auth/v1/token?grant_type=password",
                    headers={"apikey": PUBLISHABLE_KEY, "Content-Type": "application/json"},
                    json={"email": email, "password": password},
                )
                login_ok = auth_resp.status_code == 200

                seeded_results.append({
                    "role_display": acc["role_display"],
                    "email": email,
                    "password": password,
                    "roles": sorted(role_names(db, user_id)),
                    "login_verified": login_ok,
                })

        return seeded_results


def main():
    print("=" * 80)
    print("PROVISIONING SUPABASE AUTH USERS & ROLE PERMISSIONS")
    print("=" * 80)
    results = sync_auth_users()
    print("\n" + "=" * 80)
    print("LOGIN CREDENTIALS FOR SEEDED ROLES")
    print("=" * 80)
    for r in results:
        status_sym = "[OK - Verified]" if r["login_verified"] else "[FAILED LOGIN]"
        print(f"\nRole:     {r['role_display']}")
        print(f"Email:    {r['email']}")
        print(f"Password: {r['password']}")
        print(f"Roles:    {', '.join(r['roles'])}")
        print(f"Auth:     {status_sym}")
    print("\n" + "=" * 80)


if __name__ == "__main__":
    main()
