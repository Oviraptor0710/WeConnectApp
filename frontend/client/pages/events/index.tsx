import { useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { useTranslation } from "react-i18next";

const CalendarIcon = () => (
  <svg width="18" height="20" viewBox="0 0 18 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
    <path d="M2 20C1.45 20 0.979167 19.8042 0.5875 19.4125C0.195833 19.0208 0 18.55 0 18V4C0 3.45 0.195833 2.97917 0.5875 2.5875C0.979167 2.19583 1.45 2 2 2H3V0H5V2H13V0H15V2H16C16.55 2 17.0208 2.19583 17.4125 2.5875C17.8042 2.97917 18 3.45 18 4V18C18 18.55 17.8042 19.0208 17.4125 19.4125C17.0208 19.8042 16.55 20 16 20H2ZM2 18H16V8H2V18ZM2 6H16V4H2V6ZM9 12C8.71667 12 8.47917 11.9042 8.2875 11.7125C8.09583 11.5208 8 11.2833 8 11C8 10.7167 8.09583 10.4792 8.2875 10.2875C8.47917 10.0958 8.71667 10 9 10C9.28333 10 9.52083 10.0958 9.7125 10.2875C9.90417 10.4792 10 10.7167 10 11C10 11.2833 9.90417 11.5208 9.7125 11.7125C9.52083 11.9042 9.28333 12 9 12ZM5 12C4.71667 12 4.47917 11.9042 4.2875 11.7125C4.09583 11.5208 4 11.2833 4 11C4 10.7167 4.09583 10.4792 4.2875 10.2875C4.47917 10.0958 4.71667 10 5 10C5.28333 10 5.52083 10.0958 5.7125 10.2875C5.90417 10.4792 6 10.7167 6 11C6 11.2833 5.90417 11.5208 5.7125 11.7125C5.52083 11.9042 5.28333 12 5 12ZM13 12C12.7167 12 12.4792 11.9042 12.2875 11.7125C12.0958 11.5208 12 11.2833 12 11C12 10.7167 12.0958 10.4792 12.2875 10.2875C12.4792 10.0958 12.7167 10 13 10C13.2833 10 13.5208 10.0958 13.7125 10.2875C13.9042 10.4792 14 10.7167 14 11C14 11.2833 13.9042 11.5208 13.7125 11.7125C13.5208 11.9042 13.2833 12 13 12ZM9 16C8.71667 16 8.47917 15.9042 8.2875 15.7125C8.09583 15.5208 8 15.2833 8 15C8 14.7167 8.09583 14.4792 8.2875 14.2875C8.47917 14.0958 8.71667 14 9 14C9.28333 14 9.52083 14.0958 9.7125 14.2875C9.90417 14.4792 10 14.7167 10 15C10 15.2833 9.90417 15.5208 9.7125 15.7125C9.52083 15.9042 9.28333 16 9 16ZM5 16C4.71667 16 4.47917 15.9042 4.2875 15.7125C4.09583 15.5208 4 15.2833 4 15C4 14.7167 4.09583 14.4792 4.2875 14.2875C4.47917 14.0958 4.71667 14 5 14C5.28333 14 5.52083 14.0958 5.7125 14.2875C5.90417 14.4792 6 14.7167 6 15C6 15.2833 5.90417 15.5208 5.7125 15.7125C5.52083 15.9042 5.28333 16 5 16ZM13 16C12.7167 16 12.4792 15.9042 12.2875 15.7125C12.0958 15.5208 12 15.2833 12 15C12 14.7167 12.0958 14.4792 12.2875 14.2875C12.4792 14.0958 12.7167 14 13 14C13.2833 14 13.5208 14.0958 13.7125 14.2875C13.9042 14.4792 14 14.7167 14 15C14 15.2833 13.9042 15.5208 13.7125 15.7125C13.5208 15.9042 13.2833 16 13 16Z" fill="#6B7280" />
  </svg>
);

const LocationPinIcon = () => (
  <svg width="16" height="20" viewBox="0 0 16 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
    <path d="M8 10C8.55 10 9.02083 9.80417 9.4125 9.4125C9.80417 9.02083 10 8.55 10 8C10 7.45 9.80417 6.97917 9.4125 6.5875C9.02083 6.19583 8.55 6 8 6C7.45 6 6.97917 6.19583 6.5875 6.5875C6.19583 6.97917 6 7.45 6 8C6 8.55 6.19583 9.02083 6.5875 9.4125C6.97917 9.80417 7.45 10 8 10ZM8 17.35C10.0333 15.4833 11.5417 13.7875 12.525 12.2625C13.5083 10.7375 14 9.38333 14 8.2C14 6.38333 13.4208 4.89583 12.2625 3.7375C11.1042 2.57917 9.68333 2 8 2C6.31667 2 4.89583 2.57917 3.7375 3.7375C2.57917 4.89583 2 6.38333 2 8.2C2 9.38333 2.49167 10.7375 3.475 12.2625C4.45833 13.7875 5.96667 15.4833 8 17.35ZM8 20C5.31667 17.7167 3.3125 15.5958 1.9875 13.6375C0.6625 11.6792 0 9.86667 0 8.2C0 5.7 0.804167 3.70833 2.4125 2.225C4.02083 0.741667 5.88333 0 8 0C10.1167 0 11.9792 0.741667 13.5875 2.225C15.1958 3.70833 16 5.7 16 8.2C16 9.86667 15.3375 11.6792 14.0125 13.6375C12.6875 15.5958 10.6833 17.7167 8 20Z" fill="#6B7280" />
  </svg>
);

const VideoIcon = () => (
  <svg width="20" height="16" viewBox="0 0 20 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
    <path d="M2 16C1.45 16 0.979167 15.8042 0.5875 15.4125C0.195833 15.0208 0 14.55 0 14V2C0 1.45 0.195833 0.979167 0.5875 0.5875C0.979167 0.195833 1.45 0 2 0H14C14.55 0 15.0208 0.195833 15.4125 0.5875C15.8042 0.979167 16 1.45 16 2V6.5L20 2.5V13.5L16 9.5V14C16 14.55 15.8042 15.0208 15.4125 15.4125C15.0208 15.8042 14.55 16 14 16H2ZM2 14H14V2H2V14Z" fill="#6B7280" />
  </svg>
);

const GlobeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
    <path d="M10.0125 20C8.6375 20 7.34167 19.7375 6.125 19.2125C4.90833 18.6875 3.84583 17.9708 2.9375 17.0625C2.02917 16.1542 1.3125 15.0917 0.7875 13.875C0.2625 12.6583 0 11.3625 0 9.9875C0 8.6125 0.2625 7.32083 0.7875 6.1125C1.3125 4.90417 2.02917 3.84583 2.9375 2.9375C3.84583 2.02917 4.90833 1.3125 6.125 0.7875C7.34167 0.2625 8.6375 0 10.0125 0C11.3875 0 12.6792 0.2625 13.8875 0.7875C15.0958 1.3125 16.1542 2.02917 17.0625 2.9375C17.9708 3.84583 18.6875 4.90417 19.2125 6.1125C19.7375 7.32083 20 8.6125 20 9.9875C20 11.3625 19.7375 12.6583 19.2125 13.875C18.6875 15.0917 17.9708 16.1542 17.0625 17.0625C16.1542 17.9708 15.0958 18.6875 13.8875 19.2125C12.6792 19.7375 11.3875 20 10.0125 20ZM10 17.95C10.4333 17.35 10.8083 16.725 11.125 16.075C11.4417 15.425 11.7 14.7333 11.9 14H8.1C8.3 14.7333 8.55833 15.425 8.875 16.075C9.19167 16.725 9.56667 17.35 10 17.95ZM7.4 17.55C7.1 17 6.8375 16.4292 6.6125 15.8375C6.3875 15.2458 6.2 14.6333 6.05 14H3.1C3.58333 14.8333 4.1875 15.5583 4.9125 16.175C5.6375 16.7917 6.46667 17.25 7.4 17.55ZM12.6 17.55C13.5333 17.25 14.3625 16.7917 15.0875 16.175C15.8125 15.5583 16.4167 14.8333 16.9 14H13.95C13.8 14.6333 13.6125 15.2458 13.3875 15.8375C13.1625 16.4292 12.9 17 12.6 17.55ZM2.25 12H5.65C5.6 11.6667 5.5625 11.3375 5.5375 11.0125C5.5125 10.6875 5.5 10.35 5.5 10C5.5 9.65 5.5125 9.3125 5.5375 8.9875C5.5625 8.6625 5.6 8.33333 5.65 8H2.25C2.16667 8.33333 2.10417 8.6625 2.0625 8.9875C2.02083 9.3125 2 9.65 2 10C2 10.35 2.02083 10.6875 2.0625 11.0125C2.10417 11.3375 2.16667 11.6667 2.25 12ZM7.65 12H12.35C12.4 11.6667 12.4375 11.3375 12.4625 11.0125C12.4875 10.6875 12.5 10.35 12.5 10C12.5 9.65 12.4875 9.3125 12.4625 8.9875C12.4375 8.6625 12.4 8.33333 12.35 8H7.65C7.6 8.33333 7.5625 8.6625 7.5375 8.9875C7.5125 9.3125 7.5 9.65 7.5 10C7.5 10.35 7.5125 10.6875 7.5375 11.0125C7.5625 11.3375 7.6 11.6667 7.65 12ZM14.35 12H17.75C17.8333 11.6667 17.8958 11.3375 17.9375 11.0125C17.9792 10.6875 18 10.35 18 10C18 9.65 17.9792 9.3125 17.9375 8.9875C17.8958 8.6625 17.8333 8.33333 17.75 8H14.35C14.4 8.33333 14.4375 8.6625 14.4625 8.9875C14.4875 9.3125 14.5 9.65 14.5 10C14.5 10.35 14.4875 10.6875 14.4625 11.0125C14.4375 11.3375 14.4 11.6667 14.35 12ZM13.95 6H16.9C16.4167 5.16667 15.8125 4.44167 15.0875 3.825C14.3625 3.20833 13.5333 2.75 12.6 2.45C12.9 3 13.1625 3.57083 13.3875 4.1625C13.6125 4.75417 13.8 5.36667 13.95 6ZM8.1 6H11.9C11.7 5.26667 11.4417 4.575 11.125 3.925C10.8083 3.275 10.4333 2.65 10 2.05C9.56667 2.65 9.19167 3.275 8.875 3.925C8.55833 4.575 8.3 5.26667 8.1 6ZM3.1 6H6.05C6.2 5.36667 6.3875 4.75417 6.6125 4.1625C6.8375 3.57083 7.1 3 7.4 2.45C6.46667 2.75 5.6375 3.20833 4.9125 3.825C4.1875 4.44167 3.58333 5.16667 3.1 6Z" fill="#6B7280" />
  </svg>
);

const PeopleIcon = () => (
  <svg width="22" height="16" viewBox="0 0 22 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
    <path d="M0 16V13.2C0 12.6333 0.145833 12.1125 0.4375 11.6375C0.729167 11.1625 1.11667 10.8 1.6 10.55C2.63333 10.0333 3.68333 9.64583 4.75 9.3875C5.81667 9.12917 6.9 9 8 9C9.1 9 10.1833 9.12917 11.25 9.3875C12.3167 9.64583 13.3667 10.0333 14.4 10.55C14.8833 10.8 15.2708 11.1625 15.5625 11.6375C15.8542 12.1125 16 12.6333 16 13.2V16H0ZM18 16V13C18 12.2667 17.7958 11.5625 17.3875 10.8875C16.9792 10.2125 16.4 9.63333 15.65 9.15C16.5 9.25 17.3 9.42083 18.05 9.6625C18.8 9.90417 19.5 10.2 20.15 10.55C20.75 10.8833 21.2083 11.2542 21.525 11.6625C21.8417 12.0708 22 12.5167 22 13V16H18ZM8 8C6.9 8 5.95833 7.60833 5.175 6.825C4.39167 6.04167 4 5.1 4 4C4 2.9 4.39167 1.95833 5.175 1.175C5.95833 0.391667 6.9 0 8 0C9.1 0 10.0417 0.391667 10.825 1.175C11.6083 1.95833 12 2.9 12 4C12 5.1 11.6083 6.04167 10.825 6.825C10.0417 7.60833 9.1 8 8 8ZM18 4C18 5.1 17.6083 6.04167 16.825 6.825C16.0417 7.60833 15.1 8 14 8C13.8167 8 13.5833 7.97917 13.3 7.9375C13.0167 7.89583 12.7833 7.85 12.6 7.8C13.05 7.26667 13.3958 6.675 13.6375 6.025C13.8792 5.375 14 4.7 14 4C14 3.3 13.8792 2.625 13.6375 1.975C13.3958 1.325 13.05 0.733333 12.6 0.2C12.8333 0.116667 13.0667 0.0625 13.3 0.0375C13.5333 0.0125 13.7667 0 14 0C15.1 0 16.0417 0.391667 16.825 1.175C17.6083 1.95833 18 2.9 18 4ZM2 14H14V13.2C14 13.0167 13.9542 12.85 13.8625 12.7C13.7708 12.55 13.65 12.4333 13.5 12.35C12.6 11.9 11.6917 11.5625 10.775 11.3375C9.85833 11.1125 8.93333 11 8 11C7.06667 11 6.14167 11.1125 5.225 11.3375C4.30833 11.5625 3.4 11.9 2.5 12.35C2.35 12.4333 2.22917 12.55 2.1375 12.7C2.04583 12.85 2 13.0167 2 13.2V14ZM8 6C8.55 6 9.02083 5.80417 9.4125 5.4125C9.80417 5.02083 10 4.55 10 4C10 3.45 9.80417 2.97917 9.4125 2.5875C9.02083 2.19583 8.55 2 8 2C7.45 2 6.97917 2.19583 6.5875 2.5875C6.19583 2.97917 6 3.45 6 4C6 4.55 6.19583 5.02083 6.5875 5.4125C6.97917 5.80417 7.45 6 8 6Z" fill="#4A6741" />
  </svg>
);

const SearchIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M16.6 18L10.3 11.7C9.8 12.1 9.225 12.4167 8.575 12.65C7.925 12.8833 7.23333 13 6.5 13C4.68333 13 3.14583 12.3708 1.8875 11.1125C0.629167 9.85417 0 8.31667 0 6.5C0 4.68333 0.629167 3.14583 1.8875 1.8875C3.14583 0.629167 4.68333 0 6.5 0C8.31667 0 9.85417 0.629167 11.1125 1.8875C12.3708 3.14583 13 4.68333 13 6.5C13 7.23333 12.8833 7.925 12.65 8.575C12.4167 9.225 12.1 9.8 11.7 10.3L18 16.6L16.6 18ZM6.5 11C7.75 11 8.8125 10.5625 9.6875 9.6875C10.5625 8.8125 11 7.75 11 6.5C11 5.25 10.5625 4.1875 9.6875 3.3125C8.8125 2.4375 7.75 2 6.5 2C5.25 2 4.1875 2.4375 3.3125 3.3125C2.4375 4.1875 2 5.25 2 6.5C2 7.75 2.4375 8.8125 3.3125 9.6875C4.1875 10.5625 5.25 11 6.5 11Z" fill="#6B7280" />
  </svg>
);

type LocationType = "physical" | "video" | "globe";

interface EventData {
  id: number;
  title: string;
  image: string;
  badge: "OFFLINE" | "ONLINE";
  badgeOnline: boolean;
  date: string;
  location: string;
  locationType: LocationType;
  participants: number;
  isFull: boolean;
  category: string;
  status: string;
  startTime: Date;
  endTime: Date;
}

interface EventOut {
  event_id: number;
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  location: string;
  category: string | null;
  status: string;
  registered_count: number;
  is_full: boolean;
  is_registered: boolean;
  organizer: { user_id: number; full_name: string; avatar_url?: string };
  image_url?: string | null;
}

interface UserOut {
  user_id: number;
  role: string;
}

import { getImageUrl } from "@/lib/utils";

function mapEventOut(event: EventOut): EventData & { organizer_id: number } {
  const isOnline = event.location?.toLowerCase().includes("online") ||
    event.location?.toLowerCase().includes("zoom") ||
    event.location?.toLowerCase().includes("meet");
  const date = event.start_time
    ? new Date(event.start_time).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    })
    : "";
  const EVENT_IMAGE_MAP: Record<string, string> = {
    "Lễ hội hoa anh đào": "/static/events/lehoianhdao.png",
    "桜祭り": "/static/events/lehoianhdao.png",
    "Học làm Sushi": "/static/events/hoclamsushi.png",
    "寿司作り体験": "/static/events/hoclamsushi.png",
    "Bóng đá cộng đồng": "/static/events/bongdacongdong.png",
    "コミュニティサッカー": "/static/events/bongdacongdong.png",
    "Tiếng Nhật giao tiếp": "/static/events/tiengnhatgiaotiep.png",
    "日本語会話交流会": "/static/events/tiengnhatgiaotiep.png",
    "Triển lãm Manga": "/static/events/trienlammanga.png",
    "マンガ展": "/static/events/trienlammanga.png",
    "Đêm nhạc Trịnh": "/static/events/demnhactrinh.png",
    "トリン・コン・ソン音楽の夕べ": "/static/events/demnhactrinh.png",
    "Leo núi Phú Sĩ": "/static/events/leonuiphusi.png",
    "富士山登山": "/static/events/leonuiphusi.png",
    "Giao lưu J-Pop": "/static/events/giaoluujpop.png",
    "J-POP交流会": "/static/events/giaoluujpop.png",
    "Hùng biện tiếng Nhật": "/static/events/hungbientiengnhat.png",
    "日本語スピーチコンテスト": "/static/events/hungbientiengnhat.png",
    "Offline fan anime": "/static/events/offlinefananime.png",
    "アニメファンオフ会": "/static/events/offlinefananime.png",
    "Hội thảo du học": "/static/events/hoithaoduhoc.png",
    "留学セミナー": "/static/events/hoithaoduhoc.png",
    "Tiệc trà đạo": "/static/events/tiectradao.png",
    "茶道体験会": "/static/events/tiectradao.png",
    "Ngày hội việc làm IT": "/static/events/ngayhoivieclamit.png",
    "ITキャリアフェア": "/static/events/ngayhoivieclamit.png",
    "Workshop Thư pháp": "/static/events/workshopthuphap.png",
    "書道ワークショップ": "/static/events/workshopthuphap.png",
    "Cắm hoa Ikebana": "/static/events/camhoaikebana.png",
    "生け花体験": "/static/events/camhoaikebana.png"
  };

  const fallbackImage = EVENT_IMAGE_MAP[event.title] || "/static/events/lehoianhdao.png";
  const isUnsplash = !event.image_url || event.image_url.includes("unsplash.com");
  const finalImage = isUnsplash ? fallbackImage : event.image_url;

  return {
    id: event.event_id,
    title: event.title,
    image: getImageUrl(finalImage, ""),
    badge: isOnline ? "ONLINE" : "OFFLINE",
    badgeOnline: isOnline,
    date,
    location: event.location,
    locationType: isOnline ? "video" : "physical",
    participants: event.registered_count,
    isFull: event.is_full,
    category: event.category || "Khác",
    status: event.status,
    startTime: new Date(event.start_time.endsWith('Z') ? event.start_time : event.start_time + 'Z'),
    endTime: new Date(event.end_time.endsWith('Z') ? event.end_time : event.end_time + 'Z'),
    organizer_id: event.organizer.user_id,
  };
}

function LocationIcon({ type }: { type: LocationType }) {
  if (type === "video") return <VideoIcon />;
  if (type === "globe") return <GlobeIcon />;
  return <LocationPinIcon />;
}

function EventCard({ event, currentUserId }: { event: EventData & { organizer_id: number }, currentUserId?: number }) {
  const { t } = useTranslation();
  const badgeText = event.badge === "ONLINE" ? t("events.online") : t("events.offline");
  const isOrganizer = currentUserId === event.organizer_id;
  return (
    <div className="flex flex-col rounded-2xl border border-wc-border bg-white overflow-hidden hover:shadow-lg transition-shadow">
      <Link to={`/events/${event.id}`} className="flex flex-col flex-1">
        <div className="relative h-48 overflow-hidden bg-[#F6F3F5]">
          <img
            src={event.image}
            alt={event.title}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.onerror = null; // Prevent infinite loop if fallback also fails
              target.src = "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&h=200&fit=crop";
            }}
            className="w-full h-full object-cover transition-transform hover:scale-105 duration-500"
          />
          <div
            className={`absolute top-3 left-3 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${event.badgeOnline
                ? "bg-wc-green text-white"
                : "bg-white/90 text-wc-dark backdrop-blur-sm shadow-sm"
              }`}
          >
            {badgeText}
          </div>
        </div>

        <div className="flex flex-col flex-1 p-4">
          <h3 className="text-[18px] font-bold text-wc-dark leading-7 mb-2 hover:text-wc-green transition-colors">
            {t(`eventTitles.${event.title}`, { defaultValue: event.title })}
          </h3>

          <div className="flex flex-col gap-2 flex-1">
            <div className="flex items-center gap-2">
              <CalendarIcon />
              <span className="text-xs text-wc-gray leading-4">{event.date}</span>
            </div>
            <div className="flex items-center gap-2">
              <LocationIcon type={event.locationType} />
              <span className="text-xs text-wc-gray leading-4 truncate">{t(`locations.${event.location}`, { defaultValue: event.location })}</span>
            </div>
          </div>
        </div>
      </Link>

      <div className="p-4 pt-0">
        <div className="flex items-center justify-between pt-3 mt-auto border-t border-slate-50">
          <div className="flex items-center gap-1.5 bg-wc-light rounded-lg px-2 py-1">
            <PeopleIcon />
            <span className="text-xs font-bold text-wc-green">{event.participants}</span>
          </div>
          {isOrganizer ? (
            <Link
              to={`/events/${event.id}`}
              className="px-3 py-1 rounded-full border border-wc-dark text-xs font-bold text-wc-dark hover:bg-slate-100 transition-colors"
            >
              {t("events.manage")}
            </Link>
          ) : event.isFull ? (
            <button disabled className="px-3 py-1 rounded-full border border-gray-300 text-xs font-bold text-gray-400 cursor-not-allowed">
              {t("events.full")}
            </button>
          ) : (
            <Link
              to={`/events/${event.id}`}
              className="px-3 py-1 rounded-full border border-wc-green text-xs font-bold text-wc-green hover:bg-wc-light transition-colors"
            >
              {t("events.join")}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Index() {
  const { t } = useTranslation();
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    search: "",
    category: "all",
    status: "all"
  });

  const { data: user } = useQuery({
    queryKey: ["me"],
    queryFn: () => apiFetch<UserOut>("/api/v1/users/me"),
  });

  const { data: apiEvents, isLoading, isError } = useQuery({
    queryKey: ["events"],
    queryFn: () => apiFetch<EventOut[]>("/api/v1/events"),
  });

  const events = (apiEvents ?? []).map(mapEventOut);

  const filteredEvents = events.filter(event => {
    // 1. Filter by search
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const matchesSearch =
        event.title.toLowerCase().includes(searchLower) ||
        event.location.toLowerCase().includes(searchLower);
      if (!matchesSearch) return false;
    }

    // 2. Filter by category
    if (filters.category !== "all") {
      if (event.category !== filters.category) return false;
    }

    // 3. Filter by status
    if (filters.status !== "all") {
      const now = new Date();
      const statusUpper = event.status?.toUpperCase();
      if (filters.status === "open") {
        if (statusUpper !== "UPCOMING" || now >= event.startTime || event.isFull) return false;
      } else if (filters.status === "ongoing") {
        if (statusUpper === "CANCELLED" || now < event.startTime || now > event.endTime) return false;
      } else if (filters.status === "closed") {
        const isEnded = (statusUpper === "CLOSED" || statusUpper === "ENDED" || statusUpper === "FINISHED" || now > event.endTime || event.isFull) && statusUpper !== "CANCELLED";
        if (!isEnded) return false;
      } else if (filters.status === "cancelled") {
        if (statusUpper !== "CANCELLED") return false;
      }
    }

    return true;
  });

  return (
    <div className="min-h-screen bg-wc-bg font-inter">
      <Navbar />

      <main className="max-w-[1280px] mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-black text-wc-dark uppercase tracking-tight leading-9">
              {t("events.exploreEvents")}
            </h1>
            <p className="text-base font-medium text-wc-gray">
              {t("events.meetConnect")}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {user?.role === "ORGANIZER" && (
              <></>
            )}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all shrink-0 font-semibold text-sm ${showFilters
                  ? "bg-wc-dark text-white border-wc-dark shadow-md"
                  : "border-wc-border bg-white text-wc-dark hover:bg-wc-bg"
                }`}
            >
              <svg width="18" height="12" viewBox="0 0 18 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M7 12V10H11V12H7ZM3 7V5H15V7H3ZM0 2V0H18V2H0Z" fill="currentColor" />
              </svg>
              {t("events.filter")}
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        {showFilters && (
          <div className="bg-white p-6 rounded-2xl border border-wc-border mb-8 shadow-sm animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Search */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-wc-gray uppercase tracking-wider">{t("events.search")}</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder={t("events.searchPlaceholder")}
                    value={filters.search}
                    onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
                    className="w-full pl-10 pr-4 py-2.5 bg-wc-bg border-none rounded-xl text-sm focus:ring-2 focus:ring-wc-green/20 transition-all"
                  />
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 opacity-40">
                    <SearchIcon />
                  </div>
                </div>
              </div>

              {/* Category */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-wc-gray uppercase tracking-wider">{t("events.category")}</label>
                <select
                  value={filters.category}
                  onChange={(e) => setFilters((prev) => ({ ...prev, category: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-wc-bg border-none rounded-xl text-sm focus:ring-2 focus:ring-wc-green/20 transition-all appearance-none cursor-pointer"
                >
                  <option value="all">{t("events.categoryAll")}</option>
                  <option value="Giao lưu Ngôn ngữ & Văn hóa">{t("eventCategories.Giao lưu Ngôn ngữ & Văn hóa", { defaultValue: "Giao lưu Ngôn ngữ & Văn hóa" })}</option>
                  <option value="Ẩm thực & Đời sống">{t("eventCategories.Ẩm thực & Đời sống", { defaultValue: "Ẩm thực & Đời sống" })}</option>
                  <option value="Thể thao & Giải trí">{t("eventCategories.Thể thao & Giải trí", { defaultValue: "Thể thao & Giải trí" })}</option>
                  <option value="Nghệ thuật & Sáng tạo">{t("eventCategories.Nghệ thuật & Sáng tạo", { defaultValue: "Nghệ thuật & Sáng tạo" })}</option>
                  <option value="Công nghệ & Thiết kế">{t("eventCategories.Công nghệ & Thiết kế", { defaultValue: "Công nghệ & Thiết kế" })}</option>
                  <option value="Sự nghiệp & Networking">{t("eventCategories.Sự nghiệp & Networking", { defaultValue: "Sự nghiệp & Networking" })}</option>
                  <option value="Khác">{t("eventCategories.Khác", { defaultValue: "Khác" })}</option>
                </select>
              </div>

              {/* Status */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-wc-gray uppercase tracking-wider">{t("events.status")}</label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-wc-bg border-none rounded-xl text-sm focus:ring-2 focus:ring-wc-green/20 transition-all appearance-none cursor-pointer"
                >
                  <option value="all">{t("events.statusAll")}</option>
                  <option value="open">{t("events.statusOpen")}</option>
                  <option value="ongoing">{t("events.statusOngoing")}</option>
                  <option value="closed">{t("events.statusClosed")}</option>
                  <option value="cancelled">{t("events.statusCancelled")}</option>
                </select>
              </div>
            </div>

            {/* Clear filters button */}
            {(filters.search || filters.category !== "all" || filters.status !== "all") && (
              <div className="flex justify-end mt-4">
                <button
                  onClick={() => setFilters({ search: "", category: "all", status: "all" })}
                  className="text-xs font-bold text-wc-green hover:underline"
                >
                  {t("events.clearFilters")}
                </button>
              </div>
            )}
          </div>
        )}

        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-wc-green border-t-transparent rounded-full animate-spin" />
            <span className="ml-3 text-sm text-wc-gray">{t("events.loading")}</span>
          </div>
        )}
        {isError && (
          <p className="text-center text-red-500 py-10">{t("events.loadError")}</p>
        )}
        {!isLoading && !isError && (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
            {filteredEvents.map((event) => (
              <EventCard key={event.id} event={event} currentUserId={user?.user_id} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
