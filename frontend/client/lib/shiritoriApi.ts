import Pusher from "pusher-js";
import { apiFetch, API_BASE_URL } from "./api";
import type { LeaderboardEntry } from "./gameApi";

export interface ShiritoriRoomSettings {
  script_mode: "HIRAGANA" | "KATAKANA";
  min_mora: number;
  max_mora: number;
  start_kana: string;
  turn_seconds: number;
  match_minutes: number;
  allow_long_vowel_chain: boolean;
}

export interface ShiritoriHistoryEntry {
  user_id: number;
  full_name: string;
  word: string;
  meaning: string;
  points: number;
  played_at: string;
}

export interface ShiritoriState {
  room_id: number;
  code: string;
  status: "WAITING" | "PLAYING" | "ENDED";
  host_id: number;
  started_at?: string | null;
  paused_at?: string | null;
  ended_at?: string | null;
  server_now: string;
  settings: ShiritoriRoomSettings;
  required_kana?: string | null;
  current_turn_user_id?: number | null;
  turn_started_at?: string | null;
  turn_seconds_left: number;
  match_seconds_left: number;
  used_words: string[];
  history: ShiritoriHistoryEntry[];
  leaderboard: LeaderboardEntry[];
  is_my_turn: boolean;
}

export type ShiritoriErrorCode =
  | "invalid_script"
  | "already_used"
  | "ends_with_n"
  | "wrong_start"
  | "wrong_length"
  | "not_in_bank"
  | "invalid";

const LEGACY_REASON_MAP: Record<string, ShiritoriErrorCode> = {
  "Chỉ được nhập Hiragana hoặc Katakana": "invalid_script",
  "Từ này đã được dùng rồi": "already_used",
  "Từ không được kết thúc bằng ん": "ends_with_n",
  "Từ không có trong ngân hàng": "not_in_bank",
};

export function translateShiritoriReason(
  t: (key: string, opts?: Record<string, unknown>) => string,
  reason?: string | null,
  params?: Record<string, unknown> | null,
): string {
  if (!reason) return t("shiritori.errors.invalid");
  const code = (LEGACY_REASON_MAP[reason] ?? reason) as ShiritoriErrorCode;
  const key = `shiritori.errors.${code}`;
  const translated = t(key, { ...(params ?? {}), defaultValue: "" });
  if (translated && translated !== key) return translated;
  return reason;
}

export interface ShiritoriSubmitResult {
  valid: boolean;
  reason?: string | null;
  reason_params?: Record<string, unknown> | null;
  word?: string | null;
  meaning?: string | null;
  points: number;
  new_score: number;
  next_kana?: string | null;
  next_turn_user_id?: number | null;
}

const base = (roomId: number) => `/api/v1/games/rooms/${roomId}`;

export const getShiritoriState = (roomId: number) =>
  apiFetch<ShiritoriState>(`${base(roomId)}/shiritori/state`);

export const submitShiritoriWord = (roomId: number, word: string) =>
  apiFetch<ShiritoriSubmitResult>(`${base(roomId)}/shiritori/submit`, {
    method: "POST",
    body: JSON.stringify({ word }),
  });

export const skipShiritoriTurn = (roomId: number) =>
  apiFetch(`${base(roomId)}/shiritori/skip`, { method: "POST" });

export interface ShiritoriRoomHandlers {
  onWord?: (d: {
    user_id: number;
    word: string;
    meaning: string;
    points: number;
    next_kana: string;
    leaderboard: LeaderboardEntry[];
  }) => void;
  onTurn?: (d: {
    current_turn_user_id: number;
    required_kana: string;
    turn_started_at: string;
  }) => void;
  onInvalid?: (d: { user_id: number; reason: string }) => void;
  onStarted?: (d: { room_id: number; started_at: string }) => void;
  onEnded?: (d: { room_id: number; leaderboard: LeaderboardEntry[] }) => void;
  onPlayerJoined?: (d: { user_id: number }) => void;
  onPlayerLeft?: (d: { user_id: number }) => void;
  onReady?: (d: { user_id: number; is_ready: boolean }) => void;
  onMessage?: (d: { message_id: number; sender_id: number; sender_name: string; content: string }) => void;
}

export async function subscribeShiritoriRoom(
  roomId: number,
  handlers: ShiritoriRoomHandlers
): Promise<() => void> {
  let config: { data: { key: string; cluster: string; auth_endpoint: string } };
  try {
    config = await apiFetch("/api/v1/pusher/config");
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
  bind("game:shiritori-word", handlers.onWord);
  bind("game:shiritori-turn", handlers.onTurn);
  bind("game:shiritori-invalid", handlers.onInvalid);
  bind("game:started", handlers.onStarted);
  bind("game:ended", handlers.onEnded);
  bind("game:player-joined", handlers.onPlayerJoined);
  bind("game:player-left", handlers.onPlayerLeft);
  bind("game:ready", handlers.onReady);
  bind("game:message", handlers.onMessage);
  return () => { pusher.unsubscribe(`private-game-room-${roomId}`); pusher.disconnect(); };
}

export const TURN_SECONDS_MIN = 5;
export const TURN_SECONDS_MAX = 300;
export const MATCH_MINUTES_MIN = 1;
export const MATCH_MINUTES_MAX = 120;

export const HIRAGANA_STARTERS = [
  "あ","い","う","え","お","か","き","く","け","こ",
  "さ","し","す","せ","そ","た","ち","つ","て","と",
  "な","に","ぬ","ね","の","は","ひ","ふ","へ","ほ",
  "ま","み","む","め","も","や","ゆ","よ",
  "ら","り","る","れ","ろ","わ","を",
] as const;