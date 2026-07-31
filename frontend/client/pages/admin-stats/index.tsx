import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { useTranslation } from "react-i18next";
import { getImageUrl } from "@/lib/utils";

interface StatsOverview {
  total_events: number;
  upcoming_events: number;
  ongoing_events: number;
  finished_events: number;
  total_registrations: number;
  average_satisfaction: number;
}

interface EventOut {
  event_id: number;
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  location: string;
  capacity: number;
  image_url: string | null;
  status: string;
  registered_count: number;
  is_full: boolean;
  is_registered: boolean;
  organizer: { user_id: number; full_name: string; avatar_url?: string };
}

const barHeights = [24.6, 30, 42.5, 37, 55, 51, 63.5, 69, 60.4, 79, 73.6, 97.3];
const months = ["T1", "T2", "T3", "T4", "T5", "T6", "T7", "T8", "T9", "T10", "T11", "T12"];

const featuredEvents = [
  {
    id: 1,
    title: "Hội thảo Công nghệ Blockchain 2024",
    attendees: 168,
    rating: 4.9,
    rank: "#1",
    rankBg: "bg-[#ECFDF5]",
    rankColor: "text-[#059669]",
    img: "https://api.builder.io/api/v1/image/assets/TEMP/e4eab2adeaaff49a2cd60623e92ed7030bff28e2?width=80",
  },
  {
    id: 2,
    title: "Lễ hội Hoa Anh Đào Việt-Nhật",
    attendees: 2500,
    rating: 4.9,
    rank: "#2",
    rankBg: "bg-[#F0FDF4]",
    rankColor: "text-[#16A34A]",
    img: "https://api.builder.io/api/v1/image/assets/TEMP/662fccd927a637b030c51b23d1a85931bc62dfe2?width=80",
  },
  {
    id: 3,
    title: "Trà đạo Nhật Bản - Nghệ thuật của sự tĩnh lặng",
    attendees: 35,
    rating: 4.9,
    rank: "#3",
    rankBg: "bg-[#F0FDF4]",
    rankColor: "text-[#16A34A]",
    img: "https://api.builder.io/api/v1/image/assets/TEMP/369dfcc3ae62bfc34d5e4e8d22fbf9fcc673a2c0?width=80",
  },
];

function TrendUpIcon({ color }: { color: string }) {
  return (
    <svg width="12" height="7" viewBox="0 0 12 7" fill="none">
      <path d="M0.983659 7L0.166992 6.18333L4.48366 1.8375L6.81699 4.17083L9.85032 1.16667H8.33366V0H11.8337V3.5H10.667V1.98333L6.81699 5.83333L4.48366 3.5L0.983659 7Z" fill={color} />
    </svg>
  );
}

function StarIcon({ size = 20, color = "#FBBF24" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size * 0.95} viewBox="0 0 20 19" fill="none">
      <path d="M3.825 19L5.45 11.975L0 7.25L7.2 6.625L10 0L12.8 6.625L20 7.25L14.55 11.975L16.175 19L10 15.275L3.825 19Z" fill={color} />
    </svg>
  );
}

function HalfStarIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size * 0.95} viewBox="0 0 20 19" fill="none">
      <path d="M13.15 14.85L12.325 11.25L15.1 8.85L11.45 8.525L10 5.125V12.925L13.15 14.85ZM3.825 19L5.45 11.975L0 7.25L7.2 6.625L10 0L12.8 6.625L20 7.25L14.55 11.975L16.175 19L10 15.275L3.825 19Z" fill="#FBBF24" />
    </svg>
  );
}

function UserGroupIcon({ stroke = "#64748B", size = 10 }: { stroke?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 10 10" fill="none">
      <path d="M6.66634 8.75V7.91667C6.66634 7.47464 6.49075 7.05072 6.17819 6.73816C5.86563 6.4256 5.4417 6.25 4.99967 6.25H2.49967C2.05765 6.25 1.63372 6.4256 1.32116 6.73816C1.0086 7.05072 0.833008 7.47464 0.833008 7.91667V8.75" stroke={stroke} strokeWidth="0.833333" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M3.74967 4.58333C4.67015 4.58333 5.41634 3.83714 5.41634 2.91667C5.41634 1.99619 4.67015 1.25 3.74967 1.25C2.8292 1.25 2.08301 1.99619 2.08301 2.91667C2.08301 3.83714 2.8292 4.58333 3.74967 4.58333Z" stroke={stroke} strokeWidth="0.833333" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M9.16699 8.75V7.91667C9.16672 7.54739 9.04381 7.18866 8.81756 6.8968C8.59132 6.60494 8.27455 6.39649 7.91699 6.30417" stroke={stroke} strokeWidth="0.833333" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M6.66699 1.30417C7.0255 1.39596 7.34326 1.60446 7.57017 1.8968C7.79709 2.18914 7.92026 2.54868 7.92026 2.91875C7.92026 3.28882 7.79709 3.64837 7.57017 3.94071C7.34326 4.23304 7.0255 4.44154 6.66699 4.53334" stroke={stroke} strokeWidth="0.833333" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function SmallStarIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
      <path d="M1.91249 9.74997L2.72499 6.23752L0 3.87502L3.59999 3.56252L4.99998 0.250031L6.39998 3.56252L10 3.87502L7.27498 6.23752L8.08748 9.74997L4.99998 7.88751L1.91249 9.74997Z" fill="#F59E0B"/>
    </svg>
  );
}

export default function Index() {
  const { t, i18n } = useTranslation();
  const [featuredTab, setFeaturedTab] = useState<"sao" | "dangky">("sao");
  const location = useLocation();
  const isJa = i18n.language.startsWith("ja");

  const localizedFeaturedEvents = [
    {
      id: 1,
      title: isJa ? "ブロックチェーン技術セミナー2024" : "Hội thảo Công nghệ Blockchain 2024",
      attendees: 168,
      rating: 4.9,
      rank: "#1",
      rankBg: "bg-[#ECFDF5]",
      rankColor: "text-[#059669]",
      img: "https://api.builder.io/api/v1/image/assets/TEMP/e4eab2adeaaff49a2cd60623e92ed7030bff28e2?width=80",
    },
    {
      id: 2,
      title: isJa ? "日越桜祭り" : "Lễ hội Hoa Anh Đào Việt-Nhật",
      attendees: 2500,
      rating: 4.9,
      rank: "#2",
      rankBg: "bg-[#F0FDF4]",
      rankColor: "text-[#16A34A]",
      img: "https://api.builder.io/api/v1/image/assets/TEMP/662fccd927a637b030c51b23d1a85931bc62dfe2?width=80",
    },
    {
      id: 3,
      title: isJa ? "日本茶道 - 静寂の芸術" : "Trà đạo Nhật Bản - Nghệ thuật của sự tĩnh lặng",
      attendees: 35,
      rating: 4.9,
      rank: "#3",
      rankBg: "bg-[#F0FDF4]",
      rankColor: "text-[#16A34A]",
      img: "https://api.builder.io/api/v1/image/assets/TEMP/369dfcc3ae62bfc34d5e4e8d22fbf9fcc673a2c0?width=80",
    },
  ];

  const months = isJa
    ? ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"]
    : ["T1", "T2", "T3", "T4", "T5", "T6", "T7", "T8", "T9", "T10", "T11", "T12"];

  const { data: overview } = useQuery({
    queryKey: ["stats-overview"],
    queryFn: () => apiFetch<StatsOverview>("/api/v1/events/statistics/overview"),
  });

  const { data: managedEvents } = useQuery({
    queryKey: ["managed-events"],
    queryFn: () => apiFetch<EventOut[]>("/api/v1/events/managed"),
  });

  const topEvents = (managedEvents ?? []).slice(0, 3).map((e, i) => ({
    id: e.event_id,
    title: e.title,
    attendees: e.registered_count,
    rating: 0,
    rank: `#${i + 1}`,
    rankBg: i === 0 ? "bg-[#ECFDF5]" : "bg-[#F0FDF4]",
    rankColor: i === 0 ? "text-[#059669]" : "text-[#16A34A]",
    img: getImageUrl(e.image_url, localizedFeaturedEvents[i]?.img || ""),
  }));

  const displayedFeaturedEvents = topEvents.length > 0 ? topEvents : localizedFeaturedEvents;

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <Navbar />
      <div className="pt-[52px]">
        <div className="max-w-[1180px] mx-auto px-4 sm:px-6 py-8 flex flex-col gap-8">

          {/* Welcome header */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl sm:text-[36px] font-black leading-10 tracking-[-0.9px] text-black">
                {t("adminStats.welcome")}
              </h1>
            </div>
            <p className="text-[#45464D] text-base font-medium leading-6">
              {t("adminStats.waitingEvents", { count: overview?.upcoming_events ?? 4 })}
            </p>
          </div>

          {/* Stats cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Dark card - Total Events */}
            <div className="relative bg-[#131B2E] rounded-lg overflow-hidden p-6 flex flex-col gap-4 min-h-[162px]">
              <div className="absolute right-5 top-5 opacity-10">
                <svg width="45" height="50" viewBox="0 0 45 50" fill="none">
                  <path d="M5 50C3.625 50 2.44792 49.5104 1.46875 48.5312C0.489583 47.5521 0 46.375 0 45V10C0 8.625 0.489583 7.44792 1.46875 6.46875C2.44792 5.48958 3.625 5 5 5H7.5V0H12.5V5H32.5V0H37.5V5H40C41.375 5 42.5521 5.48958 43.5312 6.46875C44.5104 7.44792 45 8.625 45 10V45C45 46.375 44.5104 47.5521 43.5312 48.5312C42.5521 49.5104 41.375 50 40 50H5ZM5 45H40V20H5V45ZM5 15H40V10H5V15ZM22.5 30C21.7917 30 21.1979 29.7604 20.7188 29.2812C20.2396 28.8021 20 28.2083 20 27.5C20 26.7917 20.2396 26.1979 20.7188 25.7188C21.1979 25.2396 21.7917 25 22.5 25C23.2083 25 23.8021 25.2396 24.2812 25.7188C24.7604 26.1979 25 26.7917 25 27.5C25 28.2083 24.7604 28.8021 24.2812 29.2812C23.8021 29.7604 23.2083 30 22.5 30ZM12.5 30C11.7917 30 11.1979 29.7604 10.7188 29.2812C10.2396 28.8021 10 28.2083 10 27.5C10 26.7917 10.2396 26.1979 10.7188 25.7188C11.1979 25.2396 11.7917 25 12.5 25C13.2083 25 13.8021 25.2396 14.2812 25.7188C14.7604 26.1979 15 26.7917 15 27.5C15 28.2083 14.7604 28.8021 14.2812 29.2812C13.8021 29.7604 13.2083 30 12.5 30ZM32.5 30C31.7917 30 31.1979 29.7604 30.7188 29.2812C30.2396 28.8021 30 28.2083 30 27.5C30 26.7917 30.2396 26.1979 30.7188 25.7188C31.1979 25.2396 31.7917 25 32.5 25C33.2083 25 33.8021 25.2396 34.2812 25.7188C34.7604 26.1979 35 26.7917 35 27.5C35 28.2083 34.7604 28.8021 34.2812 29.2812C33.8021 29.7604 33.2083 30 32.5 30Z" fill="white"/>
                </svg>
              </div>
              <p className="text-[#7C839B] text-[14px] font-semibold leading-5 tracking-[0.7px] uppercase">{t("adminStats.totalEvents")}</p>
              <div className="flex items-center gap-3">
                <span className="text-white text-[36px] font-black leading-10">{overview?.total_events ?? 42}</span>
                <div className="flex items-center gap-1">
                  <TrendUpIcon color="#34D399" />
                  <span className="text-[#34D399] text-sm font-medium">+12%</span>
                </div>
              </div>
              <div className="relative h-1 bg-white/10 rounded-full overflow-hidden">
                <div className="absolute left-0 top-0 bottom-0 w-[70%] bg-[#34D399] rounded-full" />
              </div>
            </div>

            {/* Total Attendees */}
            <div className="bg-white rounded-lg border border-[#E2E8F0] shadow-[0_1px_2px_0_rgba(0,0,0,0.05)] p-6 flex flex-col justify-between min-h-[162px]">
              <p className="text-[#515F74] text-[14px] font-semibold leading-5 tracking-[0.7px] uppercase">{t("adminStats.totalAttendees")}</p>
              <div className="flex items-center gap-3">
                <span className="text-black text-[36px] font-black leading-10">{(overview?.total_registrations ?? 1284).toLocaleString()}</span>
                <div className="flex items-center gap-1">
                  <TrendUpIcon color="#059669" />
                  <span className="text-[#059669] text-sm font-medium">+5.2%</span>
                </div>
              </div>
              <div className="flex items-center">
                <div className="relative flex items-center h-8">
                  <div className="w-8 h-8 rounded-full border-2 border-white overflow-hidden z-30">
                    <img src="https://api.builder.io/api/v1/image/assets/TEMP/df5e6a2ffe156bf21c1aafbe2a3e308e20b400b5?width=58" alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="w-8 h-8 rounded-full border-2 border-white overflow-hidden -ml-2 z-20">
                    <img src="https://api.builder.io/api/v1/image/assets/TEMP/b6b594a05e7210c02c0d6b8bd8b522895aea1682?width=58" alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="w-8 h-8 rounded-full border-2 border-white bg-[#F1F5F9] -ml-2 z-10 flex items-center justify-center">
                    <span className="text-[#64748B] text-[10px] font-bold leading-[15px]">+1.2k</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Average Rating */}
            <div className="bg-white rounded-lg border border-[#E2E8F0] shadow-[0_1px_2px_0_rgba(0,0,0,0.05)] p-6 flex flex-col justify-between min-h-[162px]">
              <p className="text-[#515F74] text-[14px] font-semibold leading-5 tracking-[0.7px] uppercase">{t("adminStats.avgRating")}</p>
              <div className="flex items-center gap-2">
                <span className="text-black text-[36px] font-black leading-10">{overview?.average_satisfaction?.toFixed(1) ?? "4.8"}</span>
                <span className="text-[#94A3B8] text-xl font-normal leading-7">/ 5.0</span>
              </div>
              <div className="flex items-center gap-1">
                <StarIcon />
                <StarIcon />
                <StarIcon />
                <StarIcon />
                <HalfStarIcon />
              </div>
            </div>
          </div>

          {/* Charts row */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
            {/* Bar chart */}
            <div className="bg-white rounded-lg border border-[#F1F5F9] shadow-[0_1px_2px_0_rgba(0,0,0,0.05)] p-6 flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div>
                  <h2 className="text-black text-xl font-bold leading-7">{t("adminStats.growth12Months")}</h2>
                  <p className="text-[#45464D] text-sm font-normal leading-[21px] mt-1">{t("adminStats.monthlyDetail")}</p>
                </div>
                <button className="flex items-center gap-1.5 px-3 py-1.5 border border-[#E2E8F0] bg-[#F6F3F5] rounded text-sm font-medium text-[#1B1B1D] whitespace-nowrap self-start">
                  {t("adminStats.monthRange")}
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M4 5.99998L8 9.99998L12 5.99998" stroke="#6B7280" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
              <div className="w-full overflow-x-auto">
                <div className="min-w-[480px]">
                  <div className="flex items-end gap-[6px] sm:gap-[8px] h-[220px] px-1">
                    {barHeights.map((h, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center justify-end gap-1.5 h-full">
                        <div
                          className={`w-full rounded-t-[4px] ${i === 11 ? "bg-[#047857]" : "bg-[#059669] opacity-70"}`}
                          style={{ height: `${h}%` }}
                        />
                        <span className={`text-[11px] font-bold leading-none ${i === 11 ? "text-black" : "text-[#94A3B8]"}`}>
                          {months[i]}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Featured Events */}
            <div className="bg-white rounded-lg border border-[#E2E8F0] shadow-[0_1px_2px_0_rgba(0,0,0,0.05)] flex flex-col">
              <div className="p-4 flex items-center justify-between">
                <h2 className="text-black text-base font-bold leading-6">{t("adminStats.featuredEvents")}</h2>
                <div className="flex items-center border border-[#E2E8F0] rounded overflow-hidden" style={{ padding: "0.8px" }}>
                  <button
                    onClick={() => setFeaturedTab("sao")}
                    className={`flex items-center gap-1 px-2 py-1 text-[11px] font-medium leading-[16.5px] ${featuredTab === "sao" ? "bg-[#FEF3C7] text-[#D97706]" : "bg-white text-[#6B7280]"}`}
                  >
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <path d="M4.80251 0.956246C4.82077 0.919355 4.84897 0.888302 4.88395 0.86659C4.91892 0.844879 4.95926 0.833374 5.00042 0.833374C5.04159 0.833374 5.08193 0.844879 5.1169 0.86659C5.15187 0.888302 5.18008 0.919355 5.19834 0.956246L6.16084 2.90583C6.22425 3.03415 6.31785 3.14517 6.4336 3.22935C6.54936 3.31354 6.68381 3.36838 6.82542 3.38916L8.97792 3.70416C9.01871 3.71007 9.05703 3.72728 9.08855 3.75383C9.12006 3.78038 9.14352 3.81522 9.15627 3.85442C9.16901 3.89361 9.17054 3.93558 9.16067 3.97559C9.1508 4.01561 9.12993 4.05206 9.10043 4.08083L7.54376 5.59666C7.4411 5.69671 7.36429 5.8202 7.31994 5.95651C7.27559 6.09282 7.26503 6.23787 7.28917 6.37916L7.65668 8.52083C7.66387 8.5616 7.65947 8.60356 7.64397 8.64195C7.62846 8.68033 7.60248 8.71358 7.56898 8.73791C7.53549 8.76224 7.49583 8.77666 7.45454 8.77954C7.41324 8.78241 7.37197 8.77362 7.33542 8.75416L5.41126 7.7425C5.28447 7.67592 5.14342 7.64114 5.00022 7.64114C4.85702 7.64114 4.71596 7.67592 4.58917 7.7425L2.66542 8.75416C2.6289 8.7735 2.58767 8.7822 2.54645 8.77927C2.50522 8.77634 2.46564 8.7619 2.43221 8.73759C2.39879 8.71328 2.37285 8.68007 2.35736 8.64176C2.34187 8.60344 2.33745 8.56154 2.34459 8.52083L2.71167 6.37958C2.73592 6.23822 2.72542 6.09308 2.68107 5.95668C2.63671 5.82029 2.55984 5.69673 2.45709 5.59666L0.900424 4.08125C0.870672 4.05251 0.849588 4.01599 0.839575 3.97586C0.829563 3.93573 0.831023 3.89359 0.843791 3.85424C0.856558 3.8149 0.880119 3.77993 0.91179 3.75332C0.94346 3.72672 0.981967 3.70954 1.02292 3.70375L3.17501 3.38916C3.31678 3.36854 3.45142 3.31377 3.56733 3.22957C3.68325 3.14538 3.77697 3.03428 3.84042 2.90583L4.80251 0.956246Z" stroke="#D97706" strokeWidth="0.833333" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    {t("adminStats.starTab")}
                  </button>
                  <button
                    onClick={() => setFeaturedTab("dangky")}
                    className={`flex items-center gap-1 px-2 py-1 text-[11px] font-medium leading-[16.5px] border-l border-[#E2E8F0] ${featuredTab === "dangky" ? "bg-[#F1F5F9] text-[#1B1B1D]" : "bg-white text-[#6B7280]"}`}
                  >
                    <UserGroupIcon />
                    {t("adminStats.registerTab")}
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-3 px-2 flex-1">
                {displayedFeaturedEvents.map((event) => (
                  <div key={event.id} className="flex items-center gap-3 px-2 py-2 rounded-[10px]">
                    <div className="w-10 h-10 rounded flex-shrink-0 bg-[#F1F5F9] overflow-hidden">
                      <img 
                        src={event.img} 
                        alt={event.title} 
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.onerror = null;
                          target.src = "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=80&h=80&fit=crop";
                        }}
                        className="w-full h-full object-cover" 
                      />
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                      <p className="text-black text-xs font-bold leading-4 truncate">{event.title}</p>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          <UserGroupIcon />
                          <span className="text-[#64748B] text-[10px] font-normal leading-[15px]">
                            {event.attendees.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-0.5">
                          <SmallStarIcon />
                          <span className="text-[#F59E0B] text-[10px] font-bold leading-[15px]">{event.rating}</span>
                        </div>
                      </div>
                    </div>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${event.rankBg}`}>
                      <span className={`text-[10px] font-black leading-[15px] ${event.rankColor}`}>{event.rank}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-black mt-3">
                <Link to="/events" className="w-full py-3 flex items-center justify-center">
                  <span className="text-[#059669] text-xs font-medium leading-[18px]">{t("adminStats.viewAllEvents")}</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Bottom charts row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Donut chart */}
            <div className="bg-white rounded-lg border border-[#E2E8F0] shadow-[0_1px_2px_0_rgba(0,0,0,0.05)] p-6 flex flex-col gap-4">
              <h2 className="text-black text-lg font-bold leading-6">{t("adminStats.categoryRatio")}</h2>
              <div className="flex items-center justify-center py-2">
                <div className="relative">
                  <svg width="200" height="200" viewBox="0 0 160 160" fill="none">
                    <path d="M160 80C160 68.833 157.662 57.7897 153.137 47.5807C148.611 37.3717 141.999 28.2232 133.725 20.7239C125.451 13.2246 115.698 7.54064 105.095 4.03775C94.4912 0.534868 83.2719 -0.709329 72.1586 0.385229C61.0454 1.47979 50.2844 4.88885 40.5681 10.393C30.8519 15.8972 22.3956 23.3746 15.7434 32.3441C9.09122 41.3135 4.39054 51.5762 1.94384 62.4719C-0.502869 73.3676 -0.641401 84.6548 1.53717 95.6072L30.9607 89.7545C29.5991 82.9093 29.6857 75.8547 31.2149 69.0449C32.7441 62.2351 35.682 55.8209 39.8396 50.215C43.9972 44.6092 49.2824 39.9358 55.3551 36.4957C61.4278 33.0555 68.1534 30.9249 75.0991 30.2408C82.0449 29.5567 89.057 30.3343 95.6841 32.5236C102.311 34.7129 108.407 38.2654 113.578 42.9525C118.749 47.6395 122.882 53.3573 125.71 59.7379C128.539 66.1186 130 73.0206 130 80H160Z" fill="#8B5CF6" stroke="white"/>
                    <path d="M3.19629 102.386C8.79575 121.597 21.3914 138.012 38.4984 148.393C55.6055 158.774 75.9817 162.367 95.6075 158.463L89.7548 129.039C77.4887 131.479 64.7535 129.234 54.0616 122.746C43.3697 116.258 35.4975 105.998 31.9978 93.9915L3.19629 102.386Z" fill="#059669" stroke="white"/>
                    <path d="M102.386 156.804C121.597 151.205 138.012 138.609 148.393 121.502L122.745 105.939C116.257 116.631 105.998 124.503 93.9912 128.002L102.386 156.804Z" fill="#3B82F6" stroke="white"/>
                    <path d="M151.75 115.383C156.137 106.487 158.831 96.8534 159.696 86.9725L129.81 84.3578C129.27 90.5333 127.586 96.5546 124.844 102.114L151.75 115.383Z" fill="#F59E0B" stroke="white"/>
                    <circle cx="80" cy="80" r="45" fill="white"/>
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-black text-sm font-bold">42</span>
                  </div>
                </div>
                <div className="ml-8 flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-[#8B5CF6] flex-shrink-0" />
                    <span className="text-[#8B5CF6] text-sm">{isJa ? "芸術" : "Nghệ thuật"} 56%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-[#059669] flex-shrink-0" />
                    <span className="text-[#059669] text-sm">{isJa ? "教育" : "Giáo dục"} 25%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-[#3B82F6] flex-shrink-0" />
                    <span className="text-[#3B82F6] text-sm">{isJa ? "ビジネス" : "Kinh doanh"} 13%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-[#F59E0B] flex-shrink-0" />
                    <span className="text-[#F59E0B] text-sm">{isJa ? "テクノロジー" : "Công nghệ"} 6%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Line chart */}
            <div className="bg-white rounded-lg border border-[#E2E8F0] shadow-[0_1px_2px_0_rgba(0,0,0,0.05)] p-6 flex flex-col gap-4">
              <h2 className="text-black text-lg font-bold leading-6">{t("adminStats.registrationAttendanceRatio")}</h2>
              <div className="flex-1 overflow-x-auto">
                <div className="min-w-[360px]">
                  <svg viewBox="0 0 505 220" fill="none" className="w-full" preserveAspectRatio="xMidYMid meet">
                    <path d="M7.20605 141.075H497.195" stroke="#F1F5F9" strokeWidth="0.9"/>
                    <path d="M7.20605 102.794H497.195" stroke="#F1F5F9" strokeWidth="0.9"/>
                    <path d="M7.20605 64.5139H497.195" stroke="#F1F5F9" strokeWidth="0.9"/>
                    <path d="M7.20605 26.2336H497.195" stroke="#F1F5F9" strokeWidth="0.9"/>
                    <path d="M7.20605 168.321L51.7464 157.288L96.2957 135.211L140.836 143.489L185.385 110.378L229.926 118.656L274.475 92.4451L319.015 82.7894L363.565 99.3446L408.105 64.8562L452.654 74.5119L497.195 30.3679" stroke="#3B82F6" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M7.20605 175.221L51.7464 165.556L96.2957 143.489L140.836 153.144L185.385 121.421L229.926 128.312L274.475 106.244L319.015 96.5884L363.565 111.756L408.105 78.6551L452.654 88.3108L497.195 46.3735" stroke="#059669" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round"/>
                    {[
                      [7.2, 168.319], [51.75, 157.283], [96.29, 135.212], [140.84, 143.489],
                      [185.38, 110.381], [229.93, 118.658], [274.47, 92.448], [319.02, 82.792],
                      [363.56, 99.346], [408.11, 64.859], [452.65, 74.512], [497.2, 30.368],
                    ].map(([cx, cy], i) => (
                      <circle key={i} cx={cx} cy={cy} r="3.6" fill="#3B82F6" stroke="white" strokeWidth="1.35"/>
                    ))}
                    {[
                      [7.2, 175.217], [51.75, 165.56], [96.29, 143.489], [140.84, 153.144],
                      [185.38, 121.417], [229.93, 128.315], [274.47, 106.243], [319.02, 96.587],
                      [363.56, 111.761], [408.11, 78.654], [452.65, 88.31], [497.2, 46.374],
                    ].map(([cx, cy], i) => (
                      <circle key={i} cx={cx} cy={cy} r="3.6" fill="#059669" stroke="white" strokeWidth="1.35"/>
                    ))}
                    {months.map((m, i) => (
                      <text key={i} fill="#94A3B8" fontFamily="Inter" fontSize="9" fontWeight="bold" x={i * 44.5 + 2} y="213">{m}</text>
                    ))}
                  </svg>
                </div>
              </div>
              <div className="flex items-center justify-center gap-6">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-[3px] rounded-full bg-[#3B82F6]" />
                  <span className="text-[#64748B] text-xs font-medium leading-[18px]">{t("adminStats.registerLegend")}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-[3px] rounded-full bg-[#059669]" />
                  <span className="text-[#64748B] text-xs font-medium leading-[18px]">{t("adminStats.attendLegend")}</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
