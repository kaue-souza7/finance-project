from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.schemas.auth import UserResponse
from app.schemas.leisure_expense import (
    LeisureExpenseCreate,
    LeisureExpenseResponse,
    LeisureExpenseUpdate,
)
from app.services.leisure_expense_service import LeisureExpenseService

router = APIRouter(prefix="/leisure/{leisure_id}/expenses", tags=["leisure"])


@router.get("/", response_model=list[LeisureExpenseResponse])
def list_expenses(
    leisure_id: str,
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = LeisureExpenseService(db)
    return service.list_by_leisure(leisure_id, str(current_user.id))


@router.post("/", response_model=LeisureExpenseResponse, status_code=201)
def create_expense(
    leisure_id: str,
    data: LeisureExpenseCreate,
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = LeisureExpenseService(db)
    return service.create(leisure_id, str(current_user.id), data)


@router.put("/{expense_id}", response_model=LeisureExpenseResponse)
def update_expense(
    leisure_id: str,
    expense_id: str,
    data: LeisureExpenseUpdate,
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = LeisureExpenseService(db)
    return service.update(leisure_id, expense_id, str(current_user.id), data)


@router.delete("/{expense_id}", status_code=204)
def delete_expense(
    leisure_id: str,
    expense_id: str,
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = LeisureExpenseService(db)
    service.delete(leisure_id, expense_id, str(current_user.id))
