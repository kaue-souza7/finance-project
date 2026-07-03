import uuid
from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from webauthn import (
    generate_registration_options,
    generate_authentication_options,
    verify_registration_response,
    verify_authentication_response,
)
from webauthn.helpers.structs import (
    AuthenticatorSelectionCriteria,
    RegistrationCredential,
    AuthenticationCredential,
    ResidentKeyRequirement,
    UserVerificationRequirement,
)
from webauthn.helpers.exceptions import InvalidRegistrationResponse, InvalidAuthenticationResponse
from webauthn.helpers import base64url_to_bytes, bytes_to_base64url

from app.core.config import settings
from app.core.security import create_access_token
from app.repositories.user_repository import UserRepository
from app.repositories.webauthn_repository import (
    WebAuthnChallengeRepository,
    WebAuthnCredentialRepository,
)

MIN_CHALLENGE_LENGTH = 16


def _rp_id() -> str:
    from urllib.parse import urlparse
    origins = settings.cors_origins_list
    for origin in origins:
        parsed = urlparse(origin)
        host = parsed.hostname
        if host and host not in ("", "*"):
            return host
    return "localhost"


def _origin() -> str:
    origins = settings.cors_origins_list
    for origin in origins:
        if origin and origin != "*":
            return origin
    return "http://localhost:5173"


class WebAuthnService:
    def __init__(self, db: Session):
        self.db = db
        self.rp_id = _rp_id()
        self.origin = _origin()
        self.cred_repo = WebAuthnCredentialRepository()
        self.challenge_repo = WebAuthnChallengeRepository()
        self.user_repo = UserRepository()

    def generate_registration_options(self, user_id: uuid.UUID) -> dict:
        user = self.user_repo.get_by_id(self.db, user_id)
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

        existing_creds = self.cred_repo.get_by_user_id(self.db, user_id)
        exclude_creds = [
            base64url_to_bytes(c.credential_id) for c in existing_creds
        ]

        options = generate_registration_options(
            rp_id=self.rp_id,
            rp_name="Finance Project",
            user_id=str(user.id).encode("utf-8"),
            user_name=user.email,
            user_display_name=user.name,
            authenticator_selection=AuthenticatorSelectionCriteria(
                resident_key=ResidentKeyRequirement.REQUIRED,
                user_verification=UserVerificationRequirement.REQUIRED,
            ),
            exclude_credentials=exclude_creds if exclude_creds else None,
        )

        challenge_str = bytes_to_base64url(options.challenge)
        self.challenge_repo.save(
            db=self.db,
            challenge=challenge_str,
            purpose="register",
            user_id=user_id,
        )

        return {
            "challenge": challenge_str,
            "rp": {"name": options.rp.name, "id": options.rp.id},
            "user": {
                "id": options.user.id,
                "name": options.user.name,
                "displayName": options.user.display_name,
            },
            "pubKeyCredParams": [
                {"type": p.type, "alg": p.alg}
                for p in options.pub_key_cred_params or []
            ],
            "timeout": options.timeout or 120000,
            "attestation": options.attestation or "none",
        }

    def verify_registration(self, user_id: uuid.UUID, data: dict) -> dict:
        raw_challenge = data.get("challenge", "")
        if not raw_challenge or len(raw_challenge) < MIN_CHALLENGE_LENGTH:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid challenge")

        challenge_record = self.challenge_repo.get(self.db, raw_challenge)
        if not challenge_record:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Challenge not found or expired")
        if challenge_record.purpose != "register":
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid challenge purpose")

        expected_challenge = challenge_record.challenge

        self.challenge_repo.delete(self.db, expected_challenge)

        try:
            verification = verify_registration_response(
                credential={
                    "id": data["id"],
                    "rawId": data["rawId"],
                    "type": data["type"],
                    "response": {
                        "clientDataJSON": data["response"]["clientDataJSON"],
                        "attestationObject": data["response"]["attestationObject"],
                    },
                },
                expected_challenge=base64url_to_bytes(expected_challenge),
                expected_rp_id=self.rp_id,
                expected_origin=self.origin,
            )
        except InvalidRegistrationResponse as e:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

        credential = self.cred_repo.create(
            db=self.db,
            user_id=user_id,
            credential_id=bytes_to_base64url(verification.credential_id),
            public_key=bytes_to_base64url(verification.credential_public_key),
            sign_count=verification.sign_count,
            device_name=data.get("deviceName"),
            device_type="platform",
        )

        return {"status": "ok", "credentialId": credential.credential_id}

    def generate_authentication_options(self) -> dict:
        options = generate_authentication_options(
            rp_id=self.rp_id,
            user_verification=UserVerificationRequirement.REQUIRED,
        )

        challenge_str = bytes_to_base64url(options.challenge)
        self.challenge_repo.save(
            db=self.db,
            challenge=challenge_str,
            purpose="login",
        )

        return {
            "challenge": challenge_str,
            "timeout": options.timeout or 60000,
            "rpId": self.rp_id,
        }

    def verify_authentication(self, data: dict) -> dict:
        raw_challenge = data.get("challenge", "")
        if not raw_challenge or len(raw_challenge) < MIN_CHALLENGE_LENGTH:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid challenge")

        challenge_record = self.challenge_repo.get(self.db, raw_challenge)
        if not challenge_record:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Challenge not found or expired")
        if challenge_record.purpose != "login":
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid challenge purpose")

        expected_challenge = challenge_record.challenge

        self.challenge_repo.delete(self.db, expected_challenge)

        credential_record = self.cred_repo.get_by_credential_id(self.db, data["id"])
        if not credential_record:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Credential not found")

        try:
            verification = verify_authentication_response(
                credential={
                    "id": data["id"],
                    "rawId": data["rawId"],
                    "type": data["type"],
                    "response": {
                        "clientDataJSON": data["response"]["clientDataJSON"],
                        "authenticatorData": data["response"]["authenticatorData"],
                        "signature": data["response"]["signature"],
                        "userHandle": data["response"].get("userHandle"),
                    },
                },
                expected_challenge=base64url_to_bytes(expected_challenge),
                expected_rp_id=self.rp_id,
                expected_origin=self.origin,
                credential_public_key=base64url_to_bytes(credential_record.public_key),
                credential_current_sign_count=credential_record.sign_count,
            )
        except InvalidAuthenticationResponse as e:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

        self.cred_repo.update_sign_count(self.db, data["id"], verification.new_sign_count)

        if not credential_record.user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

        token = create_access_token(data={"sub": str(credential_record.user.id)})

        return {
            "access_token": token,
            "token_type": "bearer",
            "auth_method": "webauthn",
        }

    def list_credentials(self, user_id: uuid.UUID) -> list[dict]:
        creds = self.cred_repo.get_by_user_id(self.db, user_id)
        return [
            {
                "id": str(c.id),
                "deviceName": c.device_name,
                "deviceType": c.device_type,
                "createdAt": c.created_at.isoformat(),
                "lastUsedAt": c.last_used_at.isoformat() if c.last_used_at else None,
            }
            for c in creds
        ]

    def delete_credential(self, user_id: uuid.UUID, credential_id: str) -> bool:
        return self.cred_repo.delete(self.db, credential_id, user_id)
