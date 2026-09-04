import { io, Socket } from "socket.io-client";
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

// Game events use the same authenticated Socket.IO transport as chat.
export async function subscribeGameRoom(roomId: number, handlers: GameRoomHandlers): Promise<() => void> {
  const socket: Socket = io((API_BASE_URL || window.location.origin), {
    withCredentials: true,
    transports: ["websocket"],
  });
  const events: Array<[string, ((data: any) => void) | undefined]> = [
    ["game:score", handlers.onScore],
    ["game:message", handlers.onMessage],
    ["game:started", handlers.onStarted],
    ["game:paused", handlers.onPaused],
    ["game:resumed", handlers.onResumed],
    ["game:ended", handlers.onEnded],
    ["game:player-joined", handlers.onPlayerJoined],
    ["game:player-left", handlers.onPlayerLeft],
    ["game:ready", handlers.onReady],
  ];
  const listeners = events
    .filter(([, callback]) => callback)
    .map(([event, callback]) => [event, (data: any) => {
      if (Number(data?.room_id) === roomId) callback?.(data);
    }] as [string, (data: any) => void]);
  listeners.forEach(([event, callback]) => socket.on(event, callback));
  return () => {
    listeners.forEach(([event, callback]) => socket.off(event, callback));
    socket.disconnect();
  };
}
