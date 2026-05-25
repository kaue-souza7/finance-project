from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.schemas.auth import UserResponse
from app.schemas.expense import ExpenseCreate, ExpenseResponse, ExpenseUpdate
from app.services.expense_service import ExpenseService

router = APIRouter(prefix="/expenses", tags=["expenses"])


@router.get("/", response_model=list[ExpenseResponse])
def list_expenses(
    planning_id: str = Query(...),
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = ExpenseService(db)
    return service.list_by_planning(planning_id, str(current_user.id))


@router.post("/", response_model=ExpenseResponse, status_code=201)
def create_expense(
    data: ExpenseCreate,
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = ExpenseService(db)
    return service.create(data, str(current_user.id))


@router.put("/{expense_id}", response_model=ExpenseResponse)
def update_expense(
    expense_id: str,
    data: ExpenseUpdate,
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = ExpenseService(db)
    return service.update(expense_id, data, str(current_user.id))


@router.delete("/{expense_id}", status_code=204)
def delete_expense(
    expense_id: str,
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = ExpenseService(db)
    service.delete(expense_id, str(current_user.id))
