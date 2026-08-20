import os
import sqlalchemy as sa
from dotenv import load_dotenv

load_dotenv()
e = sa.create_engine(os.environ["DATABASE_URL"])
with e.connect() as conn:
    res = conn.execute(sa.text("SELECT relname, relrowsecurity FROM pg_class WHERE relrowsecurity = true")).fetchall()
    print(res)

