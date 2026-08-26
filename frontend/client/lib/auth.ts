export interface CurrentUser {
  user_id: number;
  full_name: string;
  email: string;
  role: string;
  avatar_url?: string | null;
}

export function saveTokens(user: CurrentUser): void {
  localStorage.setItem("current_user", JSON.stringify(user));
}

export function clearTokens(): void {
  localStorage.removeItem("current_user");
  // Lưu ý: Cookie HttpOnly sẽ bị xóa thông qua API /api/v1/auth/logout do Backend quản lý
}

export function getCurrentUser(): CurrentUser | null {
  const raw = localStorage.getItem("current_user");
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

export function isAuthenticated(): boolean {
  return !!getCurrentUser();
}
