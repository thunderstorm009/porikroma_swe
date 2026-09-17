from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session, selectinload
from sqlalchemy import select
from app.db.database import get_db
from app.core.security import AuthenticatedUser, get_current_user, get_current_profile
from app.models import Expense, Profile
from app.schemas import ExpenseRead

router = APIRouter(prefix="/users/me", tags=["Users"])

@router.get("/expenses", summary="List all personal expenses")
def list_my_expenses(profile: Profile = Depends(get_current_profile), db: Session = Depends(get_db)):
    rows = db.scalars(select(Expense).options(selectinload(Expense.user)).where(Expense.user_id == profile.id).order_by(Expense.expense_date.desc(), Expense.created_at.desc())).all()
    return {"data": [ExpenseRead.model_validate(row) for row in rows]}
