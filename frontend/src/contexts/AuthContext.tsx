import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api } from "@/services/api";
import {
  clearTokens,
  getRefreshToken,
  hasSession,
  setTokens,
} from "@/services/tokenStorage";
import type { LoginRequest, RegisterRequest, TokenResponse, UserResponse } from "@/types/finance";

interface AuthContextValue {
  user: UserResponse | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (data: LoginRequest) => Promise<void>;
  webauthnLogin: (tokens: TokenResponse) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const validateSession = useCallback(async () => {
    if (!hasSession()) {
      setLoading(false);
      return;
    }
    try {
      const me = await api.get<UserResponse>("/auth/me");
      setUser(me);
    } catch {
      clearTokens();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { validateSession(); }, [validateSession]);

  const login = useCallback(async (data: LoginRequest) => {
    const tokens = await api.post<TokenResponse>("/auth/login", data);
    setTokens(tokens.access_token, tokens.refresh_token);
    const me = await api.get<UserResponse>("/auth/me");
    setUser(me);
  }, []);

  const register = useCallback(async (data: RegisterRequest) => {
    const tokens = await api.post<TokenResponse>("/auth/register", data);
    setTokens(tokens.access_token, tokens.refresh_token);
    const me = await api.get<UserResponse>("/auth/me");
    setUser(me);
  }, []);

  const webauthnLogin = useCallback(async (tokens: TokenResponse) => {
    setTokens(tokens.access_token, tokens.refresh_token);
    try {
      const me = await api.get<UserResponse>("/auth/me");
      setUser(me);
    } catch {
      clearTokens();
      throw new Error("Erro ao validar sessão biométrica");
    }
  }, []);

  const logout = useCallback(async () => {
    const refreshToken = getRefreshToken();
    clearTokens();
    setUser(null);

    if (refreshToken) {
      try {
        await api.post<void>("/auth/logout", { refresh_token: refreshToken });
      } catch {
        // O logout local deve funcionar mesmo se o servidor estiver indisponível.
      }
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        login,
        webauthnLogin,
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
