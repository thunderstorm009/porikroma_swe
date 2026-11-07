"""Lock down the public schema against direct Supabase Data API access

Revision ID: 5b1f0c7d2e91
Revises: 4424dfbc302f
Create Date: 2026-11-07

Why: every table in ``public`` was granted SELECT/INSERT/UPDATE/DELETE/TRUNCATE to
the Supabase ``anon`` and ``authenticated`` roles, and row level security was
disabled on most tables. Because the publishable (anon) key is shipped in the
frontend bundle, anyone could read or modify those tables through PostgREST,
e.g. insert a ``platform_admin`` row into ``user_roles``.

The application never talks to tables through the Supabase Data API: the
frontend only uses Supabase Auth, and all data access goes through FastAPI,
which connects as the table owner (``postgres``, BYPASSRLS). So this migration:

1. enables RLS on every table in ``public`` (existing policies stay in place), and
2. revokes all table privileges from ``anon`` and ``authenticated`` and removes the
   default privileges that would re-grant them on future tables.

The backend is unaffected. Downgrade re-grants the previous privileges.

THIS MIGRATION HAS NOT BEEN APPLIED. Run ``alembic upgrade head`` only after review.
"""
from typing import Sequence, Union

from alembic import op


revision: str = "5b1f0c7d2e91"
down_revision: Union[str, Sequence[str], None] = "4424dfbc302f"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


_SUPABASE_ROLES_EXIST = """
    EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon')
    AND EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated')
"""


def upgrade() -> None:
    op.execute(
        """
        DO $$
        DECLARE t record;
        BEGIN
            FOR t IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
                EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t.tablename);
            END LOOP;
        END $$;
        """
    )
    op.execute(
        f"""
        DO $$
        BEGIN
            IF {_SUPABASE_ROLES_EXIST} THEN
                REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon, authenticated;
                REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated;
                ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon, authenticated;
                ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon, authenticated;
            END IF;
        END $$;
        """
    )


def downgrade() -> None:
    op.execute(
        f"""
        DO $$
        BEGIN
            IF {_SUPABASE_ROLES_EXIST} THEN
                GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
                GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
                ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated;
                ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated;
            END IF;
        END $$;
        """
    )
    # RLS is intentionally left enabled on downgrade: the tables that had it enabled
    # before this migration (trips, expenses, trip_messages, trip_join_*) must keep it.
