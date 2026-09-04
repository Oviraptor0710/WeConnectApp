export const API_BASE_URL = (import.meta.env.VITE_API_URL as string) || "";

let refreshPromise: Promise<boolean> | null = null;

async function tryRefreshSession(): Promise<boolean> {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/refresh`, {
        method: "POST",
        credentials: "include",
      });
      return response.ok;
    } catch {
      return false;
    }
  })();

  try {
    return await refreshPromise;
  } finally {
    refreshPromise = null;
  }
}

export async function apiFetch<T = unknown>(
  path: string,
  options: RequestInit = {},
  skipAuth = false,
  redirectOnUnauthorized = true
): Promise<T> {
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };
  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  // Đảm bảo trình duyệt luôn đính kèm HttpOnly Cookie vào request
  const fetchOptions: RequestInit = {
    ...options,
    headers,
    credentials: "include", // Cực kỳ quan trọng để gửi Cookie
  };

  console.log(`[apiFetch] Calling: ${API_BASE_URL}${path}`, { method: options.method || "GET" });
  let res = await fetch(`${API_BASE_URL}${path}`, fetchOptions);
  console.log(`[apiFetch] Response received for ${path}: ${res.status}`);

  if (res.status === 401 && !skipAuth) {
    const refreshed = await tryRefreshSession();
    if (refreshed) {
      res = await fetch(`${API_BASE_URL}${path}`, fetchOptions);
    }
    if (!refreshed || res.status === 401) {
      localStorage.removeItem("current_user");
      if (redirectOnUnauthorized && window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
      throw new Error("Phiên đăng nhập đã hết hạn");
    }
  }

  if (!res.ok) {
    const contentType = res.headers.get("Content-Type") || "";
    const errData = contentType.includes("application/json")
      ? await res.json().catch(() => ({}))
      : await res.text().catch(() => "");
    console.error(`[apiFetch] Error for ${path}:`, errData);

    // Chấp nhận cả error envelope hiện tại và payload detail kiểu cũ.
    let errMsg = `Lỗi hệ thống (${res.status})`;
    if (errData && errData.message) {
      errMsg = errData.message;
    } else if (errData && typeof errData.detail === "string") {
      errMsg = errData.detail;
    } else if (errData && Array.isArray(errData.detail)) {
      errMsg = errData.detail.map((item: { msg?: string }) => item.msg || "Dữ liệu không hợp lệ").join(", ");
    } else if (typeof errData === "string") {
      errMsg = errData;
    }

    throw new Error(errMsg);
  }

  if (res.status === 204) return null as T;

  // OTP-002: Kiểm tra Content-Type trước khi parse
  const contentType = res.headers.get("Content-Type") || "";
  const text = await res.text();
  if (!text) return null as T;

  if (contentType.includes("application/json")) {
    return JSON.parse(text) as T;
  }

  // Response dạng plain text (VD: "Đăng ký thành công!") → bọc vào object
  return { message: text } as T;
}
