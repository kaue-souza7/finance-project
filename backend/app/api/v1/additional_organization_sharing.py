import uuid

from fastapi import (
    APIRouter,
    BackgroundTasks,
    Depends,
    Request,
    status,
)
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.core.rate_limit import limiter
from app.schemas.additional_organization_sharing import (
    AdditionalOrganizationInviteCreate,
    AdditionalOrganizationInvitePreviewResponse,
    AdditionalOrganizationInviteResolve,
    AdditionalOrganizationInviteResponse,
    AdditionalOrganizationParticipantResponse,
)
from app.schemas.auth import UserResponse
from app.services.additional_organization_sharing_service import (
    AdditionalOrganizationSharingService,
    build_additional_organization_invite_link,
    send_additional_organization_invite_email_task,
)

router = APIRouter(
    prefix="/additional-organizations",
    tags=["additional-organizations"],
)


@router.get(
    "/invites/received",
    response_model=list[AdditionalOrganizationInviteResponse],
)
def list_received_additional_organization_invites(
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = AdditionalOrganizationSharingService(db)
    return service.list_received_invites(
        current_user.id, current_user.email
    )


@router.post(
    "/invites/resolve",
    response_model=AdditionalOrganizationInvitePreviewResponse,
)
def resolve_additional_organization_invite(
    data: AdditionalOrganizationInviteResolve,
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = AdditionalOrganizationSharingService(db)
    return service.resolve_invite_token(
        data.token, current_user.id, current_user.email
    )


@router.post(
    "/invites/{invite_id}/accept",
    response_model=AdditionalOrganizationInviteResponse,
)
def accept_additional_organization_invite(
    invite_id: uuid.UUID,
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = AdditionalOrganizationSharingService(db)
    return service.accept_invite(
        invite_id, current_user.id, current_user.email
    )


@router.post(
    "/invites/{invite_id}/decline",
    response_model=AdditionalOrganizationInviteResponse,
)
def decline_additional_organization_invite(
    invite_id: uuid.UUID,
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = AdditionalOrganizationSharingService(db)
    return service.decline_invite(
        invite_id, current_user.id, current_user.email
    )


@router.get(
    "/{organization_id}/participants",
    response_model=list[AdditionalOrganizationParticipantResponse],
)
def list_additional_organization_participants(
    organization_id: uuid.UUID,
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = AdditionalOrganizationSharingService(db)
    return service.list_participants(organization_id, current_user.id)


@router.get(
    "/{organization_id}/invites",
    response_model=list[AdditionalOrganizationInviteResponse],
)
def list_additional_organization_invites(
    organization_id: uuid.UUID,
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = AdditionalOrganizationSharingService(db)
    return service.list_invites(organization_id, current_user.id)


@router.post(
    "/{organization_id}/invites",
    response_model=AdditionalOrganizationInviteResponse,
    status_code=201,
)
@limiter.limit("20/hour")
def send_additional_organization_invite(
    request: Request,
    organization_id: uuid.UUID,
    data: AdditionalOrganizationInviteCreate,
    background_tasks: BackgroundTasks,
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = AdditionalOrganizationSharingService(db)
    result = service.send_invite(
        organization_id, current_user.id, str(data.email)
    )
    if result.email_status == "queued":
        background_tasks.add_task(
            send_additional_organization_invite_email_task,
            result.response.id,
            result.invited_email,
            build_additional_organization_invite_link(result.raw_token),
            result.sender_name,
            result.organization_title,
            result.expires_at,
            result.token_hash,
        )
    return result.response


@router.post(
    "/{organization_id}/invites/{invite_id}/resend",
    response_model=AdditionalOrganizationInviteResponse,
)
@limiter.limit("20/hour")
def resend_additional_organization_invite(
    request: Request,
    organization_id: uuid.UUID,
    invite_id: uuid.UUID,
    background_tasks: BackgroundTasks,
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = AdditionalOrganizationSharingService(db)
    result = service.resend_invite(
        organization_id, invite_id, current_user.id
    )
    if result.email_status == "queued":
        background_tasks.add_task(
            send_additional_organization_invite_email_task,
            result.response.id,
            result.invited_email,
            build_additional_organization_invite_link(result.raw_token),
            result.sender_name,
            result.organization_title,
            result.expires_at,
            result.token_hash,
        )
    return result.response


@router.delete(
    "/{organization_id}/invites/{invite_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def cancel_additional_organization_invite(
    organization_id: uuid.UUID,
    invite_id: uuid.UUID,
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = AdditionalOrganizationSharingService(db)
    service.cancel_invite(organization_id, invite_id, current_user.id)


@router.delete(
    "/{organization_id}/participants/{member_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def remove_additional_organization_participant(
    organization_id: uuid.UUID,
    member_id: uuid.UUID,
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = AdditionalOrganizationSharingService(db)
    service.remove_participant(
        organization_id, member_id, current_user.id
    )
