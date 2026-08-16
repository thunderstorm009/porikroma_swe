"""Small in-process limiter abstraction for expensive endpoints.

Deployments with multiple workers can replace this implementation with a
Redis-backed limiter without changing route contracts.
"""

from collections import defaultdict, deque
from threading import Lock
from time import monotonic

from fastapi import HTTPException, Request


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
