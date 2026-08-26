import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "@/lib/api";
import { saveTokens, clearTokens, getCurrentUser, CurrentUser } from "@/lib/auth";

interface AuthContextType {
  user: CurrentUser | null;
  isLoggedIn: boolean;
  isAuthLoading: boolean;
  login: (identifier: string, password: string, from?: string) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: CurrentUser | null) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(getCurrentUser);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const navigate = useNavigate();

  const mapUser = useCallback((res: { userId: number; email: string; fullName: string; role: string }): CurrentUser => ({
    user_id: res.userId,
    email: res.email,
    full_name: res.fullName,
    role: res.role,
  }), []);

  useEffect(() => {
    let active = true;
    apiFetch<{ userId: number; email: string; fullName: string; role: string }>(
      "/api/v1/auth/me",
      { method: "GET" },
      false,
      false
    )
      .then((res) => {
        if (!active) return;
        const restoredUser = mapUser(res);
        saveTokens(restoredUser);
        setUser(restoredUser);
      })
      .catch(() => {
        if (!active) return;
        clearTokens();
        setUser(null);
      })
      .finally(() => {
        if (active) setIsAuthLoading(false);
      });
    return () => { active = false; };
  }, [mapUser]);

  const login = useCallback(async (email: string, password: string, from?: string) => {
    console.log("[useAuth] Starting login for:", email);
    const res = await apiFetch<{ userId: number; email: string; fullName: string; role: string; message: string }>(
      "/api/v1/auth/login",
      { method: "POST", body: JSON.stringify({ email, password }) },
      true
    );
    console.log("[useAuth] Login response successful, saving user info...");
    const user = mapUser(res);
    saveTokens(user);
    setUser(user);
    console.log("[useAuth] User saved, navigating to:", from || "/");
    navigate(from || "/");
  }, [mapUser, navigate]);

  const logout = useCallback(async () => {
    try { await apiFetch("/api/v1/auth/logout", { method: "POST" }); } catch {}
    clearTokens();
    setUser(null);
    navigate("/login");
  }, [navigate]);

  return (
    <AuthContext.Provider value={{ user, isLoggedIn: !!user, isAuthLoading, login, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
