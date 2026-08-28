"""Utility script to confirm all unconfirmed user emails in Supabase Auth."""

import os
import httpx
from dotenv import load_dotenv

def confirm_users():
    load_dotenv()
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_SECRET_KEY") or os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    if not url or not key:
        print("SUPABASE_URL and SUPABASE_SECRET_KEY / SUPABASE_SERVICE_ROLE_KEY are required.")
        return

    headers = {"Authorization": f"Bearer {key}", "apikey": key}
    resp = httpx.get(f"{url}/auth/v1/admin/users", headers=headers)
    if resp.status_code != 200:
        print(f"Failed to fetch users: {resp.status_code} {resp.text}")
        return

    users = resp.json().get("users", [])
    confirmed_count = 0
    for u in users:
        if not u.get("email_confirmed_at"):
            uid = u["id"]
            email = u.get("email")
            res = httpx.put(f"{url}/auth/v1/admin/users/{uid}", headers=headers, json={"email_confirm": True})
            if res.status_code == 200:
                print(f"Confirmed: {email} ({uid})")
                confirmed_count += 1
            else:
                print(f"Failed to confirm {email}: {res.status_code} {res.text}")

    print(f"Done. Confirmed {confirmed_count} user(s).")

if __name__ == "__main__":
    confirm_users()
