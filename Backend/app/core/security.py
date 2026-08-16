"""Supabase JWT validation and authenticated profile dependencies."""

from __future__ import annotations

import logging
from functools import lru_cache
from uuid import UUID

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jwt import PyJWKClient
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.db.database import get_db
from app.models import Profile, Role, UserRole

logger = logging.getLogger(__name__)
bearer = HTTPBearer(auto_error=False)
ASYMMETRIC_JWT_ALGORITHMS = {"RS256", "RS384", "RS512", "ES256", "ES384", "ES512", "EdDSA"}


class AuthenticatedUser:
    def __init__(self, user_id: UUID, claims: dict):
        self.id = user_id
        self.claims = claims


@lru_cache(maxsize=1)
def _jwks_client() -> PyJWKClient | None:
    url = get_settings().supabase_jwks_url
    return PyJWKClient(url) if url else None


def _decode_token(token: str) -> dict:
    settings = get_settings()
    try:
        header = jwt.get_unverified_header(token)
        algorithm = header.get("alg", "RS256")
        # Supabase projects using the current signing-key model may issue ES256,
        # RS256, or EdDSA tokens. All asymmetric tokens must be verified with the
        # project's JWKS; the legacy shared secret is only valid for HS256 tokens.
        if algorithm in ASYMMETRIC_JWT_ALGORITHMS and _jwks_client():
            key = _jwks_client().get_signing_key_from_jwt(token).key
            return jwt.decode(token, key, algorithms=[algorithm], options={"require": ["sub"]}, audience="authenticated")
        if algorithm not in {"HS256", "HS384", "HS512"}:
            raise RuntimeError(f"Unsupported Supabase JWT algorithm: {algorithm}")
        secret = settings.supabase_jwt_secret
        if not secret:
            # SUPABASE_SECRET_KEY is retained only as a backwards-compatible
            # fallback for legacy HS256 projects. It is never sent to clients.
            secret = settings.supabase_secret_key
        if not secret:
            raise RuntimeError("Supabase JWT verification is not configured")
        return jwt.decode(token, secret, algorithms=[algorithm], audience="authenticated")
    except Exception as exc:
        logger.info("JWT validation failed: %s", type(exc).__name__)
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired access token") from exc


def get_current_user(credentials: HTTPAuthorizationCredentials | None = Depends(bearer)) -> AuthenticatedUser:
    if credentials is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required")
    claims = _decode_token(credentials.credentials)
    try:
        user_id = UUID(str(claims["sub"]))
    except (KeyError, ValueError) as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid user identity") from exc
    return AuthenticatedUser(user_id, claims)


def get_current_profile(
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Profile:
    profile = db.scalar(select(Profile).where(Profile.id == current_user.id))
    if profile:
        if profile.account_status != "active":
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="This account is not active")
        traveler_role = db.scalar(select(Role).where(Role.name == "traveler"))
        if traveler_role is None:
            traveler_role = Role(name="traveler", description="Create and manage personal travel plans and community activity.")
            db.add(traveler_role)
            db.flush()
        assignment = db.scalar(select(UserRole).where(UserRole.user_id == profile.id, UserRole.role_id == traveler_role.id))
        if assignment is None:
            db.add(UserRole(user_id=profile.id, role_id=traveler_role.id))
            db.commit()
        elif assignment.revoked_at is not None:
            assignment.revoked_at = None
            db.commit()
        return profile
    claims = current_user.claims
    email = str(claims.get("email", ""))
    username = email.split("@", 1)[0][:80] or f"traveler-{str(current_user.id)[:8]}"
    profile = Profile(
        id=current_user.id,
        username=username,
        full_name=(claims.get("user_metadata") or {}).get("full_name") or claims.get("name"),
    )
    db.add(profile)
    db.commit()
    db.refresh(profile)
    traveler_role = db.scalar(select(Role).where(Role.name == "traveler"))
    if traveler_role is None:
        traveler_role = Role(name="traveler", description="Create and manage personal travel plans and community activity.")
        db.add(traveler_role)
        db.flush()
    db.add(UserRole(user_id=profile.id, role_id=traveler_role.id))
    db.commit()
    return profile
