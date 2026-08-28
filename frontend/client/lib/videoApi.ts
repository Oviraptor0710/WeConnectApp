import { apiFetch } from "./api";

export type CallType = "AUDIO" | "VIDEO";
export type CallStatus =
  | "RINGING"
  | "ACCEPTED"
  | "REJECTED"
  | "CANCELLED"
  | "MISSED"
  | "ENDED";

export interface CallUser {
  user_id: number;
  full_name: string;
  avatar_url: string | null;
}

export interface CallDetails {
  call_id: number;
  caller: CallUser;
  receiver: CallUser;
  call_type: CallType;
  status: CallStatus;
  created_at: string;
  accepted_at: string | null;
  ended_at: string | null;
  expires_at: string;
}

export interface IncomingCallPayload {
  call_id: number;
  caller: CallUser;
  call_type: CallType;
  expires_at: string;
}

export interface CallConnection {
  call: CallDetails;
  partner: CallUser;
  server_url: string;
  participant_token: string;
}

type DataResponse<T> = { data: T };

export function createVideoCall(calleeId: number) {
  return apiFetch<DataResponse<CallDetails>>("/api/v1/calls", {
    method: "POST",
    body: JSON.stringify({ callee_id: calleeId, type: "VIDEO" }),
  });
}

export function getActiveIncomingCall() {
  return apiFetch<DataResponse<IncomingCallPayload | null>>("/api/v1/calls/incoming/active");
}

export function getCall(callId: number) {
  return apiFetch<DataResponse<CallDetails>>(`/api/v1/calls/${callId}`);
}

export function acceptCall(callId: number) {
  return transition(callId, "accept");
}

export function rejectCall(callId: number) {
  return transition(callId, "reject");
}

export function cancelCall(callId: number) {
  return transition(callId, "cancel");
}

export function timeoutCall(callId: number) {
  return transition(callId, "timeout");
}

export function endVideoCall(callId: number) {
  return transition(callId, "end");
}

export function joinVideoCall(callId: number) {
  return apiFetch<DataResponse<CallConnection>>(`/api/v1/calls/${callId}/join`, {
    method: "POST",
  });
}

function transition(callId: number, action: "accept" | "reject" | "cancel" | "timeout" | "end") {
  return apiFetch<DataResponse<CallDetails>>(`/api/v1/calls/${callId}/${action}`, {
    method: "POST",
  });
}
