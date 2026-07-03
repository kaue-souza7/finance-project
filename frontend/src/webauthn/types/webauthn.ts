export interface WebAuthnRegisterOptions {
  challenge: string;
  rp: { name: string; id: string };
  user: { id: string; name: string; displayName: string };
  pubKeyCredParams: { type: string; alg: number }[];
  timeout: number;
  attestation: string;
}

export interface WebAuthnLoginOptions {
  challenge: string;
  timeout: number;
  rpId: string;
  allowCredentials: { type: string; id: string }[] | null;
}

export interface WebAuthnCredentialInfo {
  id: string;
  deviceName: string | null;
  deviceType: string | null;
  createdAt: string;
  lastUsedAt: string | null;
}
