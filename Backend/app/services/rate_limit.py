from __future__ import annotations
"""Small in-process limiter abstraction for expensive endpoints.

Deployments with multiple workers can replace this implementation with a
Redis-backed limiter without changing route contracts.
"""

from collections import defaultdict, deque
from threading import Lock
from time import monotonic

from fastapi import Depends, HTTPException, Request

from app.core.security import AuthenticatedUser, get_current_user


class InMemoryRateLimiter:
    def __init__(self, limit: int, window_seconds: int):
        self.limit = limit
        self.window_seconds = window_seconds
        self.events = defaultdict(deque)
        self.lock = Lock()

    def allow(self, key: str) -> bool:
        now = monotonic()
        with self.lock:
            events = self.events[key]
            while events and now - events[0] > self.window_seconds:
                events.popleft()
            if len(events) >= self.limit:
                return False
            events.append(now)
            return True


ai_limiter = InMemoryRateLimiter(limit=30, window_seconds=60)


def check_ai_rate_limit(request: Request) -> None:
    key = request.client.host if request.client else "unknown"
    if not ai_limiter.allow(key):
        raise HTTPException(status_code=429, detail="AI request rate limit exceeded")


# Guards user-generated-content writes (forum posts, reservation requests, etc.)
# from being spammed by a single authenticated account.
content_write_limiter = InMemoryRateLimiter(limit=20, window_seconds=60)


def check_content_write_rate_limit(current_user: AuthenticatedUser = Depends(get_current_user)) -> None:
    if not content_write_limiter.allow(str(current_user.id)):
        raise HTTPException(status_code=429, detail="You're posting too quickly. Please slow down and try again shortly.")
