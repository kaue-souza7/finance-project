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
    });
  } catch {
    throw new Error("Erro de rede — backend offline ou inacessível");
  }

  if (res.status === 401) {
    clearToken();
    window.location.href = "/login";
    throw new Error("Sessão expirada");
  }

  if (res.status === 204) return undefined as T;

  const text = await res.text();
  let data: Record<string, unknown> | null = null;
  if (text) {
    try { data = JSON.parse(text); } catch { data = null; }
  }

  if (!res.ok) {
    let message: string;
    if (data && data.detail != null) {
      if (typeof data.detail === "string") {
        message = data.detail;
      } else if (Array.isArray(data.detail)) {
        message = (data.detail as Array<Record<string, unknown>>)
          .map((e) => String(e.msg ?? ""))
          .filter(Boolean)
          .join("; ");
      } else {
        message = String(data.detail);
      }
    } else if (res.status >= 500) {
      message = "Erro interno do servidor";
    } else if (res.status === 0) {
      message = "Erro de rede — backend offline";
    } else {
      message = `Falha na requisição (HTTP ${res.status})`;
    }
    if (!message) message = `Falha na requisição (HTTP ${res.status})`;
    throw new Error(message);
  }

  return data as T;
}

export const api = {
  get: <T>(path: string) => request<T>("GET", path),
  post: <T>(path: string, body?: unknown) => request<T>("POST", path, body),
  put: <T>(path: string, body?: unknown) => request<T>("PUT", path, body),
  delete: <T = void>(path: string) => request<T>("DELETE", path),
};
