import { getErrorMessage } from "@/utils/error";

const BASE_URL = import.meta.env.VITE_API_URL ?? "/api/v1";

function getToken(): string | null {
  return localStorage.getItem("access_token");
}

function clearToken() {
  localStorage.removeItem("access_token");
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  const token = getToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(30_000),
    });
  } catch (err) {
    console.error("[api] network", method, path, err);
    throw new Error(getErrorMessage(err));
  }

  if (res.status === 401) {
    clearToken();
    window.location.href = "/login";
    throw new Error("Sessão expirada — faça login novamente");
  }

  if (res.status === 204) return undefined as T;

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
