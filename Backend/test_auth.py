import os
import json
import urllib.request
from dotenv import load_dotenv

load_dotenv(".env")

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_PUBLISHABLE_KEY")
API_URL = "http://127.0.0.1:8000/api/v1"

email = "abrar.porikroma@gmail.com"
password = "TestPassword123!"

print(f"Signing up {email}...")
signup_url = f"{SUPABASE_URL}/auth/v1/signup"
headers = {
    "apikey": SUPABASE_KEY,
    "Content-Type": "application/json"
}
signup_data = json.dumps({
    "email": email,
    "password": password
}).encode('utf-8')

try:
    req = urllib.request.Request(signup_url, data=signup_data, headers=headers, method='POST')
    resp = urllib.request.urlopen(req)
    print(f"Signup success: {resp.getcode()}")
except urllib.error.HTTPError as e:
    # 400 likely means user exists
    print(f"Signup issue/exists: {e.code} {e.read()}")

print("Logging in...")
token_url = f"{SUPABASE_URL}/auth/v1/token?grant_type=password"
login_data = json.dumps({
    "email": email,
    "password": password
}).encode('utf-8')

try:
    req = urllib.request.Request(token_url, data=login_data, headers=headers, method='POST')
    resp = urllib.request.urlopen(req)
    auth_data = json.loads(resp.read().decode('utf-8'))
    access_token = auth_data["access_token"]
    user_id = auth_data["user"]["id"]
    print(f"Logged in. User UUID: {user_id}")
except urllib.error.HTTPError as e:
    print(f"Login failed: {e.code} {e.read()}")
    exit(1)

print("Testing GET /api/v1/users/me")
me_headers = {
    "Authorization": f"Bearer {access_token}"
}
try:
    req = urllib.request.Request(f"{API_URL}/users/me", headers=me_headers)
    resp = urllib.request.urlopen(req)
    print(f"Status: {resp.getcode()}")
    print(f"Response: {resp.read().decode('utf-8')}")
except urllib.error.HTTPError as e:
    print(f"Me failed: {e.code} {e.read()}")
