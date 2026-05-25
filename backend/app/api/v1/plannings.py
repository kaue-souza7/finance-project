from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.schemas.auth import UserResponse
from app.schemas.planning import (
    PlanningCreate,
    PlanningResponse,
    PlanningUpdate,
)
from app.services.planning_service import PlanningService

router = APIRouter(prefix="/plannings", tags=["plannings"])


@router.get("/", response_model=list[PlanningResponse])
def list_plannings(
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = PlanningService(db)
    return service.list_by_user(str(current_user.id))


@router.get("/month", response_model=PlanningResponse | None)
def get_planning_by_month(
    month: int = Query(..., ge=1, le=12),
    year: int = Query(..., ge=2020, le=2100),
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = PlanningService(db)
    return service.get_by_month(str(current_user.id), month, year)


@router.post("/", response_model=PlanningResponse, status_code=201)
def create_planning(
    data: PlanningCreate,
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = PlanningService(db)
    return service.create(str(current_user.id), data)


@router.put("/{planning_id}", response_model=PlanningResponse)
def update_planning(
    planning_id: str,
    data: PlanningUpdate,
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = PlanningService(db)
    return service.update(planning_id, str(current_user.id), data)


@router.post(
    "/copy-from/{target_month}/{target_year}",
    response_model=PlanningResponse,
    status_code=201,
)
def copy_from_previous(
    target_month: int,
    target_year: int,
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = PlanningService(db)
    return service.copy_from_previous(
        str(current_user.id), target_month, target_year
    )


@router.delete("/{planning_id}", status_code=204)
def delete_planning(
    planning_id: str,
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = PlanningService(db)
    service.delete(planning_id, str(current_user.id))
