import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "@/lib/api";
import { saveTokens, clearTokens, getCurrentUser, isAuthenticated, CurrentUser } from "@/lib/auth";

interface AuthContextType {
  user: CurrentUser | null;
  isLoggedIn: boolean;
  login: (identifier: string, password: string, from?: string) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: CurrentUser | null) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(getCurrentUser);
  const navigate = useNavigate();

  const login = useCallback(async (identifier: string, password: string, from?: string) => {
    console.log("[useAuth] Starting login for:", identifier);
    const res = await apiFetch<{ data: { access_token: string; refresh_token: string; expires_in: number; user: CurrentUser } }>(
      "/api/v1/auth/login",
      { method: "POST", body: JSON.stringify({ identifier, password }) },
      true
    );
    console.log("[useAuth] Login response successful, saving tokens...");
    saveTokens(res.data.access_token, res.data.refresh_token, res.data.user);
    setUser(res.data.user);
    console.log("[useAuth] Tokens saved, navigating to:", from || "/");
    navigate(from || "/");
  }, [navigate]);

  const logout = useCallback(async () => {
    try { await apiFetch("/api/v1/auth/logout", { method: "POST" }); } catch {}
    clearTokens();
    setUser(null);
    navigate("/login");
  }, [navigate]);

  return (
    <AuthContext.Provider value={{ user, isLoggedIn: isAuthenticated(), login, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
