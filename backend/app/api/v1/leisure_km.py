from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.schemas.auth import UserResponse
from app.schemas.leisure_km import LeisureKmCreate, LeisureKmResponse
from app.services.leisure_km_service import LeisureKmService

router = APIRouter(prefix="/leisure/{leisure_id}/km", tags=["leisure"])


@router.get("/", response_model=LeisureKmResponse | None)
def get_km(
    leisure_id: str,
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = LeisureKmService(db)
    return service.get_by_leisure(leisure_id, str(current_user.id))


@router.post("/", response_model=LeisureKmResponse, status_code=201)
def upsert_km(
    leisure_id: str,
    data: LeisureKmCreate,
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = LeisureKmService(db)
    return service.upsert(leisure_id, str(current_user.id), data)


@router.delete("/", status_code=204)
def delete_km(
    leisure_id: str,
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = LeisureKmService(db)
    service.delete(leisure_id, str(current_user.id))
