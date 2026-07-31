import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { apiFetch, API_BASE_URL } from "@/lib/api";

/** Resolve relative avatar paths (e.g. /uploads/...) to absolute URLs for cross-origin deployments. */
function resolveAvatarUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith("/")) return `${API_BASE_URL}${url}`;
  return url;
}
import { inviteFriendToGameRoom } from "@/lib/chatApi";
import { translateShiritoriReason } from "@/lib/shiritoriApi";
import { useShiritoriRoom } from "./useShiritoriRoom";

interface GameRoomOut {
  room_id: number;
  code: string;
  host_id: number;
  room_type: string;
  max_players: number;
  status: string;
  participants: Array<{ user_id: number; full_name: string; avatar_url: string | null }>;
  room_settings?: {
    script_mode: string;
    min_mora: number;
    max_mora: number;
    start_kana: string;
    turn_seconds: number;
    match_minutes: number;
  } | null;
}

interface Friend {
  id: string;
  name: string;
  status: "online" | "offline";
  avatarColor: string;
}

const WeConnectLogo = () => (
  <svg width="25" height="28" viewBox="0 0 30 28.75" fill="none">
    <path d="M7.5 28.75C6.45833 28.75 5.57292 28.3854 4.84375 27.6562C4.11458 26.9271 3.75 26.0417 3.75 25C3.75 23.9583 4.11458 23.0729 4.84375 22.3438C5.57292 21.6146 6.45833 21.25 7.5 21.25C7.79167 21.25 8.0625 21.2812 8.3125 21.3438C8.5625 21.4062 8.80208 21.4896 9.03125 21.5938L10.8125 19.375C10.2292 18.7292 9.82292 18 9.59375 17.1875C9.36458 16.375 9.3125 15.5625 9.4375 14.75L6.90625 13.9062C6.55208 14.4271 6.10417 14.8438 5.5625 15.1562C5.02083 15.4688 4.41667 15.625 3.75 15.625C2.70833 15.625 1.82292 15.2604 1.09375 14.5312C0.364583 13.8021 0 12.9167 0 11.875C0 10.8333 0.364583 9.94792 1.09375 9.21875C1.82292 8.48958 2.70833 8.125 3.75 8.125C4.79167 8.125 5.67708 8.48958 6.40625 9.21875C7.13542 9.94792 7.5 10.8333 7.5 11.875C7.5 11.9167 7.5 11.9583 7.5 12C7.5 12.0417 7.5 12.0833 7.5 12.125L10.0312 13C10.4479 12.25 11.0052 11.6146 11.7031 11.0938C12.401 10.5729 13.1875 10.2396 14.0625 10.0938V7.375C13.25 7.14583 12.5781 6.70312 12.0469 6.04688C11.5156 5.39062 11.25 4.625 11.25 3.75C11.25 2.70833 11.6146 1.82292 12.3438 1.09375C13.0729 0.364583 13.9583 0 15 0C16.0417 0 16.9271 0.364583 17.6562 1.09375C18.3854 1.82292 18.75 2.70833 18.75 3.75C18.75 4.625 18.4792 5.39062 17.9375 6.04688C17.3958 6.70312 16.7292 7.14583 15.9375 7.375V10.0938C16.8125 10.2396 17.599 10.5729 18.2969 11.0938C18.9948 11.6146 19.5521 12.25 19.9688 13L22.5 12.125C22.5 12.0833 22.5 12.0417 22.5 12C22.5 11.9583 22.5 11.9167 22.5 11.875C22.5 10.8333 22.8646 9.94792 23.5938 9.21875C24.3229 8.48958 25.2083 8.125 26.25 8.125C27.2917 8.125 28.1771 8.48958 28.9062 9.21875C29.6354 9.94792 30 10.8333 30 11.875C30 12.9167 29.6354 13.8021 28.9062 14.5312C28.1771 15.2604 27.2917 15.625 26.25 15.625C25.5833 15.625 24.974 15.4688 24.4219 15.1562C23.8698 14.8438 23.4271 14.4271 23.0938 13.9062L20.5625 14.75C20.6875 15.5625 20.6354 16.3698 20.4062 17.1719C20.1771 17.974 19.7708 18.7083 19.1875 19.375L20.9688 21.5625C21.1979 21.4583 21.4375 21.3802 21.6875 21.3281C21.9375 21.276 22.2083 21.25 22.5 21.25C23.5417 21.25 24.4271 21.6146 25.1562 22.3438C25.8854 23.0729 26.25 23.9583 26.25 25C26.25 26.0417 25.8854 26.9271 25.1562 27.6562C24.4271 28.3854 23.5417 28.75 22.5 28.75C21.4583 28.75 20.5729 28.3854 19.8438 27.6562C19.1146 26.9271 18.75 26.0417 18.75 25C18.75 24.5833 18.8177 24.1823 18.9531 23.7969C19.0885 23.4115 19.2708 23.0625 19.5 22.75L17.7188 20.5312C16.8646 21.0104 15.9531 21.25 14.9844 21.25C14.0156 21.25 13.1042 21.0104 12.25 20.5312L10.5 22.75C10.7292 23.0625 10.9115 23.4115 11.0469 23.7969C11.1823 24.1823 11.25 24.5833 11.25 25C11.25 26.0417 10.8854 26.9271 10.1562 27.6562C9.42708 28.3854 8.54167 28.75 7.5 28.75Z" fill="#22C55E" />
  </svg>
);

const GameControllerIcon = () => (
  <svg width="20" height="14" viewBox="0 0 20 14" fill="none">
    <path d="M2.535 14C1.685 14 1.02667 13.7042 0.56 13.1125C0.0933333 12.5208 -0.0816667 11.8 0.035 10.95L1.085 3.45C1.235 2.45 1.68083 1.625 2.4225 0.975C3.16417 0.325 4.035 0 5.035 0H14.935C15.935 0 16.8058 0.325 17.5475 0.975C18.2892 1.625 18.735 2.45 18.885 3.45L19.935 10.95C20.0517 11.8 19.8767 12.5208 19.41 13.1125C18.9433 13.7042 18.285 14 17.435 14C17.085 14 16.76 13.9375 16.46 13.8125C16.16 13.6875 15.885 13.5 15.635 13.25L13.385 11H6.585L4.335 13.25C4.085 13.5 3.81 13.6875 3.51 13.8125C3.21 13.9375 2.885 14 2.535 14ZM2.935 11.85L5.785 9H14.185L17.035 11.85C17.0683 11.8833 17.2017 11.9333 17.435 12C17.6183 12 17.7642 11.9458 17.8725 11.8375C17.9808 11.7292 18.0183 11.5833 17.985 11.4L16.885 3.7C16.8183 3.21667 16.6017 2.8125 16.235 2.4875C15.8683 2.1625 15.435 2 14.935 2H5.035C4.535 2 4.10167 2.1625 3.735 2.4875C3.36833 2.8125 3.15167 3.21667 3.085 3.7L1.985 11.4C1.95167 11.5833 1.98917 11.7292 2.0975 11.8375C2.20583 11.9458 2.35167 12 2.535 12C2.56833 12 2.70167 11.95 2.935 11.85ZM14.985 8C15.2683 8 15.5058 7.90417 15.6975 7.7125C15.8892 7.52083 15.985 7.28333 15.985 7C15.985 6.71667 15.8892 6.47917 15.6975 6.2875C15.5058 6.09583 15.2683 6 14.985 6C14.7017 6 14.4642 6.09583 14.2725 6.2875C14.0808 6.47917 13.985 6.71667 13.985 7C13.985 7.28333 14.0808 7.52083 14.2725 7.7125C14.4642 7.90417 14.7017 8 14.985 8ZM12.985 5C13.2683 5 13.5058 4.90417 13.6975 4.7125C13.8892 4.52083 13.985 4.28333 13.985 4C13.985 3.71667 13.8892 3.47917 13.6975 3.2875C13.5058 3.09583 13.2683 3 12.985 3C12.7017 3 12.4642 3.09583 12.2725 3.2875C12.0808 3.47917 11.985 3.71667 11.985 4C11.985 4.28333 12.0808 4.52083 12.2725 4.7125C12.4642 4.90417 12.7017 5 12.985 5ZM5.735 8H7.235V6.25H8.985V4.75H7.235V3H5.735V4.75H3.985V6.25H5.735V8Z" fill="#4A6741" />
  </svg>
);

const LeaveIcon = () => (
  <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
    <path d="M1.16667 10.5C0.845833 10.5 0.571181 10.3858 0.342708 10.1573C0.114236 9.92882 0 9.65417 0 9.33333V1.16667C0 0.845833 0.114236 0.571181 0.342708 0.342708C0.571181 0.114236 0.845833 0 1.16667 0H5.25V1.16667H1.16667V9.33333H5.25V10.5H1.16667ZM7.58333 8.16667L6.78125 7.32083L8.26875 5.83333H3.5V4.66667H8.26875L6.78125 3.17917L7.58333 2.33333L10.5 5.25L7.58333 8.16667Z" fill="#DC2626" />
  </svg>
);

const TimerIcon = () => (
  <svg width="8" height="10" viewBox="0 0 8 10" fill="none">
    <path d="M2 9H6V7.5C6 6.95 5.80417 6.47917 5.4125 6.0875C5.02083 5.69583 4.55 5.5 4 5.5C3.45 5.5 2.97917 5.69583 2.5875 6.0875C2.19583 6.47917 2 6.95 2 7.5V9ZM0 10V9H1V7.5C1 6.99167 1.11875 6.51458 1.35625 6.06875C1.59375 5.62292 1.925 5.26667 2.35 5C1.925 4.73333 1.59375 4.37708 1.35625 3.93125C1.11875 3.48542 1 3.00833 1 2.5V1H0V0H8V1H7V2.5C7 3.00833 6.88125 3.48542 6.64375 3.93125C6.40625 4.37708 6.075 4.73333 5.65 5C6.075 5.26667 6.40625 5.62292 6.64375 6.06875C6.88125 6.51458 7 6.99167 7 7.5V9H8V10H0Z" fill="white" />
  </svg>
);

const ChatIcon = () => (
  <svg width="17" height="17" viewBox="0 0 17 17" fill="none">
    <path d="M16.6667 16.6667L13.3333 13.3333H5C4.54167 13.3333 4.14931 13.1701 3.82292 12.8438C3.49653 12.5174 3.33333 12.125 3.33333 11.6667V10.8333H12.5C12.9583 10.8333 13.3507 10.6701 13.6771 10.3438C14.0035 10.0174 14.1667 9.625 14.1667 9.16667V3.33333H15C15.4583 3.33333 15.8507 3.49653 16.1771 3.82292C16.5035 4.14931 16.6667 4.54167 16.6667 5V16.6667ZM1.66667 8.47917L2.64583 7.5H10.8333V1.66667H1.66667V8.47917ZM0 12.5V1.66667C0 1.20833 0.163194 0.815972 0.489583 0.489583C0.815972 0.163194 1.20833 0 1.66667 0H10.8333C11.2917 0 11.684 0.163194 12.0104 0.489583C12.3368 0.815972 12.5 1.20833 12.5 1.66667V7.5C12.5 7.95833 12.3368 8.35069 12.0104 8.67708C11.684 9.00347 11.2917 9.16667 10.8333 9.16667H3.33333L0 12.5ZM1.66667 7.5V1.66667V7.5Z" fill="#6B7280" />
  </svg>
);

const SendIcon = () => (
  <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
    <path d="M0 9.33333V0L11.0833 4.66667L0 9.33333ZM1.16667 7.58333L8.07917 4.66667L1.16667 1.75V3.79167L4.66667 4.66667L1.16667 5.54167V7.58333ZM1.16667 7.58333V4.66667V1.75V3.79167V5.54167V7.58333Z" fill="white" />
  </svg>
);

const ShiritoriChainMark = () => {
  const kana = ["し", "り", "と", "り"];

  return (
    <div
      className="relative mb-6 flex h-28 w-28 items-center justify-center rounded-[32px] border border-teal-200/70 bg-teal-50 shadow-[0_18px_45px_rgba(13,148,136,0.16)]"
      aria-hidden="true"
    >
      <div className="absolute inset-2 rounded-[26px] border border-white/80" />
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 112 112" fill="none">
        <path d="M35 40C47 26 70 26 78 40C88 58 62 67 51 55C40 44 56 33 66 43" stroke="#0D9488" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" opacity="0.42" />
        <path d="M77 72C65 86 42 86 34 72C24 54 50 45 61 57C72 68 56 79 46 69" stroke="#4A6741" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" opacity="0.38" />
      </svg>
      <div className="relative grid grid-cols-2 gap-1.5">
        {kana.map((item, index) => (
          <span
            key={`${item}-${index}`}
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-2xl border bg-white text-xl font-black shadow-sm",
              index % 2 === 0 ? "border-teal-100 text-teal-700" : "border-green-100 text-[#4A6741]",
            )}
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
};

const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
};

export default function ShiritoriRoomView({ roomCode }: { roomCode: string }) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const s = useShiritoriRoom(roomCode);

  const [wordInput, setWordInput] = useState("");
  const [showResult, setShowResult] = useState(false);
  const [activeTab, setActiveTab] = useState<"game" | "scores" | "chat">("game");
  const [isChatCollapsed, setIsChatCollapsed] = useState(false);
  const [message, setMessage] = useState("");
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [invitedFriends, setInvitedFriends] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: roomData } = useQuery({
    queryKey: ["game-room", roomCode],
    queryFn: () => apiFetch<GameRoomOut>(`/api/v1/games/rooms/code/${roomCode}`),
    enabled: !!roomCode,
    refetchInterval: 3000,
  });

  const { data: friendsResponse } = useQuery({
    queryKey: ["my-friends"],
    queryFn: () => apiFetch<{ data: Array<{ user_id: number; full_name: string }> }>("/api/v1/friends?page_size=100"),
  });
  const friendsList: Friend[] = (friendsResponse?.data ?? []).map((f) => ({
    id: String(f.user_id),
    name: f.full_name,
    status: "online" as const,
    avatarColor: "bg-teal-100",
  }));

  useEffect(() => {
    if (s.gameStatus === "ENDED") setShowResult(true);
  }, [s.gameStatus]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [s.messages]);

  const settings = s.state?.settings ?? roomData?.room_settings;
  const turnLimit = settings?.turn_seconds ?? 30;
  const turnPct = Math.max(0, Math.min(100, (s.turnSecondsLeft / turnLimit) * 100));
  const currentPlayer = s.leaderboard.find((p) => p.user_id === s.state?.current_turn_user_id);
  const myEntry = s.leaderboard.find((p) => p.user_id === s.currentUser?.user_id);
  const readyMe = myEntry?.is_ready ?? false;
  const errorText = s.error
    ? translateShiritoriReason(t, s.error.reason, s.error.params)
    : null;

  const sortedPlayers = [...s.leaderboard]
    .map((entry) => ({
      id: String(entry.user_id),
      name: entry.full_name,
      isMe: entry.user_id === s.currentUser?.user_id,
      score: entry.score,
      avatarUrl: entry.avatar_url,
    }))
    .sort((a, b) => b.score - a.score);
  const maxScore = Math.max(...sortedPlayers.map((p) => p.score), 1);
  const settingTiles = settings
    ? [
        {
          label: t("shiritori.script"),
          value: settings.script_mode === "KATAKANA" ? t("shiritori.katakana") : t("shiritori.hiragana"),
        },
        {
          label: t("shiritori.startKana"),
          value: settings.start_kana === "RANDOM" ? t("shiritori.random") : settings.start_kana,
        },
        {
          label: t("shiritori.wordLength"),
          value: `${settings.min_mora}-${settings.max_mora} ${t("shiritori.mora")}`,
        },
        {
          label: t("shiritori.turnTime"),
          value: `${settings.turn_seconds}s / ${settings.match_minutes} ${t("shiritori.minutes")}`,
        },
      ]
    : [];

  const handleSubmit = async () => {
    if (!wordInput.trim()) return;
    await s.submit(wordInput.trim());
    setWordInput("");
  };

  const handleSend = () => {
    if (!message.trim()) return;
    s.send(message.trim());
    setMessage("");
  };

  const handleLeaveRoom = () => {
    if (window.confirm(t("gameRoom.confirmLeave"))) s.leave();
  };

  const handleInviteFriend = async (friend: Friend) => {
    if (invitedFriends.includes(friend.id)) return;
    setInvitedFriends((prev) => [...prev, friend.id]);
    try {
      await inviteFriendToGameRoom(Number(friend.id), roomCode);
    } catch {
      setInvitedFriends((prev) => prev.filter((id) => id !== friend.id));
    }
  };

  return (
    <div
      className="h-screen flex flex-col overflow-hidden select-none"
      style={{ background: "#F3F4F6", fontFamily: "Inter, -apple-system, Roboto, Helvetica, sans-serif" }}
    >
      <header className="flex-shrink-0 px-6 bg-white border-b border-[#E2E8E2] shadow-sm">
        <div className="flex h-14 items-center justify-between">
          <div className="flex items-center gap-4 min-w-0">
            <div className="flex items-center gap-2 cursor-pointer hover:opacity-80" onClick={() => navigate("/")}>
              <WeConnectLogo />
              <span className="text-lg font-extrabold text-[#2D3A3A]">WeConnect</span>
            </div>
            <div className="w-px h-6 bg-[#E2E8E2] hidden sm:block" />
            <div className="flex items-center gap-2 min-w-0">
              <GameControllerIcon />
              <span className="text-sm font-semibold text-[#2D3A3A] truncate">{t("shiritori.title")}</span>
              <span className="text-sm text-gray-500 font-medium">#{roomCode}</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div
              className={cn(
                "flex items-center gap-2 px-3 py-1 rounded-full border",
                s.gameStatus === "WAITING"
                  ? "bg-amber-50/50 border-amber-200/50 text-amber-600"
                  : "bg-[#F1F5F0] border-[#E2E8E2] text-[#4A6741]",
              )}
            >
              <div className={cn("w-2 h-2 rounded-full animate-pulse", s.gameStatus === "WAITING" ? "bg-amber-500" : "bg-green-500")} />
              <span className="text-[11px] font-bold tracking-wider uppercase">
                {s.gameStatus === "WAITING" ? t("gameRoom.waiting") : t("gameRoom.playing")}
              </span>
            </div>
            <button
              onClick={handleLeaveRoom}
              className="flex items-center gap-2 px-4 py-1.5 rounded-lg border border-red-100 bg-red-50 hover:bg-red-100 transition"
            >
              <LeaveIcon />
              <span className="text-xs font-bold text-red-600">{t("gameRoom.leaveRoom")}</span>
            </button>
          </div>
        </div>
      </header>

      <div className="md:hidden flex bg-white border-b border-[#E2E8E2] flex-shrink-0">
        {(["game", "scores", "chat"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "flex-1 py-3 text-xs font-bold text-center border-b-2 transition-colors",
              activeTab === tab
                ? "text-[#4A6741] border-[#4A6741] bg-[rgba(241,245,240,0.5)]"
                : "text-gray-500 border-transparent",
            )}
          >
            {tab === "game" ? "🎮" : tab === "scores" ? "🏆" : "💬"} {tab === "game" ? t("shiritori.title") : tab === "scores" ? t("gameRoom.scoreboard") : t("gameRoom.lobbyAndFeedback")}
          </button>
        ))}
      </div>

      <div className="flex flex-1 overflow-hidden flex-col md:flex-row">
        {/* Left sidebar */}
        <aside
          className={cn(
            "flex-shrink-0 w-full md:w-64 lg:w-80 flex flex-col overflow-hidden bg-white border-r border-[#E2E8E2]",
            activeTab === "chat" ? "flex" : "hidden md:flex",
          )}
        >
          <div className="flex flex-col items-start gap-3 p-6 bg-slate-50/50 border-b border-[#E2E8E2] flex-shrink-0">
            <span className="text-[10px] font-bold tracking-[2px] uppercase text-gray-500">{t("gameRoom.matchTime")}</span>
            <div className="flex flex-col items-center justify-center w-full rounded-2xl p-4 bg-[#2D3A3A] shadow-inner">
              <span className="text-[36px] font-black leading-10 tracking-[3.6px] text-white">
                {formatTime(s.matchSecondsLeft)}
              </span>
              <div className="flex items-center gap-1.5 mt-1 opacity-60">
                <TimerIcon />
                <span className="text-[10px] font-bold uppercase text-white tracking-wider">{t("gameRoom.total")}</span>
              </div>
            </div>
            {s.gameStatus === "PLAYING" && (
              <div className="w-full rounded-xl p-3 bg-teal-50 border border-teal-100">
                <p className="text-[10px] font-bold uppercase text-teal-700 mb-1">{t("shiritori.turnTime")}</p>
                <p className="text-2xl font-black text-teal-800">{formatTime(s.turnSecondsLeft)}</p>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-4 p-4 flex-grow overflow-y-auto">
            <span className="text-[10px] font-bold tracking-wider uppercase text-gray-500">
              {t("gameRoom.participants")} ({s.leaderboard.length}/{roomData?.max_players ?? 8})
            </span>
            <div className="flex flex-col gap-3">
              {s.leaderboard.map((entry) => {
                const isMe = entry.user_id === s.currentUser?.user_id;
                const isHost = entry.user_id === roomData?.host_id;
                const isTurn = entry.user_id === s.state?.current_turn_user_id && s.gameStatus === "PLAYING";
                return (
                  <div
                    key={entry.user_id}
                    className={cn(
                      "flex items-center gap-4 p-4 rounded-2xl border relative",
                      isMe ? "border-green-200/50 bg-[#F1F5F0]" : "border-[#E2E8E2] bg-slate-50",
                      isTurn && "ring-2 ring-teal-400/60",
                    )}
                  >
                    <div className="relative flex-shrink-0">
                      {entry.avatar_url ? (
                        <img src={resolveAvatarUrl(entry.avatar_url)!} alt={entry.full_name} className="w-12 h-12 rounded-2xl object-cover" />
                      ) : (
                        <div className="w-12 h-12 rounded-2xl bg-teal-100 flex items-center justify-center font-bold text-teal-800">
                          {entry.full_name.substring(0, 2)}
                        </div>
                      )}
                      {isHost && <div className="absolute -top-1.5 -left-1.5 text-[10px]">👑</div>}
                      <div className={cn("absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-white", entry.is_ready ? "bg-green-500" : "bg-blue-500")} />
                    </div>
                    <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                      <span className="text-sm font-bold text-[#2D3A3A] truncate">
                        {isMe ? `${t("gameRoom.you")} (${entry.full_name})` : entry.full_name}
                      </span>
                      <span className={cn("text-[10px] font-semibold uppercase", entry.is_ready ? "text-[#4A6741]" : "text-blue-500")}>
                        {entry.is_ready ? t("gameRoom.statusReady") : t("gameRoom.statusWaiting")}
                      </span>
                    </div>
                    <span className="text-sm font-black text-[#4A6741]">{entry.score}</span>
                  </div>
                );
              })}
              <button
                onClick={() => setShowInviteModal(true)}
                className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl border-2 border-dashed border-[#E2E8E2] text-gray-500 hover:text-[#4A6741] hover:border-[#4A6741] hover:bg-[#F1F5F0] transition"
              >
                <span className="text-xs font-bold">{t("gameRoom.inviteFriends")}</span>
              </button>
            </div>
          </div>

          <div className="flex gap-2 p-4 border-t border-[#E2E8E2] bg-white flex-shrink-0">
            {s.isHost && s.gameStatus === "PLAYING" && (
              <button onClick={s.end} className="flex-1 py-2 rounded-lg text-xs font-bold border border-red-200 bg-red-50 text-red-600 hover:bg-red-100">
                {t("gameRoom.endEarly")}
              </button>
            )}
            <button
              onClick={s.ready}
              className="flex-1 py-2 rounded-lg text-xs font-bold text-white"
              style={{ background: readyMe ? "#3B82F6" : "#4A6741" }}
            >
              {readyMe ? t("gameRoom.waitingMatch") : t("gameRoom.ready")}
            </button>
          </div>
        </aside>

        {/* Center game + chat */}
        <div className={cn("flex-1 flex flex-col overflow-hidden min-w-0 bg-[#F1F5F9] border-r border-[#E2E8E2]", activeTab !== "scores" ? "flex" : "hidden md:flex")}>
          <div className={cn("flex-grow flex items-center justify-center p-4 md:p-6 overflow-y-auto", activeTab === "game" ? "flex" : "hidden md:flex")}>
            {s.gameStatus === "WAITING" ? (
              <div className="relative w-full max-w-[640px] overflow-hidden rounded-[32px] border border-[#DDE8E4] bg-white p-8 text-center shadow-[0_24px_70px_rgba(45,58,58,0.08)] flex min-h-[430px] flex-col items-center justify-center">
                <div className="absolute left-8 top-8 h-16 w-16 rounded-full border border-teal-100/70 bg-teal-50/60" />
                <div className="absolute bottom-10 right-10 h-20 w-20 rounded-full border border-green-100/80 bg-[#F1F5F0]" />
                <ShiritoriChainMark />
                <h2 className="text-2xl font-black text-[#2D3A3A] mb-3">{t("shiritori.title")}</h2>
                <p className="max-w-md text-sm leading-6 text-gray-500 mb-7">{s.isHost ? t("gameRoom.hostWaitingMsg") : t("gameRoom.guestWaitingMsg")}</p>
                {settings && (
                  <div className="relative mb-7 grid w-full max-w-[460px] grid-cols-1 gap-3 rounded-3xl border border-[#DDE8E4] bg-[#F8FAF9] p-3 text-left sm:grid-cols-2">
                    {settingTiles.map((item) => (
                      <div key={item.label} className="rounded-2xl border border-white bg-white px-4 py-3 shadow-sm">
                        <p className="mb-1 text-[10px] font-black uppercase tracking-[1.4px] text-teal-700/70">{item.label}</p>
                        <p className="truncate text-sm font-extrabold text-[#2D3A3A]">{item.value}</p>
                      </div>
                    ))}
                  </div>
                )}
                {s.isHost ? (
                  <button onClick={s.start} className="relative rounded-2xl bg-[#4A6741] px-9 py-3.5 text-sm font-extrabold uppercase tracking-wider text-white shadow-lg shadow-green-100 transition hover:bg-[#3c5435]">
                    {t("gameRoom.startMatch")}
                  </button>
                ) : (
                  <div className="relative flex items-center gap-2.5 rounded-2xl border border-green-100 bg-[#F1F5F0] px-5 py-3">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-ping" />
                    <span className="text-xs font-bold text-[#4A6741]">{t("gameRoom.waitingHost")}</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="relative w-full max-w-[640px] bg-white border border-[#E2E8E2] rounded-3xl p-6 shadow-sm flex flex-col">
                <div className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-teal-600 text-white shadow-sm self-center mb-4">
                  <span className="text-xs font-extrabold tracking-wide uppercase">{t("shiritori.chainTitle")}</span>
                </div>

                <div className="text-center mb-5">
                  <p className="text-xs font-bold uppercase text-gray-500 mb-2">{t("shiritori.nextKana")}</p>
                  <div className="inline-flex items-center justify-center w-28 h-28 rounded-3xl bg-[#F1F5F0] border-2 border-[#4A6741]/20 mb-3">
                    <span className="text-6xl font-black text-[#4A6741]">{s.state?.required_kana}</span>
                  </div>
                  <p className="text-sm font-semibold text-gray-600">
                    {s.state?.is_my_turn
                      ? t("shiritori.yourTurn")
                      : t("shiritori.waitingTurn", { name: currentPlayer?.full_name ?? "..." })}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {t("shiritori.wordsPlayed", { count: s.state?.used_words?.length ?? 0 })}
                  </p>
                </div>

                {s.gameStatus === "PLAYING" && (
                  <div className="w-full mb-5">
                    <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${turnPct}%`,
                          background: s.turnSecondsLeft <= 5 ? "#EF4444" : "#0D9488",
                        }}
                      />
                    </div>
                    <p className="text-center text-xs text-gray-500 mt-2">
                      {t("shiritori.turnTime")}: <strong className={s.turnSecondsLeft <= 5 ? "text-red-500" : "text-teal-600"}>{formatTime(s.turnSecondsLeft)}</strong>
                    </p>
                  </div>
                )}

                {errorText && (
                  <div className="mb-4 px-4 py-3 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm font-semibold text-center">
                    {errorText}
                  </div>
                )}

                {s.state?.is_my_turn && (
                  <div className="flex gap-2 mb-5">
                    <input
                      type="text"
                      value={wordInput}
                      onChange={(e) => { setWordInput(e.target.value); s.setError(null); }}
                      onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                      placeholder={settings?.script_mode === "KATAKANA" ? t("shiritori.inputPlaceholderKata") : t("shiritori.inputPlaceholderHira")}
                      className="flex-1 px-4 py-3.5 rounded-2xl border border-[#E2E8E2] text-lg focus:ring-2 focus:ring-[#4A6741]/30 outline-none bg-[#F8FAFC]"
                      autoFocus
                    />
                    <button onClick={handleSubmit} className="px-6 py-3.5 bg-[#4A6741] text-white font-bold rounded-2xl hover:bg-[#3c5435] transition">
                      {t("shiritori.submit")}
                    </button>
                  </div>
                )}

                <div className="border-t border-[#E2E8E2] pt-4 max-h-52 overflow-y-auto">
                  <p className="text-xs font-bold uppercase text-gray-500 mb-3">{t("shiritori.history")}</p>
                  <div className="space-y-2">
                    {[...(s.state?.history ?? [])].reverse().map((h, i) => (
                      <div key={i} className="flex justify-between items-center text-sm bg-slate-50 rounded-xl px-4 py-2.5 border border-[#E2E8E2]">
                        <div className="min-w-0">
                          <span className="font-bold text-[#2D3A3A]">{h.word}</span>
                          <span className="text-gray-500 ml-2">({h.meaning})</span>
                          <span className="text-gray-400 ml-2 text-xs">— {h.full_name}</span>
                        </div>
                        <span className="font-bold text-[#4A6741] shrink-0 ml-2">+{h.points}</span>
                      </div>
                    ))}
                    {(s.state?.history?.length ?? 0) === 0 && (
                      <p className="text-gray-400 text-sm text-center py-4">{t("shiritori.noWordsYet")}</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Chat panel */}
          <div className={cn("flex-shrink-0 flex flex-col bg-white border-t border-[#E2E8E2] w-full transition-all", isChatCollapsed ? "h-11 overflow-hidden" : "h-56 md:h-64")}>
            <div className="flex items-center justify-between px-6 py-2.5 bg-slate-50/80 border-b border-[#E2E8E2]">
              <div className="flex items-center gap-2">
                <ChatIcon />
                <span className="text-[11px] font-black tracking-wider uppercase text-[#2D3A3A]">{t("gameRoom.lobbyAndFeedback")}</span>
              </div>
              <button onClick={() => setIsChatCollapsed(!isChatCollapsed)} className="text-gray-400 hover:text-gray-600 p-1">
                {isChatCollapsed ? "▲" : "▼"}
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-3">
              {s.messages.map((msg) => (
                <div key={msg.id} className={cn("flex gap-2", msg.type === "me" && "justify-end")}>
                  <div className={cn("max-w-[80%] px-3 py-2 rounded-2xl text-xs", msg.type === "me" ? "bg-[#4A6741] text-white" : "bg-[#F1F5F9] border border-[#E2E8E2] text-[#2D3A3A]")}>
                    {msg.type !== "me" && <span className="font-bold block mb-0.5">{msg.name}</span>}
                    {msg.text}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            <div className="flex items-center gap-3 px-4 py-3 border-t border-[#E2E8E2] bg-white">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder={t("gameRoom.typeMessage")}
                className="flex-1 px-4 py-2 rounded-2xl border border-[#E2E8E2] bg-[#F8FAFC] text-sm outline-none"
              />
              <button onClick={handleSend} className="flex items-center gap-1.5 px-5 py-2 rounded-2xl text-white font-bold bg-[#4A6741] hover:bg-[#3c5435]">
                <span className="text-xs">{t("gameRoom.send")}</span>
                <SendIcon />
              </button>
            </div>
          </div>
        </div>

        {/* Right scoreboard */}
        <aside className={cn("flex-shrink-0 w-full md:w-64 lg:w-80 flex flex-col bg-white border-l border-[#E2E8E2] overflow-y-auto p-4 gap-4", activeTab === "scores" ? "flex" : "hidden md:flex")}>
          <div className="flex items-center gap-1.5 px-3 py-1 bg-teal-50 text-teal-700 border border-teal-200/50 rounded-full self-start">
            <span className="text-[10px] font-black tracking-wider uppercase">{t("gameRoom.competing")}</span>
          </div>
          <h3 className="text-sm font-black tracking-widest text-[#2D3A3A] uppercase border-b border-[#E2E8E2] pb-2">{t("gameRoom.scoreboard")}</h3>
          <div className="flex flex-col gap-3">
            {sortedPlayers.map((player, idx) => {
              const barPercent = Math.max(15, Math.min(100, (player.score / maxScore) * 100));
              const badgeBg = idx === 0 ? "bg-yellow-100 text-yellow-600" : idx === 1 ? "bg-slate-100 text-slate-500" : idx === 2 ? "bg-orange-100 text-orange-600" : "bg-gray-100 text-gray-500";
              const fillBg = idx === 0 ? "bg-yellow-500" : idx === 1 ? "bg-slate-500" : idx === 2 ? "bg-orange-500" : "bg-gray-400";
              return (
                <div key={player.id} className={cn("flex items-center gap-3 p-3 rounded-2xl border", player.isMe ? "border-green-200 bg-[#F1F5F0]" : "border-gray-100")}>
                  <div className={cn("w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold", badgeBg)}>{idx + 1}</div>
                  {player.avatarUrl ? (
                    <img src={resolveAvatarUrl(player.avatarUrl)!} alt={player.name} className="w-8 h-8 rounded-full object-cover" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center font-bold text-teal-800 text-[10px]">{player.name.substring(0, 2)}</div>
                  )}
                  <div className="flex flex-col flex-1 min-w-0 gap-1">
                    <span className="text-sm font-bold text-[#2D3A3A] truncate">{player.name}</span>
                    <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className={cn("h-full rounded-full transition-all", fillBg)} style={{ width: `${barPercent}%` }} />
                    </div>
                  </div>
                  <span className={cn("text-base font-black", player.isMe ? "text-green-600" : "text-[#2D3A3A]")}>{player.score}</span>
                </div>
              );
            })}
          </div>
        </aside>
      </div>

      {showInviteModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#E2E8E2] rounded-3xl p-6 shadow-xl w-full max-w-sm">
            <div className="flex justify-between items-center border-b border-[#E2E8E2] pb-3 mb-4">
              <h3 className="font-bold text-[#2D3A3A]">{t("gameRoom.inviteToRoom")}</h3>
              <button onClick={() => setShowInviteModal(false)} className="text-gray-500 hover:text-red-500 text-xl font-bold">&times;</button>
            </div>
            <div className="flex flex-col gap-2 max-h-64 overflow-y-auto">
              {friendsList.map((friend) => {
                const invited = invitedFriends.includes(friend.id);
                const inRoom = roomData?.participants?.some((p) => String(p.user_id) === friend.id);
                return (
                  <div key={friend.id} className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50">
                    <span className="text-sm font-semibold">{friend.name}</span>
                    <button
                      onClick={() => handleInviteFriend(friend)}
                      disabled={invited || inRoom}
                      className="px-3 py-1 rounded-lg text-[11px] font-bold text-white bg-[#4A6741] disabled:bg-gray-300"
                    >
                      {inRoom ? t("gameRoom.inRoom") : invited ? t("gameRoom.invited") : t("gameRoom.invite")}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {showResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl text-center border border-[#E2E8E2]">
            <div className="text-4xl mb-3">🏆</div>
            <h3 className="text-xl font-black mb-4 text-[#2D3A3A]">{t("gameRoom.matchEnded")}</h3>
            <div className="space-y-2 mb-6">
              {sortedPlayers.map((p, i) => (
                <div key={p.id} className="flex justify-between text-sm font-semibold px-2">
                  <span>{i + 1}. {p.name}</span>
                  <span className="text-[#4A6741]">{p.score} {t("gameRoom.points")}</span>
                </div>
              ))}
            </div>
            <button onClick={() => navigate("/games")} className="px-8 py-2.5 bg-[#4A6741] text-white font-bold rounded-xl hover:bg-[#3c5435]">
              {t("gameRoom.backToLobby")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
