import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.schemas.additional_organization import (
    AdditionalOrganizationContentUpdate,
    AdditionalOrganizationCreate,
    AdditionalOrganizationDetailResponse,
    AdditionalOrganizationItemCreate,
    AdditionalOrganizationItemResponse,
    AdditionalOrganizationItemUpdate,
    AdditionalOrganizationSummaryResponse,
    AdditionalOrganizationUpdate,
)
from app.schemas.auth import UserResponse
from app.services.additional_organization_service import (
    AdditionalOrganizationService,
)

router = APIRouter(
    prefix="/additional-organizations",
    tags=["additional-organizations"],
)


@router.get("/", response_model=list[AdditionalOrganizationSummaryResponse])
def list_additional_organizations(
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = AdditionalOrganizationService(db)
    return service.list_by_user(current_user.id)


@router.post(
    "/",
    response_model=AdditionalOrganizationSummaryResponse,
    status_code=201,
)
def create_additional_organization(
    data: AdditionalOrganizationCreate,
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = AdditionalOrganizationService(db)
    return service.create(current_user.id, data)


@router.get(
    "/shared",
    response_model=list[AdditionalOrganizationSummaryResponse],
)
def list_shared_additional_organizations(
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = AdditionalOrganizationService(db)
    return service.list_shared_by_user(current_user.id)


@router.get(
    "/{organization_id}",
    response_model=AdditionalOrganizationDetailResponse,
)
def get_additional_organization(
    organization_id: uuid.UUID,
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = AdditionalOrganizationService(db)
    return service.get_by_id(organization_id, current_user.id)


@router.put(
    "/{organization_id}",
    response_model=AdditionalOrganizationSummaryResponse,
)
def update_additional_organization(
    organization_id: uuid.UUID,
    data: AdditionalOrganizationUpdate,
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = AdditionalOrganizationService(db)
    return service.update(organization_id, current_user.id, data)


@router.delete("/{organization_id}", status_code=204)
def delete_additional_organization(
    organization_id: uuid.UUID,
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = AdditionalOrganizationService(db)
    service.delete(organization_id, current_user.id)


@router.put(
    "/{organization_id}/content",
    response_model=AdditionalOrganizationSummaryResponse,
)
def update_additional_organization_content(
    organization_id: uuid.UUID,
    data: AdditionalOrganizationContentUpdate,
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = AdditionalOrganizationService(db)
    return service.update_content(organization_id, current_user.id, data)


@router.post(
    "/{organization_id}/items",
    response_model=AdditionalOrganizationItemResponse,
    status_code=201,
)
def create_additional_organization_item(
    organization_id: uuid.UUID,
    data: AdditionalOrganizationItemCreate,
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = AdditionalOrganizationService(db)
    return service.create_item(organization_id, current_user.id, data)


@router.put(
    "/{organization_id}/items/{item_id}",
    response_model=AdditionalOrganizationItemResponse,
)
def update_additional_organization_item(
    organization_id: uuid.UUID,
    item_id: uuid.UUID,
    data: AdditionalOrganizationItemUpdate,
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = AdditionalOrganizationService(db)
    return service.update_item(
        organization_id, item_id, current_user.id, data
    )


@router.delete(
    "/{organization_id}/items/{item_id}", status_code=204
)
def delete_additional_organization_item(
    organization_id: uuid.UUID,
    item_id: uuid.UUID,
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = AdditionalOrganizationService(db)
    service.delete_item(organization_id, item_id, current_user.id)
