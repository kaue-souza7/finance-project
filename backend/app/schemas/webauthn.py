import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class WebAuthnRegisterStartResponse(BaseModel):
    challenge: str
    rp: dict
    user: dict
    pubKeyCredParams: list[dict]
    timeout: int
    attestation: str


class WebAuthnRegisterCompleteRequest(BaseModel):
    id: str
    rawId: str
    type: str
    response: dict
    challenge: str
    deviceName: str | None = Field(None, max_length=255)


class WebAuthnRegisterCompleteResponse(BaseModel):
    status: str
    credentialId: str


class WebAuthnLoginStartResponse(BaseModel):
    challenge: str
    timeout: int
    rpId: str


class WebAuthnLoginCompleteRequest(BaseModel):
    id: str
    rawId: str
    type: str
    response: dict
    challenge: str


class WebAuthnLoginCompleteResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    auth_method: str = "webauthn"


class WebAuthnCredentialResponse(BaseModel):
    id: str
    deviceName: str | None
    deviceType: str | None
    createdAt: datetime
    lastUsedAt: datetime | None

    model_config = {"from_attributes": True}
