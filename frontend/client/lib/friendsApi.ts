import { apiFetch } from "./api";

export interface UserSearchOut {
  user_id: number;
  full_name: string;
  avatar_url?: string;
  japanese_level?: string;
  location?: string;
  hobbies: string[];
  friendship_status: "FRIEND" | "REQUEST_SENT" | "REQUEST_RECEIVED" | "NONE";
}

export interface PaginationMeta {
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
}

export interface UserBriefOut {
  user_id: number;
  full_name: string;
  avatar_url?: string;
  japanese_level?: string;
  location?: string;
}

export interface FriendRequestWithUser {
  request_id: number;
  status: string;
  created_at: string;
  user: UserBriefOut;
}

export interface HobbyOut {
  hobby_id: number;
  name: string;
  category?: string;
}

export interface SearchParams {
  q?: string;
  gender?: string;
  min_age?: number;
  max_age?: number;
  japanese_level?: string;
  hobbies?: string;
  page?: number;
  page_size?: number;
}

export function searchUsers(params: SearchParams) {
  const qs = new URLSearchParams();
  if (params.q) qs.set("q", params.q);
  if (params.gender) qs.set("gender", params.gender);
  if (params.min_age != null) qs.set("min_age", String(params.min_age));
  if (params.max_age != null) qs.set("max_age", String(params.max_age));
  if (params.japanese_level) qs.set("japanese_level", params.japanese_level);
  if (params.hobbies) qs.set("hobbies", params.hobbies);
  qs.set("page", String(params.page ?? 1));
  qs.set("page_size", String(params.page_size ?? 12));
  return apiFetch<{ data: UserSearchOut[]; pagination: PaginationMeta }>(
    `/api/v1/users/search?${qs.toString()}`
  );
}

export function getFriendSuggestions() {
  return apiFetch<{ data: UserSearchOut[]; warning?: { message: string } }>(
    "/api/v1/users/suggestions"
  );
}

export function getReceivedRequests(page = 1, pageSize = 20) {
  return apiFetch<{ data: FriendRequestWithUser[]; pagination: PaginationMeta }>(
    `/api/v1/friend-requests/received?page=${page}&page_size=${pageSize}`
  );
}

export function getSentRequests(page = 1, pageSize = 20) {
  return apiFetch<{ data: FriendRequestWithUser[]; pagination: PaginationMeta }>(
    `/api/v1/friend-requests/sent?page=${page}&page_size=${pageSize}`
  );
}

export function sendFriendRequest(receiver_id: number) {
  return apiFetch<{ data: { request_id: number; status: string } }>(
    "/api/v1/friend-requests",
    { method: "POST", body: JSON.stringify({ receiver_id }) }
  );
}

export function cancelFriendRequest(request_id: number) {
  return apiFetch<null>(
    `/api/v1/friend-requests/${request_id}`,
    { method: "DELETE" }
  );
}

export function acceptFriendRequest(request_id: number) {
  return apiFetch<{ data: { status: string; friendship_id: number } }>(
    `/api/v1/friend-requests/${request_id}/accept`,
    { method: "POST" }
  );
}

export function rejectFriendRequest(request_id: number) {
  return apiFetch<{ data: { status: string } }>(
    `/api/v1/friend-requests/${request_id}/reject`,
    { method: "POST" }
  );
}

export function listFriends(q?: string, page = 1, pageSize = 20) {
  const qs = new URLSearchParams();
  if (q) qs.set("q", q);
  qs.set("page", String(page));
  qs.set("page_size", String(pageSize));
  return apiFetch<{ data: UserSearchOut[]; pagination: PaginationMeta }>(
    `/api/v1/friends?${qs.toString()}`
  );
}

export function unfriend(user_id: number) {
  return apiFetch<null>(`/api/v1/friends/${user_id}`, { method: "DELETE" });
}

export function getHobbies() {
  return apiFetch<HobbyOut[]>("/api/v1/hobbies");
}

export interface UserProfileOut {
  user_id: number;
  full_name: string;
  avatar_url?: string;
  cover_url?: string;
  bio?: string;
  location?: string;
  japanese_level?: string;
  role: string;
  hobbies: Array<{ hobby_id: number; name: string; category?: string }>;
  friendship_status: "FRIEND" | "REQUEST_SENT" | "REQUEST_RECEIVED" | "NONE";
}

export function getUserProfile(userId: number | string) {
  return apiFetch<{ data: UserProfileOut }>(`/api/v1/users/${userId}`);
}
