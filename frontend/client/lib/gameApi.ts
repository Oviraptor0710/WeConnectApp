import Pusher from "pusher-js";
import { apiFetch, API_BASE_URL } from "./api";

export interface QuestionOut {
  question_index: number;
  category: string;
  question: string;
  description?: string | null;
  options: string[];
  hint?: string | null;
  correct_index?: number | null;
}

export interface LeaderboardEntry {
  user_id: number;
  full_name: string;
  avatar_url?: string | null;
  score: number;
  is_ready: boolean;
}

export interface GameState {
  room_id: number;
  code: string;
  status: "WAITING" | "PLAYING" | "ENDED";
  host_id: number;
  started_at?: string | null;
  paused_at?: string | null;
  server_now: string;
  total_questions: number;
  cycle_seconds: number;
  answer_window_seconds: number;
  current_index: number;
  questions: QuestionOut[];
  my_answers: number[];
  leaderboard: LeaderboardEntry[];
}

export interface AnswerResult {
  is_correct: boolean;
  correct_index: number;
  points: number;
  new_score: number;
}

export interface GameMessageOut {
  message_id: number;
  room_id: number;
  sender_id: number;
  sender_name: string;
  content: string;
  created_at: string;
}

const base = (roomId: number) => `/api/v1/games/rooms/${roomId}`;

export const joinRoomByCode = (code: string) =>
  apiFetch(`/api/v1/games/rooms/join`, { method: "POST", body: JSON.stringify({ code }) });

export const getGameState = (roomId: number) => apiFetch<GameState>(`${base(roomId)}/state`);
export const startRoom = (roomId: number) => apiFetch(`${base(roomId)}/start`, { method: "POST" });
export const submitAnswer = (roomId: number, question_index: number, selected_index: number) =>
  apiFetch<AnswerResult>(`${base(roomId)}/answer`, { method: "POST", body: JSON.stringify({ question_index, selected_index }) });
export const revealAnswer = (roomId: number, idx: number) =>
  apiFetch<{ question_index: number; correct_index: number }>(`${base(roomId)}/questions/${idx}/answer`);
export const listGameMessages = (roomId: number) => apiFetch<GameMessageOut[]>(`${base(roomId)}/messages`);
export const sendGameMessage = (roomId: number, content: string) =>
  apiFetch<GameMessageOut>(`${base(roomId)}/messages`, { method: "POST", body: JSON.stringify({ content }) });
export const toggleReady = (roomId: number) => apiFetch<{ is_ready: boolean }>(`${base(roomId)}/ready`, { method: "POST" });
export const pauseRoom = (roomId: number) => apiFetch(`${base(roomId)}/pause`, { method: "POST" });
export const resumeRoom = (roomId: number) => apiFetch(`${base(roomId)}/resume`, { method: "POST" });
export const endRoom = (roomId: number) => apiFetch(`${base(roomId)}/end`, { method: "POST" });

export interface GameRoomHandlers {
  onScore?: (d: { user_id: number; question_index: number; leaderboard: LeaderboardEntry[] }) => void;
  onMessage?: (d: GameMessageOut) => void;
  onStarted?: (d: { room_id: number; started_at: string }) => void;
  onPaused?: (d: { paused_at: string }) => void;
  onResumed?: (d: { started_at: string }) => void;
  onEnded?: (d: { room_id: number; leaderboard: LeaderboardEntry[] }) => void;
  onPlayerJoined?: (d: { user_id: number }) => void;
  onPlayerLeft?: (d: { user_id: number }) => void;
  onReady?: (d: { user_id: number; is_ready: boolean }) => void;
}

export interface PusherConfig { key: string; cluster: string; auth_endpoint: string; }

// Returns an unsubscribe function, or a no-op if Pusher is not configured.
export async function subscribeGameRoom(roomId: number, handlers: GameRoomHandlers): Promise<() => void> {
  let config: { data: PusherConfig };
  try {
    config = await apiFetch<{ data: PusherConfig }>("/api/v1/pusher/config");
  } catch {
    return () => {};
  }
  const token = localStorage.getItem("access_token");
  const pusher = new Pusher(config.data.key, {
    cluster: config.data.cluster,
    authEndpoint: `${API_BASE_URL}${config.data.auth_endpoint}`,
    auth: { headers: { Authorization: `Bearer ${token}` } },
  });
  const channel = pusher.subscribe(`private-game-room-${roomId}`);
  const bind = <T>(evt: string, cb?: (d: T) => void) => { if (cb) channel.bind(evt, cb); };
  bind("game:score", handlers.onScore);
  bind("game:message", handlers.onMessage);
  bind("game:started", handlers.onStarted);
  bind("game:paused", handlers.onPaused);
  bind("game:resumed", handlers.onResumed);
  bind("game:ended", handlers.onEnded);
  bind("game:player-joined", handlers.onPlayerJoined);
  bind("game:player-left", handlers.onPlayerLeft);
  bind("game:ready", handlers.onReady);
  return () => { pusher.unsubscribe(`private-game-room-${roomId}`); pusher.disconnect(); };
}
