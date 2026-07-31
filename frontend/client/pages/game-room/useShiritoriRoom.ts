import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import {
  getShiritoriState, submitShiritoriWord, skipShiritoriTurn,
  subscribeShiritoriRoom,
} from "@/lib/shiritoriApi";
import type { LeaderboardEntry } from "@/lib/gameApi";
import { listGameMessages, sendGameMessage, toggleReady, startRoom, endRoom, joinRoomByCode } from "@/lib/gameApi";

interface UserOut { user_id: number; full_name: string; avatar_url: string | null; role: string; }
export interface ChatLine { id: number; name: string; text: string; type: "system" | "other" | "me"; }

const toMs = (ts?: string | null): number | null => {
  if (!ts) return null;
  const s = ts.endsWith("Z") || ts.includes("+") ? ts : ts + "Z";
  return new Date(s).getTime();
};

export function useShiritoriRoom(roomCode: string) {
  const navigate = useNavigate();
  const { data: currentUser } = useQuery({ queryKey: ["me"], queryFn: () => apiFetch<UserOut>("/api/v1/users/me") });

  const { data: roomMeta } = useQuery({
    queryKey: ["game-room-meta", roomCode],
    queryFn: () => apiFetch<{ room_id: number; host_id: number }>(`/api/v1/games/rooms/code/${roomCode}`),
    enabled: !!roomCode,
  });
  const roomId = roomMeta?.room_id;

  const { data: state, refetch: refetchState } = useQuery({
    queryKey: ["shiritori-state", roomId],
    queryFn: () => getShiritoriState(roomId!),
    enabled: !!roomId,
    refetchInterval: 3000,
  });

  const joinedRef = useRef(false);
  useEffect(() => {
    if (!roomCode || joinedRef.current) return;
    joinedRef.current = true;
    joinRoomByCode(roomCode).then(() => refetchState()).catch(() => { joinedRef.current = false; });
  }, [roomCode, refetchState]);

  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [messages, setMessages] = useState<ChatLine[]>([]);
  const [serverOffsetMs, setServerOffsetMs] = useState(0);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [error, setError] = useState<{ reason?: string; params?: Record<string, unknown> } | null>(null);
  const skipSentRef = useRef(false);

  useEffect(() => {
    if (!state) return;
    setLeaderboard(state.leaderboard);
    const srvNow = toMs(state.server_now);
    if (srvNow) setServerOffsetMs(srvNow - Date.now());
  }, [state]);

  useEffect(() => {
    const t = setInterval(() => setNowMs(Date.now()), 250);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!roomId) return;
    listGameMessages(roomId).then((rows) =>
      setMessages(rows.map((m) => ({
        id: m.message_id, name: m.sender_name, text: m.content,
        type: m.sender_id === currentUser?.user_id ? "me" : "other",
      })))
    ).catch(() => {});
  }, [roomId, currentUser?.user_id]);

  useEffect(() => {
    if (!roomId) return;
    let cleanup = () => {};
    subscribeShiritoriRoom(roomId, {
      onWord: () => { skipSentRef.current = false; refetchState(); },
      onTurn: () => { skipSentRef.current = false; refetchState(); },
      onEnded: (d) => { setLeaderboard(d.leaderboard); refetchState(); },
      onStarted: () => refetchState(),
      onPlayerJoined: () => refetchState(),
      onPlayerLeft: () => refetchState(),
      onReady: () => refetchState(),
      onMessage: (m) => setMessages((prev) =>
        prev.some((x) => x.id === m.message_id) ? prev :
        [...prev, { id: m.message_id, name: m.sender_name, text: m.content,
          type: m.sender_id === currentUser?.user_id ? "me" : "other" }]),
    }).then((fn) => { cleanup = fn; });
    return () => cleanup();
  }, [roomId, currentUser?.user_id, refetchState]);

  const effectiveNow = nowMs + serverOffsetMs;
  const turnStartedMs = toMs(state?.turn_started_at);
  const matchStartedMs = toMs(state?.started_at);

  const turnSecondsLeft = (() => {
    if (!state || state.status !== "PLAYING" || !turnStartedMs) return state?.settings.turn_seconds ?? 30;
    const elapsed = Math.floor((effectiveNow - turnStartedMs) / 1000);
    return Math.max(0, state.settings.turn_seconds - elapsed);
  })();

  const matchSecondsLeft = (() => {
    if (!state || state.status !== "PLAYING" || !matchStartedMs) return (state?.settings.match_minutes ?? 10) * 60;
    const elapsed = Math.floor((effectiveNow - matchStartedMs) / 1000);
    return Math.max(0, state.settings.match_minutes * 60 - elapsed);
  })();

  // Auto-skip when turn timer hits 0
  useEffect(() => {
    if (!roomId || !state || state.status !== "PLAYING" || !state.is_my_turn) return;
    if (turnSecondsLeft > 0) { skipSentRef.current = false; return; }
    if (skipSentRef.current) return;
    skipSentRef.current = true;
    skipShiritoriTurn(roomId).then(() => refetchState()).catch(() => { skipSentRef.current = false; });
  }, [roomId, state, turnSecondsLeft, refetchState]);

  const isHost = !!currentUser && !!state && currentUser.user_id === state.host_id;

  const submit = useCallback(async (word: string) => {
    if (!roomId || !state?.is_my_turn) return;
    setError(null);
    try {
      const res = await submitShiritoriWord(roomId, word);
      if (!res.valid) setError({ reason: res.reason ?? "invalid", params: res.reason_params ?? undefined });
      else refetchState();
    } catch (e: unknown) {
      setError({ reason: "submit_failed", params: { detail: e instanceof Error ? e.message : "" } });
    }
  }, [roomId, state?.is_my_turn, refetchState]);

  const send = useCallback(async (text: string) => {
    if (!roomId || !text.trim()) return;
    await sendGameMessage(roomId, text.trim());
  }, [roomId]);

  const start = useCallback(() => roomId && startRoom(roomId).then(() => refetchState()), [roomId, refetchState]);
  const ready = useCallback(() => roomId && toggleReady(roomId), [roomId]);
  const end = useCallback(() => roomId && endRoom(roomId).then(() => refetchState()), [roomId, refetchState]);
  const leave = useCallback(async () => {
    if (roomId) { try { await apiFetch(`/api/v1/games/rooms/${roomId}/leave`, { method: "POST" }); } catch { /* ignore */ } }
    navigate("/games");
  }, [roomId, navigate]);

  return {
    currentUser, state, roomId, isHost, leaderboard, messages,
    turnSecondsLeft, matchSecondsLeft, error, setError,
    gameStatus: state?.status ?? "WAITING",
    submit, send, start, ready, end, leave,
  };
}