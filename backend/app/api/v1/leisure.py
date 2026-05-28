from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.schemas.auth import UserResponse
from app.schemas.leisure import LeisureCreate, LeisureResponse, LeisureUpdate
from app.services.leisure_service import LeisureService

router = APIRouter(prefix="/leisure", tags=["leisure"])


@router.get("/", response_model=list[LeisureResponse])
def list_events(
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = LeisureService(db)
    return service.get_all_by_user(str(current_user.id))


@router.post("/", response_model=LeisureResponse, status_code=201)
def create_event(
    data: LeisureCreate,
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = LeisureService(db)
    return service.create(str(current_user.id), data)


@router.get("/{event_id}", response_model=LeisureResponse)
def get_event(
    event_id: str,
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = LeisureService(db)
    return service.get_by_id(event_id, str(current_user.id))


@router.put("/{event_id}", response_model=LeisureResponse)
def update_event(
    event_id: str,
    data: LeisureUpdate,
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = LeisureService(db)
    return service.update(event_id, str(current_user.id), data)


@router.delete("/{event_id}", status_code=204)
def delete_event(
    event_id: str,
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = LeisureService(db)
    service.delete(event_id, str(current_user.id))
