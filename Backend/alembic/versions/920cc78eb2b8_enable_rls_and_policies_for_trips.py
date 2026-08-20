"""Enable RLS and policies for trips

Revision ID: 920cc78eb2b8
Revises: b6c393521226
Create Date: 2026-08-20 22:25:22.269216
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = '920cc78eb2b8'
down_revision: Union[str, Sequence[str], None] = 'b6c393521226'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("ALTER TABLE trips ENABLE ROW LEVEL SECURITY")
    op.execute("DROP POLICY IF EXISTS select_trips_policy ON trips")
    op.execute("""
        CREATE POLICY select_trips_policy ON trips
        FOR SELECT TO authenticated
        USING (
            visibility = 'public' OR 
            owner_id = auth.uid() OR 
            EXISTS (
                SELECT 1 FROM trip_members 
                WHERE trip_members.trip_id = trips.id AND trip_members.user_id = auth.uid()
            )
        )
    """)

def downgrade() -> None:
    op.execute("DROP POLICY IF EXISTS select_trips_policy ON trips")
    op.execute("ALTER TABLE trips DISABLE ROW LEVEL SECURITY")
