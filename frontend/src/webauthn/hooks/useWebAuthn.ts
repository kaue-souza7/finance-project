import { useCallback, useState } from "react";
import { api } from "@/services/api";
import { base64UrlToArrayBuffer, isPlatformAuthenticatorAvailable, isWebAuthnSupported } from "../utils/webauthn";
import type { WebAuthnCredentialInfo, WebAuthnRegisterOptions } from "../types/webauthn";

interface UseWebAuthnReturn {
  isAvailable: boolean;
  checking: boolean;
  checkAvailability: () => Promise<boolean>;
  register: () => Promise<string | null>;
  authenticate: () => Promise<string | null>;
  listCredentials: () => Promise<WebAuthnCredentialInfo[]>;
  removeCredential: (credentialId: string) => Promise<void>;
}

export function useWebAuthn(): UseWebAuthnReturn {
  const [isAvailable, setIsAvailable] = useState(false);
  const [checking, setChecking] = useState(false);

  const checkAvailability = useCallback(async () => {
    setChecking(true);
    try {
      const available = await isPlatformAuthenticatorAvailable();
      setIsAvailable(available);
      return available;
    } finally {
      setChecking(false);
    }
  }, []);

  const register = useCallback(async (): Promise<string | null> => {
    if (!isWebAuthnSupported()) {
      throw new Error("Biometria não suportada neste navegador");
    }

    const options = await api.post<WebAuthnRegisterOptions>(
      "/auth/webauthn/register/start",
    );

    const publicKey: PublicKeyCredentialCreationOptions = {
      challenge: base64UrlToArrayBuffer(options.challenge),
      rp: options.rp,
      user: {
        id: base64UrlToArrayBuffer(options.user.id),
        name: options.user.name,
        displayName: options.user.displayName,
      },
      pubKeyCredParams: options.pubKeyCredParams as PublicKeyCredentialParameters[],
      timeout: options.timeout,
      attestation: options.attestation as AttestationConveyancePreference,
    };

    const credential = (await navigator.credentials.create({
      publicKey,
    })) as PublicKeyCredential;

    const result = credential.toJSON() as Record<string, unknown>;
    const rawResult = {
      id: result.id as string,
      rawId: result.rawId as string,
      type: result.type as string,
      response: {
        clientDataJSON: (result.response as Record<string, unknown>).clientDataJSON as string,
        attestationObject: (result.response as Record<string, unknown>).attestationObject as string,
      },
    };

    const complete = await api.post<{ status: string; credentialId: string }>(
      "/auth/webauthn/register/complete",
      { ...rawResult, challenge: options.challenge },
    );

    if (complete.status === "ok") {
      localStorage.setItem("webauthn_device", "true");
      return complete.credentialId;
    }

    return null;
  }, []);

  const authenticate = useCallback(async (): Promise<string | null> => {
    if (!isWebAuthnSupported()) {
      throw new Error("Biometria não suportada neste navegador");
    }

    const options = await api.post<{ challenge: string; timeout: number; rpId: string }>(
      "/auth/webauthn/login/start",
    );

    const publicKey: PublicKeyCredentialRequestOptions = {
      challenge: base64UrlToArrayBuffer(options.challenge),
      timeout: options.timeout,
      rpId: options.rpId,
    };

    const assertion = (await navigator.credentials.get({
      publicKey,
    })) as PublicKeyCredential;

    const result = assertion.toJSON() as Record<string, unknown>;

    const rawResult = {
      id: result.id as string,
      rawId: result.rawId as string,
      type: result.type as string,
      response: {
        clientDataJSON: (result.response as Record<string, unknown>).clientDataJSON as string,
        authenticatorData: (result.response as Record<string, unknown>).authenticatorData as string,
        signature: (result.response as Record<string, unknown>).signature as string,
        userHandle: (result.response as Record<string, unknown>).userHandle as string | null,
      },
    };

    const authResult = await api.post<{ access_token: string }>(
      "/auth/webauthn/login/complete",
      { ...rawResult, challenge: options.challenge },
    );

    return authResult.access_token;
  }, []);

  const listCredentials = useCallback(async (): Promise<WebAuthnCredentialInfo[]> => {
    return api.get<WebAuthnCredentialInfo[]>("/auth/webauthn/credentials");
  }, []);

  const removeCredential = useCallback(async (credentialId: string): Promise<void> => {
    await api.delete(`/auth/webauthn/credentials/${credentialId}`);
  }, []);

  return {
    isAvailable,
    checking,
    checkAvailability,
    register,
    authenticate,
    listCredentials,
    removeCredential,
  };
}
