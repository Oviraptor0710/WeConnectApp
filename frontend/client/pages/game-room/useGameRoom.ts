import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import * as clock from "@/lib/gameClock";
import {
  getGameState, startRoom, submitAnswer, revealAnswer, listGameMessages, sendGameMessage,
  toggleReady, pauseRoom, resumeRoom, endRoom, subscribeGameRoom, joinRoomByCode,
  type LeaderboardEntry, type QuestionOut,
} from "@/lib/gameApi";

interface UserOut { user_id: number; full_name: string; avatar_url: string | null; role: string; }

export interface ChatLine { id: number; name: string; text: string; type: "system" | "other" | "me"; }

const toMs = (ts?: string | null): number | null => {
  if (!ts) return null;
  const s = ts.endsWith("Z") || ts.includes("+") ? ts : ts + "Z";
  return new Date(s).getTime();
};

export function useGameRoom(roomCode: string) {
  const navigate = useNavigate();

  const { data: currentUser } = useQuery({ queryKey: ["me"], queryFn: () => apiFetch<UserOut>("/api/v1/users/me") });

  // resolve room_id from code (reuses existing endpoint), then poll state as a fallback
  const { data: roomMeta } = useQuery({
    queryKey: ["game-room-meta", roomCode],
    queryFn: () => apiFetch<{ room_id: number; host_id: number }>(`/api/v1/games/rooms/code/${roomCode}`),
    enabled: !!roomCode,
  });
  const roomId = roomMeta?.room_id;

  const { data: state, refetch: refetchState } = useQuery({
    queryKey: ["game-state", roomId],
    queryFn: () => getGameState(roomId!),
    enabled: !!roomId,
    refetchInterval: 4000, // fallback when Pusher is unavailable
  });

  // Join the room when landing on the page (invite link, shared code, refresh).
  // The backend endpoint is idempotent, so re-joining (e.g. the host) is a no-op.
  const joinedRef = useRef(false);
  useEffect(() => {
    if (!roomCode || joinedRef.current) return;
    joinedRef.current = true;
    joinRoomByCode(roomCode)
      .then(() => refetchState())
      .catch(() => { joinedRef.current = false; });
  }, [roomCode, refetchState]);

  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [messages, setMessages] = useState<ChatLine[]>([]);
  const [serverOffsetMs, setServerOffsetMs] = useState(0);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [selected, setSelected] = useState<number | null>(null);
  const [reveal, setReveal] = useState<number | null>(null);
  const answeredRef = useRef<Set<number>>(new Set());

  // adopt server snapshot
  useEffect(() => {
    if (!state) return;
    setLeaderboard(state.leaderboard);
    state.my_answers.forEach((i) => answeredRef.current.add(i));
    const srvNow = toMs(state.server_now);
    if (srvNow) setServerOffsetMs(srvNow - Date.now());
  }, [state]);

  // 1Hz tick
  useEffect(() => {
    const t = setInterval(() => setNowMs(Date.now()), 250);
    return () => clearInterval(t);
  }, []);

  // chat history
  useEffect(() => {
    if (!roomId) return;
    listGameMessages(roomId).then((rows) =>
      setMessages(rows.map((m) => ({
        id: m.message_id, name: m.sender_name, text: m.content,
        type: m.sender_id === currentUser?.user_id ? "me" : "other",
      })))
    ).catch(() => {});
  }, [roomId, currentUser?.user_id]);

  // realtime
  useEffect(() => {
    if (!roomId) return;
    let cleanup = () => {};
    subscribeGameRoom(roomId, {
      onScore: (d) => setLeaderboard(d.leaderboard),
      onEnded: (d) => { setLeaderboard(d.leaderboard); refetchState(); },
      onStarted: () => refetchState(),
      onPaused: () => refetchState(),
      onResumed: () => refetchState(),
      onReady: () => refetchState(),
      onPlayerJoined: () => refetchState(),
      onPlayerLeft: () => refetchState(),
      onMessage: (m) => setMessages((prev) =>
        prev.some((x) => x.id === m.message_id) ? prev :
        [...prev, { id: m.message_id, name: m.sender_name, text: m.content,
          type: m.sender_id === currentUser?.user_id ? "me" : "other" }]),
    }).then((fn) => { cleanup = fn; });
    return () => cleanup();
  }, [roomId, currentUser?.user_id, refetchState]);

  // derived clock
  const startedMs = toMs(state?.started_at);
  const pausedMs = toMs(state?.paused_at);
  const effectiveNow = nowMs + serverOffsetMs;
  const elapsed = startedMs ? clock.elapsedSeconds(startedMs, pausedMs, effectiveNow) : 0;
  const currentIndex = clock.questionIndex(elapsed);
  const windowOpen = state?.status === "PLAYING" && !pausedMs && clock.isAnswerWindowOpen(elapsed) && !clock.matchEnded(elapsed);
  const secondsLeft = clock.secondsLeftInWindow(elapsed);
  const matchLeft = clock.matchSecondsLeft(elapsed);

  const activeQuestion: QuestionOut | undefined = useMemo(
    () => state?.questions.find((q) => q.question_index === currentIndex),
    [state?.questions, currentIndex],
  );
  const alreadyAnswered = answeredRef.current.has(currentIndex);

  // reset selection on question change
  useEffect(() => { setSelected(null); setReveal(null); }, [currentIndex]);

  // fetch reveal when the window closes
  useEffect(() => {
    if (!roomId || state?.status !== "PLAYING") return;
    if (!windowOpen && reveal === null && activeQuestion) {
      revealAnswer(roomId, currentIndex).then((r) => setReveal(r.correct_index)).catch(() => {});
    }
  }, [roomId, windowOpen, reveal, activeQuestion, currentIndex, state?.status]);

  const isHost = !!currentUser && !!state && currentUser.user_id === state.host_id;

  const answer = useCallback(async (idx: number) => {
    if (!roomId || !windowOpen || alreadyAnswered) return;
    setSelected(idx);
    answeredRef.current.add(currentIndex);
    try {
      const res = await submitAnswer(roomId, currentIndex, idx);
      setReveal(res.correct_index);
    } catch {
      answeredRef.current.delete(currentIndex); // allow retry within window on transient error
    }
  }, [roomId, windowOpen, alreadyAnswered, currentIndex]);

  const send = useCallback(async (text: string) => {
    if (!roomId || !text.trim()) return;
    await sendGameMessage(roomId, text.trim());
  }, [roomId]);

  const start = useCallback(() => roomId && startRoom(roomId).then(() => refetchState()), [roomId, refetchState]);
  const ready = useCallback(() => roomId && toggleReady(roomId), [roomId]);
  const pause = useCallback(() => roomId && pauseRoom(roomId).then(() => refetchState()), [roomId, refetchState]);
  const resume = useCallback(() => roomId && resumeRoom(roomId).then(() => refetchState()), [roomId, refetchState]);
  const end = useCallback(() => roomId && endRoom(roomId).then(() => refetchState()), [roomId, refetchState]);
  const leave = useCallback(async () => {
    if (roomId) { try { await apiFetch(`/api/v1/games/rooms/${roomId}/leave`, { method: "POST" }); } catch { /* ignore */ } }
    navigate("/games");
  }, [roomId, navigate]);

  return {
    currentUser, state, roomId, isHost, leaderboard, messages,
    activeQuestion, currentIndex, selected, reveal, alreadyAnswered,
    windowOpen, secondsLeft, matchLeft, paused: !!pausedMs,
    gameStatus: state?.status ?? "WAITING",
    answer, send, start, ready, pause, resume, end, leave,
  };
}
