import { getErrorMessage } from "@/utils/error";
import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  setTokens,
} from "./tokenStorage";

const BASE_URL = import.meta.env.VITE_API_URL ?? "/api/v1";

type TokenResponse = {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
};

let refreshPromise: Promise<boolean> | null = null;

function redirectToLogin(): void {
  const returnTo = `${window.location.pathname}${window.location.search}`;
  const suffix =
    returnTo && returnTo !== "/login"
      ? `?returnTo=${encodeURIComponent(returnTo)}`
      : "";
  window.location.href = `/login${suffix}`;
}

async function refreshAccessToken(): Promise<boolean> {
  if (refreshPromise) return refreshPromise;

  const promise = (async () => {
    const refreshToken = getRefreshToken();
    if (!refreshToken) return false;

    try {
      const res = await fetch(`${BASE_URL}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: refreshToken }),
        signal: AbortSignal.timeout(30_000),
      });
      if (!res.ok) return false;

      const data = (await res.json()) as TokenResponse;
      setTokens(data.access_token, data.refresh_token);
      return true;
    } catch {
      return false;
    }
  })();

  refreshPromise = promise;
  void promise.finally(() => {
    if (refreshPromise === promise) {
      refreshPromise = null;
    }
  });

  return promise;
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  retryOnUnauthorized = true,
): Promise<T> {
  const isFormData = body instanceof FormData;
  const headers: Record<string, string> = {};
  if (!isFormData) {
    headers["Content-Type"] = "application/json";
  }

  const token = getAccessToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: isFormData ? body : body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(30_000),
    });
  } catch (err) {
    console.error("[api] network", method, path, err);
    throw new Error(getErrorMessage(err));
  }

  if (res.status === 401) {
    const isAuthEndpoint = path.startsWith("/auth/");
    if (!isAuthEndpoint && retryOnUnauthorized) {
      const refreshed = await refreshAccessToken();
      if (refreshed) {
        return request<T>(method, path, body, false);
      }
    }

    clearTokens();
    if (!isAuthEndpoint) {
      redirectToLogin();
    }
    throw new Error("Sessão expirada — faça login novamente");
  }

  if (res.status === 204) return undefined as T;

  if (res.status === 429) {
    throw new Error("Muitas tentativas. Aguarde alguns minutos e tente novamente.");
  }

  const text = await res.text();
  let data: Record<string, unknown> | null = null;
  if (text) {
    try { data = JSON.parse(text); } catch { data = null; }
  }

  if (!res.ok) {
    const detail = data?.detail;
    if (typeof detail === "string") {
      throw new Error(detail);
    }
    if (Array.isArray(detail)) {
      const joined = (detail as Array<Record<string, unknown>>)
        .map((e) => String(e.msg ?? ""))
        .filter(Boolean)
        .join("; ");
      if (joined) throw new Error(joined);
    }
    throw new Error(`HTTP ${res.status}`);
  }

  return data as T;
}

export const api = {
  get: <T>(path: string) => request<T>("GET", path),
  post: <T>(path: string, body?: unknown) => request<T>("POST", path, body),
  put: <T>(path: string, body?: unknown) => request<T>("PUT", path, body),
  patch: <T>(path: string, body?: unknown) => request<T>("PATCH", path, body),
  delete: <T = void>(path: string) => request<T>("DELETE", path),
};
