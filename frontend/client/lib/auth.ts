export interface CurrentUser {
  user_id: number;
  full_name: string;
  role: string;
  avatar_url?: string | null;
}

export function getAccessToken(): string | null {
  return localStorage.getItem("access_token");
}

export function saveTokens(accessToken: string, refreshToken: string, user: CurrentUser): void {
  localStorage.setItem("access_token", accessToken);
  localStorage.setItem("refresh_token", refreshToken);
  localStorage.setItem("current_user", JSON.stringify(user));
}

export function clearTokens(): void {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("current_user");
}

export function getCurrentUser(): CurrentUser | null {
  const raw = localStorage.getItem("current_user");
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

export function isAuthenticated(): boolean {
  return !!getAccessToken();
}
