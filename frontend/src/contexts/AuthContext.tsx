import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { LoginRequest, RegisterRequest, TokenResponse, UserResponse } from "@/types/finance";

const BASE_API = import.meta.env.VITE_API_URL ?? "/api/v1";
const AUTH_URL = `${BASE_API}/auth`;

interface AuthContextValue {
  user: UserResponse | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function getToken(): string | null {
  return localStorage.getItem("access_token");
}

function setToken(token: string) {
  localStorage.setItem("access_token", token);
}

function clearToken() {
  localStorage.removeItem("access_token");
}

async function authFetch<T>(path: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const token = getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(`${AUTH_URL}${path}`, {
      method: body ? "POST" : "GET",
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(30_000),
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === "TimeoutError") {
      console.error("[authFetch] timeout", path);
      throw new Error("O servidor está demorando muito para responder. Tente novamente.");
    }
    console.error("[authFetch] rede", err);
    throw new Error("Erro de rede — backend offline ou inacessível");
  }

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
    } else if (res.status === 401) {
      message = "E-mail ou senha inválidos";
    } else if (res.status === 0) {
      message = "Erro de rede — backend offline";
    } else {
      message = `Falha na requisição (HTTP ${res.status})`;
    }
    if (!message) message = `Falha na requisição (HTTP ${res.status})`;
    throw new Error(message);
  }

  return (data ?? undefined) as T;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserResponse | null>(null);
  const [loading, setLoading] = useState(true);


  const validateSession = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const me = await authFetch<UserResponse>("/me");
      setUser(me);
    } catch {
      clearToken();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { validateSession(); }, [validateSession]);

  const login = useCallback(async (data: LoginRequest) => {
    const tokenRes = await authFetch<TokenResponse>("/login", data);
    setToken(tokenRes.access_token);
    const me = await authFetch<UserResponse>("/me");
    setUser(me);
  }, []);

  const register = useCallback(async (data: RegisterRequest) => {
    const tokenRes = await authFetch<TokenResponse>("/register", data);
    setToken(tokenRes.access_token);
    const me = await authFetch<UserResponse>("/me");
    setUser(me);
  }, []);

  const logout = useCallback(() => {
    clearToken();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        refreshUser: validateSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
