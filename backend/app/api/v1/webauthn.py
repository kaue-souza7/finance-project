from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.schemas.auth import TokenResponse, UserResponse
from app.schemas.webauthn import (
    WebAuthnLoginCompleteRequest,
    WebAuthnLoginCompleteResponse,
    WebAuthnLoginStartResponse,
    WebAuthnRegisterCompleteRequest,
    WebAuthnRegisterCompleteResponse,
    WebAuthnRegisterStartResponse,
)
from app.services.webauthn_service import WebAuthnService

router = APIRouter(prefix="/auth/webauthn", tags=["webauthn"])


@router.post("/register/start", response_model=WebAuthnRegisterStartResponse)
def register_start(
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = WebAuthnService(db)
    return service.generate_registration_options(current_user.id)


@router.post("/register/complete", response_model=WebAuthnRegisterCompleteResponse)
def register_complete(
    data: WebAuthnRegisterCompleteRequest,
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = WebAuthnService(db)
    return service.verify_registration(current_user.id, data.model_dump())


@router.post("/login/start", response_model=WebAuthnLoginStartResponse)
def login_start(
    db: Session = Depends(get_db),
):
    service = WebAuthnService(db)
    return service.generate_authentication_options()


@router.post("/login/complete", response_model=WebAuthnLoginCompleteResponse)
def login_complete(
    data: WebAuthnLoginCompleteRequest,
    db: Session = Depends(get_db),
):
    service = WebAuthnService(db)
    return service.verify_authentication(data.model_dump())


@router.get("/credentials")
def list_credentials(
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = WebAuthnService(db)
    return service.list_credentials(current_user.id)


@router.delete("/credentials/{credential_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_credential(
    credential_id: str,
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = WebAuthnService(db)
    deleted = service.delete_credential(current_user.id, credential_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Credential not found")
