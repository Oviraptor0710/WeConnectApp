import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import {
  TURN_SECONDS_MIN, TURN_SECONDS_MAX,
  MATCH_MINUTES_MIN, MATCH_MINUTES_MAX,
  type ShiritoriRoomSettings,
} from "@/lib/shiritoriApi";

interface GameRoomOut {
  room_id: number;
  code: string;
  host_id: number;
  room_type: string;
  max_players: number;
  status: string;
  created_at: string;
  participants_count: number;
  participants: Array<{ user_id: number; full_name: string; avatar_url: string | null }>;
}

interface GameOut {
  game_id: string;
  name: string;
  description: string | null;
  game_type: string;
  icon_bg: string | null;
  badge_bg: string | null;
  badge_text: string | null;
}

const GAME_ICONS: Record<string, React.ReactNode> = {
  chess: (
    <svg width="23" height="23" viewBox="0 0 23 23" fill="none">
      <path d="M0 10V0H10V10H0ZM0 22.5V12.5H10V22.5H0ZM12.5 10V0H22.5V10H12.5ZM12.5 22.5V12.5H22.5V22.5H12.5ZM2.5 7.5H7.5V2.5H2.5V7.5ZM15 7.5H20V2.5H15V7.5ZM15 20H20V15H15V20ZM2.5 20H7.5V15H2.5V20Z" fill="#2563EB"/>
    </svg>
  ),
  kanji: (
    <svg width="24" height="24" viewBox="0 0 24 25" fill="none">
      <path d="M13.875 23.75L8.5625 18.4375L10.3125 16.6875L13.875 20.25L20.9375 13.1875L22.6875 14.9375L13.875 23.75ZM0 16.25L6.0625 0H9L15.0625 16.25H12.1875L10.75 12.125H4.1875L2.75 16.25H0ZM5.0625 9.75H9.9375L7.5625 3H7.4375L5.0625 9.75Z" fill="#EA580C"/>
    </svg>
  ),
  nihon: (
    <svg width="24" height="25" viewBox="0 0 24 25" fill="none">
      <path d="M3.75 25V19.625C2.5625 18.5417 1.64062 17.276 0.984375 15.8281C0.328125 14.3802 0 12.8542 0 11.25C0 8.125 1.09375 5.46875 3.28125 3.28125C5.46875 1.09375 8.125 0 11.25 0C13.8542 0 16.1615 0.765625 18.1719 2.29688C20.1823 3.82812 21.4896 5.82292 22.0938 8.28125L23.7188 14.6875C23.8229 15.0833 23.75 15.4427 23.5 15.7656C23.25 16.0885 22.9167 16.25 22.5 16.25H20V20C20 20.6875 19.7552 21.276 19.2656 21.7656C18.776 22.2552 18.1875 22.5 17.5 22.5H15V25H12.5V20H17.5V13.75H20.875L19.6875 8.90625C19.2083 7.01042 18.1875 5.46875 16.625 4.28125C15.0625 3.09375 13.2708 2.5 11.25 2.5C8.83333 2.5 6.77083 3.34375 5.0625 5.03125C3.35417 6.71875 2.5 8.77083 2.5 11.1875C2.5 12.4375 2.75521 13.625 3.26562 14.75C3.77604 15.875 4.5 16.875 5.4375 17.75L6.25 18.5V25H3.75Z" fill="#9333EA"/>
    </svg>
  ),
  shiritori: (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
      <rect x="2.5" y="2.5" width="23" height="23" rx="8" fill="#ECFDF5" stroke="#99F6E4"/>
      <path d="M9 10.5C12 7.5 16 7.5 18 10.5C20.4 14.1 14.8 16.4 12.2 13.8C10 11.6 13.6 9 16 11.3" stroke="#0D9488" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M19 17.5C16 20.5 12 20.5 10 17.5C7.6 13.9 13.2 11.6 15.8 14.2C18 16.4 14.4 19 12 16.7" stroke="#4A6741" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      <text x="8.1" y="10.5" fill="#0F766E" fontSize="5.2" fontWeight="800" fontFamily="Inter, sans-serif">し</text>
      <text x="16.1" y="10.5" fill="#4A6741" fontSize="5.2" fontWeight="800" fontFamily="Inter, sans-serif">り</text>
      <text x="8.1" y="20.4" fill="#4A6741" fontSize="5.2" fontWeight="800" fontFamily="Inter, sans-serif">と</text>
      <text x="16.1" y="20.4" fill="#0F766E" fontSize="5.2" fontWeight="800" fontFamily="Inter, sans-serif">り</text>
    </svg>
  ),
};

const DEFAULT_GAME_ICON = (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="5 3 19 12 5 21 5 3"></polygon>
  </svg>
);

export default function Index() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [expandedGame, setExpandedGame] = useState<string>("chess");
  const [activeCategory, setActiveCategory] = useState("all");
  const [gameSearch, setGameSearch] = useState("");
  const [roomCode, setRoomCode] = useState("");

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedGameId, setSelectedGameId] = useState("");
  const [maxPlayers, setMaxPlayers] = useState(10);
  const [shiriScript, setShiriScript] = useState<"HIRAGANA" | "KATAKANA">("HIRAGANA");
  const [shiriMinMora, setShiriMinMora] = useState(2);
  const [shiriMaxMora, setShiriMaxMora] = useState(8);
  const [shiriStartKana, setShiriStartKana] = useState("RANDOM");
  const [shiriTurnSeconds, setShiriTurnSeconds] = useState(30);
  const [shiriMatchMinutes, setShiriMatchMinutes] = useState(10);

  // Fetch list of games from database – must be declared before handlers that use apiGames
  const { data: apiGames = [] } = useQuery({
    queryKey: ["games-list"],
    queryFn: () => apiFetch<GameOut[]>("/api/v1/games"),
  });

  // Dynamic categories based on games returned from database
  const categories = ["all"];
  if (apiGames.some((g) => g.game_type === "CHESS")) categories.push("strategy");
  if (apiGames.some((g) => g.game_type === "KANJI" || g.game_type === "SHIRITORI")) categories.push("learning");
  if (apiGames.some((g) => g.game_type === "QUIZ")) categories.push("puzzle");

  useEffect(() => {
    if (!categories.includes(activeCategory)) {
      setActiveCategory("all");
    }
    if (expandedGame !== "" && apiGames.length > 0 && !apiGames.some((g) => g.game_id === expandedGame)) {
      setExpandedGame(apiGames[0].game_id);
    }
  }, [apiGames, activeCategory, expandedGame]);

  // Fetch all active game rooms
  const { data: apiRooms = [] } = useQuery({
    queryKey: ["game-rooms"],
    queryFn: () => apiFetch<GameRoomOut[]>("/api/v1/games/rooms"),
    refetchInterval: 5000, // Auto refresh every 5 seconds
  });

  // Map database games and dynamic rooms
  const games = apiGames.map((game) => {
    const matchingRooms = apiRooms.filter((r) => r.room_type === game.game_type);
    const rooms = matchingRooms.map((room) => ({
      id: room.code,
      status: room.status === "WAITING" ? "Đang chờ" : "Đang đấu",
      statusColor: room.status === "WAITING" ? "text-green-600" : "text-orange-500",
      players: `${room.participants_count} / ${room.max_players}`,
      canJoin: room.status === "WAITING" && room.participants_count < room.max_players,
    }));
    const openCount = matchingRooms.filter((r) => r.status === "WAITING").length;

    return {
      id: game.game_id,
      type: game.game_type,
      name: t(`gameTitles.${game.game_id}`, { defaultValue: game.name }),
      description: t(`gameDescriptions.${game.game_id}`, { defaultValue: game.description || "" }),
      iconBg: game.icon_bg || "bg-gray-100",
      badgeBg: game.badge_bg || "bg-slate-100",
      badgeText: game.badge_text || "text-slate-500",
      icon: GAME_ICONS[game.game_id] || DEFAULT_GAME_ICON,
      rooms,
      openCount,
    };
  });

  // Find active room type for sidebar actions
  const currentMeta = apiGames.find((m) => m.game_id === expandedGame);
  const currentType = currentMeta ? currentMeta.game_type : "QUIZ";

  const handleOpenCreateModal = () => {
    const defaultGame = apiGames.find((g) => g.game_id === expandedGame) || apiGames[0];
    if (defaultGame) {
      setSelectedGameId(defaultGame.game_id);
      if (defaultGame.game_type === "CHESS") {
        setMaxPlayers(2);
      } else if (defaultGame.game_type === "KANJI") {
        setMaxPlayers(4);
      } else if (defaultGame.game_type === "SHIRITORI") {
        setMaxPlayers(6);
      } else {
        setMaxPlayers(10);
      }
    } else {
      // apiGames not loaded yet – still open modal with empty state
      setSelectedGameId("");
    }
    setShowCreateModal(true);
  };

  const handleGameChange = (gameId: string) => {
    setSelectedGameId(gameId);
    const game = apiGames.find((g) => g.game_id === gameId);
    if (game) {
      if (game.game_type === "CHESS") {
        setMaxPlayers(2);
      } else if (game.game_type === "KANJI") {
        setMaxPlayers(4);
      } else if (game.game_type === "SHIRITORI") {
        setMaxPlayers(6);
      } else {
        setMaxPlayers(10);
      }
    }
  };

  // Create room mutation
  const createRoomMutation = useMutation({
    mutationFn: (variables: { room_type: string; max_players: number; settings?: ShiritoriRoomSettings }) =>
      apiFetch<GameRoomOut>("/api/v1/games/rooms", {
        method: "POST",
        body: JSON.stringify({
          room_type: variables.room_type,
          max_players: variables.max_players,
          settings: variables.settings,
        }),
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["game-rooms"] });
      setShowCreateModal(false);
      navigate(`/game?code=${data.code}`);
    },
    onError: (err: any) => {
      alert(err.message || "Không thể tạo phòng game");
    },
  });

  // Join room mutation
  const joinRoomMutation = useMutation({
    mutationFn: (code: string) =>
      apiFetch<GameRoomOut>("/api/v1/games/rooms/join", {
        method: "POST",
        body: JSON.stringify({ code }),
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["game-rooms"] });
      navigate(`/game?code=${data.code}`);
    },
    onError: (err: any) => {
      alert(err.message || "Mã phòng không tồn tại hoặc phòng đã đầy");
    },
  });

  // Join random room mutation
  const joinRandomMutation = useMutation({
    mutationFn: (roomType: string) =>
      apiFetch<GameRoomOut>("/api/v1/games/rooms/random", {
        method: "POST",
        body: JSON.stringify({ room_type: roomType, max_players: roomType === "CHESS" ? 2 : 10 }),
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["game-rooms"] });
      navigate(`/game?code=${data.code}`);
    },
    onError: (err: any) => {
      alert(err.message || "Không thể tham gia phòng ngẫu nhiên");
    },
  });

  const filteredGames = games.filter((g) => {
    const matchSearch = g.name.toLowerCase().includes(gameSearch.toLowerCase());
    if (activeCategory === "all") return matchSearch;
    if (activeCategory === "strategy") return matchSearch && g.type === "CHESS";
    if (activeCategory === "learning") return matchSearch && (g.type === "KANJI" || g.type === "SHIRITORI");
    if (activeCategory === "puzzle") return matchSearch && g.type === "QUIZ";
    return matchSearch;
  });

  return (
    <div className="min-h-screen flex flex-col" style={{ fontFamily: "Inter, -apple-system, Roboto, Helvetica, sans-serif", background: "#F9FAF9" }}>
      <Navbar />

      {/* Main */}
      <main className="flex-1 py-6 px-4 sm:px-6">
        <div className="max-w-[1232px] mx-auto">
          <div className="flex flex-col lg:grid lg:grid-cols-12 gap-6 lg:gap-8">

            {/* Left Sidebar */}
            <aside className="lg:col-span-3">
              <div className="rounded-2xl border border-[#E2E8E2] bg-white shadow-sm p-5 flex flex-col gap-6">
                {/* Actions */}
                <div className="flex flex-col gap-4">
                  <p className="text-xs font-bold uppercase tracking-[0.7px] text-gray-500">{t("games.actions")}</p>
                  <div className="flex flex-col gap-3">
                    <button
                      onClick={handleOpenCreateModal}
                      disabled={createRoomMutation.isPending || apiGames.length === 0}
                      className="flex items-center gap-3 w-full px-4 py-3 rounded-2xl text-white text-sm font-medium shadow-sm transition-opacity hover:opacity-90 active:opacity-80 disabled:opacity-50"
                      style={{ background: "#4A6741" }}
                    >
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <path d="M9 15H11V11H15V9H11V5H9V9H5V11H9V15ZM10 20C8.61667 20 7.31667 19.7375 6.1 19.2125C4.88333 18.6875 3.825 17.975 2.925 17.075C2.025 16.175 1.3125 15.1167 0.7875 13.9C0.2625 12.6833 0 11.3833 0 10C0 8.61667 0.2625 7.31667 0.7875 6.1C1.3125 4.88333 2.025 3.825 2.925 2.925C3.825 2.025 4.88333 1.3125 6.1 0.7875C7.31667 0.2625 8.61667 0 10 0C11.3833 0 12.6833 0.2625 13.9 0.7875C15.1167 1.3125 16.175 2.025 17.075 2.925C17.975 3.825 18.6875 4.88333 19.2125 6.1C19.7375 7.31667 20 8.61667 20 10C20 11.3833 19.7375 12.6833 19.2125 13.9C18.6875 15.1167 17.975 16.175 17.075 17.075C16.175 17.975 15.1167 18.6875 13.9 19.2125C12.6833 19.7375 11.3833 20 10 20ZM10 18C12.2333 18 14.125 17.225 15.675 15.675C17.225 14.125 18 12.2333 18 10C18 7.76667 17.225 5.875 15.675 4.325C14.125 2.775 12.2333 2 10 2C7.76667 2 5.875 2.775 4.325 4.325C2.775 5.875 2 7.76667 2 10C2 12.2333 2.775 14.125 4.325 15.675C5.875 17.225 7.76667 18 10 18Z" fill="white"/>
                      </svg>
                      {t("games.createRoomBtn")}
                    </button>
                    <button
                      onClick={() => joinRandomMutation.mutate(currentType)}
                      disabled={joinRandomMutation.isPending}
                      className="flex items-center gap-3 w-full px-4 py-3 rounded-2xl text-white text-sm font-medium shadow-sm transition-opacity hover:opacity-90 active:opacity-80 disabled:opacity-50"
                      style={{ background: "#4A6741" }}
                    >
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M10 16V14H12.6L9.425 10.825L10.85 9.4L14 12.55V10H16V16H10ZM1.4 16L0 14.6L12.6 2H10V0H16V6H14V3.4L1.4 16ZM5.175 6.575L0 1.4L1.4 0L6.575 5.175L5.175 6.575Z" fill="white"/>
                      </svg>
                      {joinRandomMutation.isPending ? "Đang tìm..." : t("games.random")}
                    </button>
                  </div>
                </div>

                {/* Room Code */}
                <div className="flex flex-col gap-2 pt-4 border-t border-[#E2E8E2]">
                  <p className="text-xs font-bold uppercase tracking-[0.7px] text-gray-500">{t("games.enterRoomCode")}</p>
                  <div className="relative mt-1">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2" width="22" height="12" viewBox="0 0 22 12" fill="none">
                      <path d="M6 12C4.33333 12 2.91667 11.4167 1.75 10.25C0.583333 9.08333 0 7.66667 0 6C0 4.33333 0.583333 2.91667 1.75 1.75C2.91667 0.583333 4.33333 0 6 0C7.1 0 8.10833 0.275 9.025 0.825C9.94167 1.375 10.6667 2.1 11.2 3H22V9H20V12H14V9H11.2C10.6667 9.9 9.94167 10.625 9.025 11.175C8.10833 11.725 7.1 12 6 12ZM6 10C7.1 10 7.98333 9.6625 8.65 8.9875C9.31667 8.3125 9.71667 7.65 9.85 7H16V10H18V7H20V5H9.85C9.71667 4.35 9.31667 3.6875 8.65 3.0125C7.98333 2.3375 7.1 2 6 2C4.9 2 3.95833 2.39167 3.175 3.175C2.39167 3.95833 2 4.9 2 6C2 7.1 2.39167 8.04167 3.175 8.825C3.95833 9.60833 4.9 10 6 10ZM6 8C6.55 8 7.02083 7.80417 7.4125 7.4125C7.80417 7.02083 8 6.55 8 6C8 5.45 7.80417 4.97917 7.4125 4.5875C7.02083 4.19583 6.55 4 6 4C5.45 4 4.97917 4.19583 4.5875 4.5875C4.19583 4.97917 4 5.45 4 6C4 6.55 4.19583 7.02083 4.5875 7.4125C4.97917 7.80417 5.45 8 6 8Z" fill="#94A3B8"/>
                    </svg>
                    <input
                      type="text"
                      placeholder={t("games.roomCodePlaceholder")}
                      value={roomCode}
                      onChange={(e) => setRoomCode(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && roomCode.trim()) {
                          joinRoomMutation.mutate(roomCode.trim());
                        }
                      }}
                      className="w-full pl-10 pr-4 py-3 rounded-2xl border border-[#E2E8E2] bg-[#F8FAFC] text-sm text-gray-500 placeholder-gray-400 outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40"
                    />
                  </div>
                </div>
              </div>
            </aside>

            {/* Right Content */}
            <div className="lg:col-span-9 flex flex-col gap-6 lg:gap-8">

              {/* Quote Banner */}
              <div
                className="rounded-2xl border px-8 py-8 text-center"
                style={{ background: "rgba(241,245,240,0.5)", borderColor: "rgba(74,103,65,0.1)" }}
              >
                <p className="text-lg italic font-medium leading-relaxed" style={{ color: "#2D3A3A" }}>
                  {t("games.gameQuote")}
                </p>
              </div>

              {/* Game List Section */}
              <div className="flex flex-col gap-6">
                {/* Section Header */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-6 rounded-full" style={{ background: "#4A6741" }} />
                    <h2 className="text-xl font-bold" style={{ color: "#2D3A3A" }}>{t("games.gameList")}</h2>
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    {/* Search */}
                    <div className="relative">
                      <svg className="absolute left-3.5 top-1/2 -translate-y-1/2" width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <path d="M12.45 13.5L7.725 8.775C7.35 9.075 6.91875 9.3125 6.43125 9.4875C5.94375 9.6625 5.425 9.75 4.875 9.75C3.5125 9.75 2.35938 9.27813 1.41562 8.33438C0.471875 7.39063 0 6.2375 0 4.875C0 3.5125 0.471875 2.35938 1.41562 1.41562C2.35938 0.471875 3.5125 0 4.875 0C6.2375 0 7.39063 0.471875 8.33438 1.41562C9.27813 2.35938 9.75 3.5125 9.75 4.875C9.75 5.425 9.6625 5.94375 9.4875 6.43125C9.3125 6.91875 9.075 7.35 8.775 7.725L13.5 12.45L12.45 13.5ZM4.875 8.25C5.8125 8.25 6.60938 7.92188 7.26562 7.26562C7.92188 6.60938 8.25 5.8125 8.25 4.875C8.25 3.9375 7.92188 3.14062 7.26562 2.48438C6.60938 1.82812 5.8125 1.5 4.875 1.5C3.9375 1.5 3.14062 1.82812 2.48438 2.48438C1.82812 3.14062 1.5 3.9375 1.5 4.875C1.5 5.8125 1.82812 6.60938 2.48438 7.26562C3.14062 7.92188 3.9375 8.25 4.875 8.25Z" fill="#6B7280"/>
                      </svg>
                      <input
                        type="text"
                        placeholder={t("games.searchPlaceholder")}
                        value={gameSearch}
                        onChange={(e) => setGameSearch(e.target.value)}
                        className="pl-10 pr-4 py-2 rounded-full text-sm text-gray-500 placeholder-gray-400 outline-none focus:ring-2 focus:ring-primary/30 w-full sm:w-[200px]"
                        style={{ background: "rgba(241,245,249,0.8)" }}
                      />
                    </div>

                    {/* Category Filters */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {categories.map((cat) => (
                        <button
                          key={cat}
                          onClick={() => setActiveCategory(cat)}
                          className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
                            activeCategory === cat
                              ? "text-white shadow-md"
                              : "border border-[#E2E8E2] bg-white text-gray-500 hover:bg-gray-50"
                          }`}
                          style={activeCategory === cat ? { background: "#4A6741" } : {}}
                        >
                          {t(`games.${cat}`)}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Game Cards */}
                <div className="flex flex-col gap-4">
                  {filteredGames.map((game) => {
                    const isExpanded = expandedGame === game.id;
                    const hasRooms = game.rooms.length > 0;
                    return (
                      <div
                        key={game.id}
                        className="rounded-2xl border border-[#E2E8E2] bg-white shadow-sm overflow-hidden"
                      >
                        {/* Game Header Row */}
                        <button
                          className="w-full flex items-center justify-between px-5 py-5 text-left transition-colors hover:bg-gray-50/50"
                          onClick={() => setExpandedGame(isExpanded ? "" : game.id)}
                        >
                          <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${game.iconBg}`}>
                              {game.icon}
                            </div>
                            <div>
                              <p className="text-base font-bold" style={{ color: "#2D3A3A" }}>{game.name}</p>
                              <p className="text-[11px] text-gray-500 mt-0.5">{game.description}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-bold ${game.badgeBg} ${game.badgeText}`}
                            >
                              {game.openCount === 0 ? t("games.noWaitingRooms") : t("games.waitingRooms", { count: game.openCount })}
                            </span>
                            <svg
                              width="12"
                              height="8"
                              viewBox="0 0 12 8"
                              fill="none"
                              className={`transition-transform duration-200 ${isExpanded ? "rotate-180" : ""} ${!hasRooms && game.openCount === 0 ? "opacity-50" : ""}`}
                            >
                              <path d="M6 7.4L0 1.4L1.4 0L6 4.6L10.6 0L12 1.4L6 7.4Z" fill="#6B7280"/>
                            </svg>
                          </div>
                        </button>

                        {/* Expanded Rooms */}
                        {isExpanded && game.rooms.length > 0 && (
                          <div className="border-t border-[#E2E8E2] bg-slate-50/50 px-4 py-4 flex flex-col gap-3">
                            {game.rooms.map((room) => (
                              <div
                                key={room.id}
                                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl border border-[#E2E8E2] bg-white"
                              >
                                <div className="grid grid-cols-3 sm:flex sm:items-center gap-4 sm:gap-6">
                                  <div>
                                    <p className="text-[10px] font-bold uppercase tracking-[-0.5px] text-gray-500">{t("games.id")}</p>
                                    <p className="text-sm font-bold mt-0.5" style={{ color: "#2D3A3A" }}>{room.id}</p>
                                  </div>
                                  <div>
                                    <p className="text-[10px] font-bold uppercase tracking-[-0.5px] text-gray-500">{t("games.status")}</p>
                                    <p className={`text-[11px] font-bold mt-0.5 ${room.statusColor}`}>{room.status === "Đang chờ" ? t("games.waiting") : (room.status === "Đang đấu" ? t("games.playing") : room.status)}</p>
                                  </div>
                                  <div>
                                    <p className="text-[10px] font-bold uppercase tracking-[-0.5px] text-gray-500">{t("games.players")}</p>
                                    <p className="text-sm font-medium mt-0.5" style={{ color: "#2D3A3A" }}>{room.players}</p>
                                  </div>
                                </div>
                                {room.canJoin && (
                                  <button
                                    onClick={() => joinRoomMutation.mutate(room.id)}
                                    disabled={joinRoomMutation.isPending}
                                    className="w-full sm:w-auto px-6 py-2 rounded-lg text-white text-xs font-bold shadow-sm transition-opacity hover:opacity-90 shrink-0 disabled:opacity-50 text-center"
                                    style={{ background: "#4A6741" }}
                                  >
                                    {joinRoomMutation.isPending ? "Đang vào..." : t("games.join")}
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Create Room Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white rounded-3xl border border-[#E2E8E2] shadow-2xl p-6 relative" style={{ fontFamily: "Inter, -apple-system, Roboto, Helvetica, sans-serif" }}>
            <button
              onClick={() => setShowCreateModal(false)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>

            <h3 className="text-xl font-bold mb-5" style={{ color: "#2D3A3A" }}>{t("games.createNewRoom")}</h3>

            <div className="flex flex-col gap-4">
              {/* Game selection */}
              <div>
                <label className="text-xs font-bold uppercase tracking-[0.7px] text-gray-500 block mb-2">{t("games.selectGame")}</label>
                <select
                  value={selectedGameId}
                  onChange={(e) => handleGameChange(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-[#E2E8E2] bg-[#F8FAFC] text-sm text-gray-700 outline-none focus:ring-2 focus:ring-[#4A6741]/30 focus:border-[#4A6741]/40"
                >
                  {apiGames.map((g) => (
                    <option key={g.game_id} value={g.game_id}>
                      {t(`gameTitles.${g.game_id}`, { defaultValue: g.name })}
                    </option>
                  ))}
                </select>
              </div>

              {/* Max players selection */}
              <div>
                <label className="text-xs font-bold uppercase tracking-[0.7px] text-gray-500 block mb-2">{t("games.maxPlayers")}</label>
                <select
                  value={maxPlayers}
                  onChange={(e) => setMaxPlayers(Number(e.target.value))}
                  className="w-full px-4 py-3 rounded-2xl border border-[#E2E8E2] bg-[#F8FAFC] text-sm text-gray-700 outline-none focus:ring-2 focus:ring-[#4A6741]/30 focus:border-[#4A6741]/40"
                >
                  {selectedGameId && apiGames.find(g => g.game_id === selectedGameId)?.game_type === "CHESS" ? (
                    <option value="2">{t("games.playersCount", { count: 2 })}</option>
                  ) : selectedGameId && apiGames.find(g => g.game_id === selectedGameId)?.game_type === "KANJI" ? (
                    [2, 3, 4].map(n => (
                      <option key={n} value={n}>{t("games.playersCount", { count: n })}</option>
                    ))
                  ) : selectedGameId && apiGames.find(g => g.game_id === selectedGameId)?.game_type === "SHIRITORI" ? (
                    [2, 3, 4, 5, 6, 7, 8].map(n => (
                      <option key={n} value={n}>{t("games.playersCount", { count: n })}</option>
                    ))
                  ) : (
                    [2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                      <option key={n} value={n}>{t("games.playersCount", { count: n })}</option>
                    ))
                  )}
                </select>
              </div>

              {/* Shiritori settings */}
              {selectedGameId && apiGames.find(g => g.game_id === selectedGameId)?.game_type === "SHIRITORI" && (
                <div className="flex flex-col gap-3 p-4 rounded-2xl bg-teal-50/50 border border-teal-100">
                  <p className="text-xs font-bold uppercase text-teal-700">{t("shiritori.roomSettings")}</p>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold uppercase text-gray-500 block mb-1">{t("shiritori.script")}</label>
                      <select value={shiriScript} onChange={(e) => setShiriScript(e.target.value as "HIRAGANA" | "KATAKANA")}
                        className="w-full px-3 py-2 rounded-xl border border-[#E2E8E2] bg-white text-sm">
                        <option value="HIRAGANA">{t("shiritori.hiragana")}</option>
                        <option value="KATAKANA">{t("shiritori.katakana")}</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase text-gray-500 flex items-center gap-1.5 mb-1">
                        <span>{t("shiritori.startKana")}</span>
                        <span
                          className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[9px] font-semibold normal-case tracking-normal text-gray-400 bg-white border border-dashed border-gray-300"
                          title={t("shiritori.startKanaHint")}
                        >
                          <span aria-hidden className="text-[10px] leading-none">○</span>
                          {t("shiritori.optional")}
                        </span>
                      </label>
                      <input
                        type="text"
                        value={shiriStartKana}
                        onChange={(e) => setShiriStartKana(e.target.value)}
                        placeholder={t("shiritori.startKanaPlaceholder")}
                        className="w-full px-3 py-2 rounded-xl border border-[#E2E8E2] bg-white text-sm"
                      />
                      <p className="mt-1 text-[10px] text-gray-400">{t("shiritori.startKanaHint")}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold uppercase text-gray-500 block mb-1">{t("shiritori.minMora")}</label>
                      <select value={shiriMinMora} onChange={(e) => setShiriMinMora(Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-xl border border-[#E2E8E2] bg-white text-sm">
                        {[1,2,3,4,5,6].map(n => <option key={n} value={n}>{n}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase text-gray-500 block mb-1">{t("shiritori.maxMora")}</label>
                      <select value={shiriMaxMora} onChange={(e) => setShiriMaxMora(Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-xl border border-[#E2E8E2] bg-white text-sm">
                        {[2,3,4,5,6,7,8,10,12].map(n => <option key={n} value={n}>{n}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold uppercase text-gray-500 block mb-1">{t("shiritori.turnTime")}</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min={TURN_SECONDS_MIN}
                          max={TURN_SECONDS_MAX}
                          value={shiriTurnSeconds}
                          onChange={(e) => setShiriTurnSeconds(Number(e.target.value))}
                          className="w-full px-3 py-2 rounded-xl border border-[#E2E8E2] bg-white text-sm"
                        />
                        <span className="text-xs text-gray-500 shrink-0">{t("shiritori.seconds")}</span>
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase text-gray-500 block mb-1">{t("shiritori.matchTime")}</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min={MATCH_MINUTES_MIN}
                          max={MATCH_MINUTES_MAX}
                          value={shiriMatchMinutes}
                          onChange={(e) => setShiriMatchMinutes(Number(e.target.value))}
                          className="w-full px-3 py-2 rounded-xl border border-[#E2E8E2] bg-white text-sm"
                        />
                        <span className="text-xs text-gray-500 shrink-0">{t("shiritori.minutes")}</span>
                      </div>
                    </div>
                  </div>

                </div>
              )}

              {/* Submit button */}
              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-3 border border-[#E2E8E2] bg-white hover:bg-gray-50 text-gray-700 text-sm font-semibold rounded-2xl transition-colors"
                >
                  {t("games.cancel")}
                </button>
                <button
                  onClick={() => {
                    const game = apiGames.find(g => g.game_id === selectedGameId);
                    if (game) {
                      const payload: { room_type: string; max_players: number; settings?: ShiritoriRoomSettings } = {
                        room_type: game.game_type,
                        max_players: maxPlayers,
                      };
                      if (game.game_type === "SHIRITORI") {
                        const turnSeconds = Math.min(
                          TURN_SECONDS_MAX,
                          Math.max(TURN_SECONDS_MIN, shiriTurnSeconds || TURN_SECONDS_MIN),
                        );
                        const matchMinutes = Math.min(
                          MATCH_MINUTES_MAX,
                          Math.max(MATCH_MINUTES_MIN, shiriMatchMinutes || MATCH_MINUTES_MIN),
                        );
                        const startKanaRaw = shiriStartKana.trim();
                        const startKana = !startKanaRaw || startKanaRaw.toUpperCase() === "RANDOM"
                          ? "RANDOM"
                          : [...startKanaRaw][0];
                        payload.settings = {
                          script_mode: shiriScript,
                          min_mora: shiriMinMora,
                          max_mora: Math.max(shiriMinMora, shiriMaxMora),
                          start_kana: startKana,
                          turn_seconds: turnSeconds,
                          match_minutes: matchMinutes,
                          allow_long_vowel_chain: true,
                        };
                      }
                      createRoomMutation.mutate(payload);
                    }
                  }}
                  disabled={createRoomMutation.isPending}
                  className="flex-1 px-4 py-3 text-white text-sm font-semibold rounded-2xl shadow-sm transition-opacity hover:opacity-90 active:opacity-80 disabled:opacity-50"
                  style={{ background: "#4A6741" }}
                >
                  {createRoomMutation.isPending ? t("games.creating") : t("games.createRoomBtn")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
