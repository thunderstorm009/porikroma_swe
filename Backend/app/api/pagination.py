"""Shared pagination bounds."""

# OFFSET is (page - 1) * limit; an unbounded page overflows PostgreSQL's bigint (500).
MAX_PAGE = 100_000
