import { apiFetch } from "./api";

// Backend returns { token: string } directly — no `data` wrapper on this endpoint
interface VideoTokenResponse {
  token: string;
}

interface CallInviteResponse {
  sent: boolean;
}

interface CallRejectResponse {
  sent: boolean;
}

export interface IncomingCallPayload {
  room_name: string;
  caller_id: number;
  caller_name: string;
  caller_avatar: string | null;
}

/**
 * Fetch a LiveKit Access Token for the given room.
 * Calls backend POST /api/v1/video/token
 */
export async function fetchVideoToken(roomName: string): Promise<string> {
  const response = await apiFetch<VideoTokenResponse>("/api/v1/video/token", {
    method: "POST",
    body: JSON.stringify({ room_name: roomName }),
  });
  return response.token;
}

/**
 * Send an incoming-call Pusher notification to the callee.
 * Calls backend POST /api/v1/video/call/invite
 */
export async function sendCallInvite(params: {
  calleeId: number;
  roomName: string;
  callerName: string;
  callerAvatar?: string | null;
}): Promise<boolean> {
  const response = await apiFetch<CallInviteResponse>("/api/v1/video/call/invite", {
    method: "POST",
    body: JSON.stringify({
      callee_id: params.calleeId,
      room_name: params.roomName,
      caller_name: params.callerName,
      caller_avatar: params.callerAvatar ?? null,
    }),
  });
  return response.sent;
}

/**
 * Notify the caller that the call was rejected or timed out.
 * Calls backend POST /api/v1/video/call/reject
 */
export async function rejectCall(callerId: number, reason: "REJECTED" | "TIMEOUT" = "REJECTED"): Promise<boolean> {
  const response = await apiFetch<CallRejectResponse>("/api/v1/video/call/reject", {
    method: "POST",
    body: JSON.stringify({
      caller_id: callerId,
      reason: reason,
    }),
  });
  return response.sent;
}
