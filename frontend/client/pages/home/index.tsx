import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "react-i18next";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { getFriendSuggestions, sendFriendRequest } from "@/lib/friendsApi";
import { getImageUrl } from "@/lib/utils";
const NAV_LINKS = [
  {
    label: "Trang chủ",
    href: "/",
    active: true,
    icon: (
      <svg width="14" height="15" viewBox="0 0 14 15" fill="none">
        <path
          d="M1.66667 13.3333H4.16667V8.33333H9.16667V13.3333H11.6667V5.83333L6.66667 2.08333L1.66667 5.83333V13.3333ZM0 15V5L6.66667 0L13.3333 5V15H7.5V10H5.83333V15H0Z"
          fill="#4A6741"
        />
      </svg>
    ),
  },
  {
    label: "Bạn bè",
    href: "/friends",
    active: false,
    icon: (
      <svg width="20" height="15" viewBox="0 0 20 15" fill="none">
        <path
          d="M0 13.3333V11C0 10.5278 0.121528 10.0938 0.364583 9.69792C0.607639 9.30208 0.930556 9 1.33333 8.79167C2.19444 8.36111 3.06944 8.03819 3.95833 7.82292C4.84722 7.60764 5.75 7.5 6.66667 7.5C7.58333 7.5 8.48611 7.60764 9.375 7.82292C10.2639 8.03819 11.1389 8.36111 12 8.79167C12.4028 9 12.7257 9.30208 12.9688 9.69792C13.2118 10.0938 13.3333 10.5278 13.3333 11V13.3333H0ZM15 13.3333V10.8333C15 10.2222 14.8299 9.63542 14.4896 9.07292C14.1493 8.51042 13.6667 8.02778 13.0417 7.625C13.75 7.70833 14.4167 7.85069 15.0417 8.05208C15.6667 8.25347 16.25 8.5 16.7917 8.79167C17.2917 9.06944 17.6736 9.37847 17.9375 9.71875C18.2014 10.059 18.3333 10.4306 18.3333 10.8333V13.3333H15ZM6.66667 6.66667C5.75 6.66667 4.96528 6.34028 4.3125 5.6875C3.65972 5.03472 3.33333 4.25 3.33333 3.33333C3.33333 2.41667 3.65972 1.63194 4.3125 0.979167C4.96528 0.326389 5.75 0 6.66667 0C7.58333 0 8.36806 0.326389 9.02083 0.979167C9.67361 1.63194 10 2.41667 10 3.33333C10 4.25 9.67361 5.03472 9.02083 5.6875C8.36806 6.34028 7.58333 6.66667 6.66667 6.66667ZM15 3.33333C15 4.25 14.6736 5.03472 14.0208 5.6875C13.3681 6.34028 12.5833 6.66667 11.6667 6.66667C11.5139 6.66667 11.3194 6.64931 11.0833 6.61458C10.8472 6.57986 10.6528 6.54167 10.5 6.5C10.875 6.05556 11.1632 5.5625 11.3646 5.02083C11.566 4.47917 11.6667 3.91667 11.6667 3.33333C11.6667 2.75 11.566 2.1875 11.3646 1.64583C11.1632 1.10417 10.875 0.611111 10.5 0.166667C10.6944 0.0972222 10.8889 0.0520833 11.0833 0.03125C11.2778 0.0104167 11.4722 0 11.6667 0C12.5833 0 13.3681 0.326389 14.0208 0.979167C14.6736 1.63194 15 2.41667 15 3.33333ZM1.66667 11.6667H11.6667V11C11.6667 10.8472 11.6285 10.7083 11.5521 10.5833C11.4757 10.4583 11.375 10.3611 11.25 10.2917C10.5 9.91667 9.74306 9.63542 8.97917 9.44792C8.21528 9.26042 7.44444 9.16667 6.66667 9.16667C5.88889 9.16667 5.11806 9.26042 4.35417 9.44792C3.59028 9.63542 2.83333 9.91667 2.08333 10.2917C1.95833 10.3611 1.85764 10.4583 1.78125 10.5833C1.70486 10.7083 1.66667 10.8472 1.66667 11V11.6667ZM6.66667 5C7.125 5 7.51736 4.83681 7.84375 4.51042C8.17014 4.18403 8.33333 3.79167 8.33333 3.33333C8.33333 2.875 8.17014 2.48264 7.84375 2.15625C7.51736 1.82986 7.125 1.66667 6.66667 1.66667C6.20833 1.66667 5.81597 1.82986 5.48958 2.15625C5.16319 2.48264 5 2.875 5 3.33333C5 3.79167 5.16319 4.18403 5.48958 4.51042C5.81597 4.83681 6.20833 5 6.66667 5Z"
          fill="#6B7280"
        />
      </svg>
    ),
  },
  {
    label: "Trò chuyện",
    href: "/chat",
    active: false,
    icon: (
      <svg width="17" height="17" viewBox="0 0 17 17" fill="none">
        <path
          d="M0 16.6667V1.66667C0 1.20833 0.163194 0.815972 0.489583 0.489583C0.815972 0.163194 1.20833 0 1.66667 0H15C15.4583 0 15.8507 0.163194 16.1771 0.489583C16.5035 0.815972 16.6667 1.20833 16.6667 1.66667V11.6667C16.6667 12.125 16.5035 12.5174 16.1771 12.8438C15.8507 13.1701 15.4583 13.3333 15 13.3333H3.33333L0 16.6667ZM2.625 11.6667H15V1.66667H1.66667V12.6042L2.625 11.6667Z"
          fill="#6B7280"
        />
      </svg>
    ),
  },
  {
    label: "Sự kiện",
    href: "/events",
    active: false,
    icon: (
      <svg width="15" height="17" viewBox="0 0 15 17" fill="none">
        <path
          d="M1.66667 16.6667C1.20833 16.6667 0.815972 16.5035 0.489583 16.1771C0.163194 15.8507 0 15.4583 0 15V3.33333C0 2.875 0.163194 2.48264 0.489583 2.15625C0.815972 1.82986 1.20833 1.66667 1.66667 1.66667H2.5V0H4.16667V1.66667H10.8333V0H12.5V1.66667H13.3333C13.7917 1.66667 14.184 1.82986 14.5104 2.15625C14.8368 2.48264 15 2.875 15 3.33333V15C15 15.4583 14.8368 15.8507 14.5104 16.1771C14.184 16.5035 13.7917 16.6667 13.3333 16.6667H1.66667ZM1.66667 15H13.3333V6.66667H1.66667V15ZM1.66667 5H13.3333V3.33333H1.66667V5Z"
          fill="#6B7280"
        />
      </svg>
    ),
  },
  {
    label: "Trò chơi",
    href: "/games",
    active: false,
    icon: (
      <svg width="17" height="12" viewBox="0 0 17 12" fill="none">
        <path
          d="M2.1125 11.6667C1.40417 11.6667 0.855556 11.4201 0.466667 10.9271C0.0777778 10.434 -0.0680556 9.83333 0.0291667 9.125L0.904167 2.875C1.02917 2.04167 1.40069 1.35417 2.01875 0.8125C2.63681 0.270833 3.3625 0 4.19583 0H12.4458C13.2792 0 14.0049 0.270833 14.6229 0.8125C15.241 1.35417 15.6125 2.04167 15.7375 2.875L16.6125 9.125C16.7097 9.83333 16.5639 10.434 16.175 10.9271C15.7861 11.4201 15.2375 11.6667 14.5292 11.6667C14.2375 11.6667 13.9667 11.6146 13.7167 11.5104C13.4667 11.4062 13.2375 11.25 13.0292 11.0417L11.1542 9.16667H5.4875L3.6125 11.0417C3.40417 11.25 3.175 11.4062 2.925 11.5104C2.675 11.6146 2.40417 11.6667 2.1125 11.6667ZM4.77917 6.66667H6.02917V5.20833H7.4875V3.95833H6.02917V2.5H4.77917V3.95833H3.32083V5.20833H4.77917V6.66667ZM12.4875 6.66667C12.7236 6.66667 12.9215 6.58681 13.0813 6.42708C13.241 6.26736 13.3208 6.06944 13.3208 5.83333C13.3208 5.59722 13.241 5.39931 13.0813 5.23958C12.9215 5.07986 12.7236 5 12.4875 5C12.2514 5 12.0535 5.07986 11.8938 5.23958C11.734 5.39931 11.6542 5.59722 11.6542 5.83333C11.6542 6.06944 11.734 6.26736 11.8938 6.42708C12.0535 6.58681 12.2514 6.66667 12.4875 6.66667ZM10.8208 4.16667C11.0569 4.16667 11.2549 4.08681 11.4146 3.92708C11.5743 3.76736 11.6542 3.56944 11.6542 3.33333C11.6542 3.09722 11.5743 2.89931 11.4146 2.73958C11.2549 2.57986 11.0569 2.5 10.8208 2.5C10.5847 2.5 10.3868 2.57986 10.2271 2.73958C10.0674 2.89931 9.9875 3.09722 9.9875 3.33333C9.9875 3.56944 10.0674 3.76736 10.2271 3.92708C10.3868 4.08681 10.5847 4.16667 10.8208 4.16667Z"
          fill="#6B7280"
        />
      </svg>
    ),
  },
];

const AddFriendIcon = () => (
  <svg width="17" height="12" viewBox="0 0 17 12" fill="none">
    <path
      d="M12.75 7.5V5.25H10.5V3.75H12.75V1.5H14.25V3.75H16.5V5.25H14.25V7.5H12.75ZM6 6C5.175 6 4.46875 5.70625 3.88125 5.11875C3.29375 4.53125 3 3.825 3 3C3 2.175 3.29375 1.46875 3.88125 0.88125C4.46875 0.29375 5.175 0 6 0C6.825 0 7.53125 0.29375 8.11875 0.88125C8.70625 1.46875 9 2.175 9 3C9 3.825 8.70625 4.53125 8.11875 5.11875C7.53125 5.70625 6.825 6 6 6ZM0 12V9.9C0 9.475 0.109375 9.08437 0.328125 8.72812C0.546875 8.37187 0.8375 8.1 1.2 7.9125C1.975 7.525 2.7625 7.23438 3.5625 7.04063C4.3625 6.84688 5.175 6.75 6 6.75C6.825 6.75 7.6375 6.84688 8.4375 7.04063C9.2375 7.23438 10.025 7.525 10.8 7.9125C11.1625 8.1 11.4531 8.37187 11.6719 8.72812C11.8906 9.08437 12 9.475 12 9.9V12H0ZM1.5 10.5H10.5V9.9C10.5 9.7625 10.4656 9.6375 10.3969 9.525C10.3281 9.4125 10.2375 9.325 10.125 9.2625C9.45 8.925 8.76875 8.67188 8.08125 8.50313C7.39375 8.33438 6.7 8.25 6 8.25C5.3 8.25 4.60625 8.33438 3.91875 8.50313C3.23125 8.67188 2.55 8.925 1.875 9.2625C1.7625 9.325 1.67188 9.4125 1.60312 9.525C1.53437 9.6375 1.5 9.7625 1.5 9.9V10.5ZM6 4.5C6.4125 4.5 6.76562 4.35312 7.05937 4.05937C7.35312 3.76562 7.5 3.4125 7.5 3C7.5 2.5875 7.35312 2.23438 7.05937 1.94062C6.76562 1.64687 6.4125 1.5 6 1.5C5.5875 1.5 5.23438 1.64687 4.94063 1.94062C4.64688 2.23438 4.5 2.5875 4.5 3C4.5 3.4125 4.64688 3.76562 4.94063 4.05937C5.23438 4.35312 5.5875 4.5 6 4.5Z"
      fill="#4A6741"
    />
  </svg>
);

const LocationIcon = () => (
  <svg width="10" height="12" viewBox="0 0 10 12" fill="none" className="shrink-0">
    <path
      d="M4.66667 5.83333C4.9875 5.83333 5.26215 5.7191 5.49062 5.49062C5.7191 5.26215 5.83333 4.9875 5.83333 4.66667C5.83333 4.34583 5.7191 4.07118 5.49062 3.84271C5.26215 3.61424 4.9875 3.5 4.66667 3.5C4.34583 3.5 4.07118 3.61424 3.84271 3.84271C3.61424 4.07118 3.5 4.34583 3.5 4.66667C3.5 4.9875 3.61424 5.26215 3.84271 5.49062C4.07118 5.7191 4.34583 5.83333 4.66667 5.83333ZM4.66667 10.1208C5.85278 9.03194 6.73264 8.04271 7.30625 7.15312C7.87986 6.26354 8.16667 5.47361 8.16667 4.78333C8.16667 3.72361 7.82882 2.8559 7.15312 2.18021C6.47743 1.50451 5.64861 1.16667 4.66667 1.16667C3.68472 1.16667 2.8559 1.50451 2.18021 2.18021C1.50451 2.8559 1.16667 3.72361 1.16667 4.78333C1.16667 5.47361 1.45347 6.26354 2.02708 7.15312C2.60069 8.04271 3.48056 9.03194 4.66667 10.1208ZM4.66667 11.6667C3.10139 10.3347 1.93229 9.09757 1.15937 7.95521C0.386458 6.81285 0 5.75556 0 4.78333C0 3.325 0.469097 2.16319 1.40729 1.29792C2.34549 0.432639 3.43194 0 4.66667 0C5.90139 0 6.98785 0.432639 7.92604 1.29792C8.86424 2.16319 9.33333 3.325 9.33333 4.78333C9.33333 5.75556 8.94688 6.81285 8.17396 7.95521C7.40104 9.09757 6.23194 10.3347 4.66667 11.6667Z"
      fill="#6B7280"
    />
  </svg>
);

const VideoIcon = () => (
  <svg width="12" height="10" viewBox="0 0 12 10" fill="none" className="shrink-0">
    <path
      d="M1.16667 9.33333C0.845833 9.33333 0.571181 9.2191 0.342708 8.99063C0.114236 8.76215 0 8.4875 0 8.16667V1.16667C0 0.845833 0.114236 0.571181 0.342708 0.342708C0.571181 0.114236 0.845833 0 1.16667 0H8.16667C8.4875 0 8.76215 0.114236 8.99063 0.342708C9.2191 0.571181 9.33333 0.845833 9.33333 1.16667V3.79167L11.6667 1.45833V7.875L9.33333 5.54167V8.16667C9.33333 8.4875 9.2191 8.76215 8.99063 8.99063C8.76215 9.2191 8.4875 9.33333 8.16667 9.33333H1.16667Z"
      fill="#6B7280"
    />
  </svg>
);

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

interface EventCardProps {
  id: number;
  image: string;
  badge: "OFFLINE" | "ONLINE";
  title: string;
  location: string;
  locationIcon?: "map" | "video";
  registeredCount: number;
  capacity: number;
  isRegistered: boolean;
  isFull: boolean;
  onJoinToggle: () => void;
  isPending: boolean;
}

function EventCard({
  id,
  image,
  badge,
  title,
  location,
  locationIcon = "map",
  registeredCount,
  capacity,
  isRegistered,
  isFull,
  onJoinToggle,
  isPending,
}: EventCardProps) {
  const { t } = useTranslation();
  const badgeText = badge === "OFFLINE" ? t("home.offline") : t("home.online");

  // Mock avatars based on registeredCount
  const mockAvatars = [
    "https://api.builder.io/api/v1/image/assets/TEMP/4ae07e25f49e1b0d128579d90522cadcd33102ea?width=40",
    "https://api.builder.io/api/v1/image/assets/TEMP/e649ba19346eb08e08b62bff6dff775beffd7b6e?width=40",
    "https://api.builder.io/api/v1/image/assets/TEMP/b6307a3da10d80972ce5a4c85d2a120940da9f28?width=40",
  ];

  const displayedAvatarsCount = Math.min(registeredCount, 3);
  const attendees = Array.from({ length: displayedAvatarsCount }).map((_, i) => ({
    src: mockAvatars[i % mockAvatars.length],
  }));
  const extraCount = registeredCount > 3 ? registeredCount - 3 : 0;

  return (
    <div className="flex h-40 items-stretch rounded-2xl border border-[#E2E8E2] bg-white overflow-hidden hover:shadow-md transition-shadow">
      <Link to={`/events/${id}`} className="relative w-[130px] shrink-0 overflow-hidden bg-[#F6F3F5]">
        <img
          src={image}
          alt={title}
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.onerror = null;
            target.src = "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&h=200&fit=crop";
          }}
          className="w-full h-full object-cover transition-transform hover:scale-105 duration-300"
        />
        <div className="absolute top-2 left-2 flex items-center px-2 py-0.5 rounded backdrop-blur-sm border border-white/10 bg-[rgba(45,58,58,0.6)]">
          <span className="text-white text-[8px] font-bold uppercase tracking-[0.4px]">{badgeText}</span>
        </div>
      </Link>
      <div className="flex flex-col justify-between flex-1 p-4 min-w-0">
        <Link to={`/events/${id}`} className="block group">
          <p className="text-[#2D3A3A] text-[14px] font-bold leading-[1.375] mb-1 line-clamp-2 group-hover:text-[#4A6741] transition-colors">{title}</p>
          <div className="flex items-center gap-1 text-[#6B7280]">
            {locationIcon === "map" ? <LocationIcon /> : <VideoIcon />}
            <span className="text-[10px] leading-[15px] truncate">{location}</span>
          </div>
        </Link>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            {attendees.map((a, i) => (
              <img
                key={i}
                src={a.src}
                alt=""
                className="w-5 h-5 rounded-full border border-white object-cover"
                style={{ marginLeft: i === 0 ? 0 : "-6px", zIndex: attendees.length - i }}
              />
            ))}
            {extraCount > 0 && (
              <div
                className="w-5 h-5 rounded-full border border-white bg-[#F1F5F9] flex items-center justify-center text-[7px] font-bold text-[#6B7280]"
                style={{ marginLeft: "-6px" }}
              >
                +{extraCount}
              </div>
            )}
          </div>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onJoinToggle();
            }}
            disabled={isPending || (isFull && !isRegistered)}
            className={`flex items-center justify-center px-3 py-1 rounded border transition-colors text-[9px] font-bold uppercase tracking-wide ${isRegistered
                ? "bg-red-50 border-red-200 text-red-600 hover:bg-red-100"
                : isFull
                  ? "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed"
                  : "border-[rgba(74,103,65,0.2)] bg-[#F1F5F0] text-[#4A6741] hover:bg-[#E2EBE0]"
              }`}
          >
            {isPending
              ? t("events.processing") || "..."
              : isRegistered
                ? t("events.cancelRegistration") || "Huỷ"
                : isFull
                  ? t("events.full") || "Hết chỗ"
                  : t("home.join") || "Tham gia"}
          </button>
        </div>
      </div>
    </div>
  );
}

interface FriendSuggestionProps {
  userId: number;
  avatar: string;
  matchPercent: number;
  name: string;
  meta: string;
  tags: string[];
  onAdd: () => void;
  isPending: boolean;
}

function FriendSuggestion({ userId, avatar, matchPercent, name, meta, tags, onAdd, isPending }: FriendSuggestionProps) {
  return (
    <div className="flex items-center gap-4">
      <Link to={`/profile/${userId}`} className="relative shrink-0">
        <img src={avatar} alt={name} className="w-14 h-14 rounded-full shadow-[0_0_0_2px_#F1F5F9] object-cover" />
        <div className="absolute -bottom-1 -right-1 flex items-center px-1.5 py-0.5 rounded-full border-2 border-white bg-[#4A6741]">
          <span className="text-white text-[8px] font-bold leading-3">{matchPercent}%</span>
        </div>
      </Link>
      <div className="flex-1 min-w-0">
        <Link to={`/profile/${userId}`} className="hover:text-wc-green transition-colors">
          <p className="text-[#2D3A3A] text-[14px] font-bold leading-5 truncate">{name}</p>
        </Link>
        <p className="text-[#6B7280] text-[10px] leading-[15px]">{meta}</p>
        <div className="flex flex-wrap gap-1 mt-1">
          {tags.map((tag) => (
            <span key={tag} className="px-1.5 py-0.5 rounded bg-[#F1F5F9] text-[#6B7280] text-[8px] font-medium leading-3">
              {tag}
            </span>
          ))}
        </div>
      </div>
      <button
        onClick={onAdd}
        disabled={isPending}
        className="shrink-0 p-2 rounded-lg bg-[rgba(74,103,65,0.1)] hover:bg-[rgba(74,103,65,0.2)] transition-colors disabled:opacity-50"
      >
        <AddFriendIcon />
      </button>
    </div>
  );
}

export default function Index() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const { data: meData } = useQuery({
    queryKey: ["me"],
    queryFn: () => apiFetch<any>("/api/v1/users/me"),
  });

  const displayName = meData?.full_name?.trim() || user?.full_name?.trim() || t("home.defaultName", { defaultValue: "bạn" });

  useEffect(() => {
    if (user?.role === "ORGANIZER") {
      navigate("/organizer/events", { replace: true });
    } else if (user?.role === "admin") {
      navigate("/admin/events-management", { replace: true });
    }
  }, [user, navigate]);

  // Fetch real events from API (limit 4)
  const { data: apiEvents, isLoading: isLoadingEvents } = useQuery({
    queryKey: ["featured-events"],
    queryFn: () => apiFetch<EventOut[]>("/api/v1/events?page=1&page_size=4"),
  });

  // Toggle join mutation
  const toggleJoinMutation = useMutation({
    mutationFn: async ({ eventId, isRegistered }: { eventId: number; isRegistered: boolean }) => {
      const method = isRegistered ? "DELETE" : "POST";
      return apiFetch(`/api/v1/events/${eventId}/register`, { method });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["featured-events"] });
      queryClient.invalidateQueries({ queryKey: ["events"] });
    },
  });

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

  const featuredEvents = (apiEvents || []).map((e) => {
    const isOnline = e.location?.toLowerCase().includes("online") ||
      e.location?.toLowerCase().includes("zoom") ||
      e.location?.toLowerCase().includes("meet");

    const fallbackImage = EVENT_IMAGE_MAP[e.title] || "/static/events/lehoianhdao.png";

    const isUnsplash = !e.image_url || e.image_url.includes("unsplash.com");
    const finalImage = isUnsplash ? fallbackImage : e.image_url;

    return {
      id: e.event_id,
      image: getImageUrl(finalImage, ""),
      badge: (isOnline ? "ONLINE" : "OFFLINE") as "ONLINE" | "OFFLINE",
      title: t(`eventTitles.${e.title}`, { defaultValue: e.title }),
      location: t(`locations.${e.location}`, { defaultValue: e.location }),
      locationIcon: (isOnline ? "video" : "map") as "video" | "map",
      registeredCount: e.registered_count,
      capacity: e.capacity,
      isRegistered: e.is_registered,
      isFull: e.is_full,
    };
  });

  // Fetch friend suggestions from API
  const { data: suggestionsData } = useQuery({
    queryKey: ["friend-suggestions-home"],
    queryFn: getFriendSuggestions,
  });

  const sendRequestMutation = useMutation({
    mutationFn: (userId: number) => sendFriendRequest(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["friend-suggestions-home"] });
    },
  });

  const suggestions = (suggestionsData?.data ?? []).slice(0, 3).map((u) => ({
    userId: u.user_id,
    avatar: getImageUrl(u.avatar_url, "https://api.builder.io/api/v1/image/assets/TEMP/44f473e4387daf47f645da8834b4b9424a6c82d8?width=112"),
    matchPercent: Math.floor(60 + Math.random() * 38),
    name: u.full_name,
    meta: [u.japanese_level, t(`locations.${u.location}`, { defaultValue: u.location })].filter(Boolean).join(" • ") || "WeConnect",
    tags: u.hobbies.slice(0, 3).map(hobby => t(`hobbiesList.${hobby}`, { defaultValue: hobby })),
    onAdd: () => sendRequestMutation.mutate(u.user_id),
    isPending: sendRequestMutation.isPending && sendRequestMutation.variables === u.user_id,
  }));

  return (
    <div className="min-h-screen bg-[#F9FAF9] font-inter">
      <Navbar />

      {/* Main content */}
      <main className="max-w-[1280px] mx-auto px-6 py-6">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left column - 8/12 */}
          <div className="flex-1 min-w-0 flex flex-col gap-8">
            {/* Hero Banner */}
            <div className="relative rounded-2xl bg-[#2D3A3A] overflow-hidden min-h-[200px] flex flex-col justify-end p-10">
              {/* Background image */}
              <img
                src="https://api.builder.io/api/v1/image/assets/TEMP/57eb29f0c917d15aafcb79d8c183d017ff8e8457?width=1622"
                alt=""
                className="absolute inset-0 w-full h-full object-cover opacity-20"
              />
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#2D3A3A] via-[rgba(45,58,58,0.6)] to-transparent" />

              {/* Content */}
              <div className="relative z-10 flex flex-col gap-2">
                <div className="inline-flex self-start items-center px-2.5 py-1 rounded bg-[rgba(74,103,65,0.3)] backdrop-blur-md">
                  <span className="text-white text-[10px] font-bold uppercase tracking-[1px]">{t("home.welcomeBack")}</span>
                </div>
                <h1 className="text-white text-[30px] font-black leading-9 tracking-[-0.75px]">
                  {t("home.heroTitle", { name: displayName })}
                </h1>
                <p className="text-[#CBD5E1] text-[14px] font-light leading-[22.75px] max-w-xl">
                  {t("home.heroDescription")}
                </p>
              </div>
            </div>

            {/* Events Section */}
            <div className="flex flex-col gap-6">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-6 rounded-full bg-[#4A6741]" />
                  <h2 className="text-[#2D3A3A] text-[20px] font-bold leading-7">{t("home.featuredEvents")}</h2>
                </div>
                <p className="text-[#6B7280] text-[12px] leading-4 ml-4">{t("home.suggestionsTitle")}</p>
              </div>

              {isLoadingEvents ? (
                <div className="flex justify-center py-8 w-full col-span-2">
                  <div className="w-6 h-6 border-2 border-[#4A6741] border-t-transparent rounded-full animate-spin" />
                </div>
              ) : featuredEvents.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full">
                  {featuredEvents.map((event) => (
                    <EventCard
                      key={event.id}
                      {...event}
                      isPending={toggleJoinMutation.isPending && toggleJoinMutation.variables?.eventId === event.id}
                      onJoinToggle={() =>
                        toggleJoinMutation.mutate({
                          eventId: event.id,
                          isRegistered: event.isRegistered,
                        })
                      }
                    />
                  ))}
                </div>
              ) : (
                <p className="text-[#6B7280] text-xs italic ml-4 col-span-2">
                  {t("home.noFeaturedEvents", { defaultValue: "Chưa có sự kiện nổi bật nào." })}
                </p>
              )}
            </div>
          </div>

          {/* Right sidebar - 4/12 */}
          <div className="w-full lg:w-[340px] xl:w-[380px] shrink-0 flex flex-col gap-6">
            {/* Friend Suggestions */}
            <div className="rounded-2xl border border-[#E2E8E2] bg-white shadow-[0_1px_2px_0_rgba(0,0,0,0.05)] p-6 flex flex-col gap-6">
              <h3 className="text-[#2D3A3A] text-[18px] font-bold leading-7">{t("home.friendSuggestions")}</h3>
              <div className="flex flex-col gap-6">
                {suggestions.length > 0 ? suggestions.map((s) => (
                  <FriendSuggestion key={s.userId} {...s} />
                )) : (
                  <p className="text-[#6B7280] text-xs italic">{t("friends.noSuggestions")}</p>
                )}
              </div>
            </div>

            {/* Tip Card */}
            <div className="rounded-2xl border border-[rgba(74,103,65,0.2)] bg-[#F1F5F0] p-6 overflow-hidden relative">
              <div className="absolute -top-4 -right-4 w-16 h-16 rounded-full bg-[rgba(74,103,65,0.05)]" />
              <div className="relative flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <svg width="13" height="17" viewBox="0 0 13 17" fill="none">
                    <path
                      d="M6.25 16.6667C5.79167 16.6667 5.39931 16.5035 5.07292 16.1771C4.74653 15.8507 4.58333 15.4583 4.58333 15H7.91667C7.91667 15.4583 7.75347 15.8507 7.42708 16.1771C7.10069 16.5035 6.70833 16.6667 6.25 16.6667ZM2.91667 14.1667V12.5H9.58333V14.1667H2.91667ZM3.125 11.6667C2.16667 11.0972 1.40625 10.3333 0.84375 9.375C0.28125 8.41667 0 7.375 0 6.25C0 4.51389 0.607639 3.03819 1.82292 1.82292C3.03819 0.607639 4.51389 0 6.25 0C7.98611 0 9.46181 0.607639 10.6771 1.82292C11.8924 3.03819 12.5 4.51389 12.5 6.25C12.5 7.375 12.2188 8.41667 11.6562 9.375C11.0938 10.3333 10.3333 11.0972 9.375 11.6667H3.125ZM3.625 10H8.875C9.5 9.55556 9.98264 9.00694 10.3229 8.35417C10.6632 7.70139 10.8333 7 10.8333 6.25C10.8333 4.97222 10.3889 3.88889 9.5 3C8.61111 2.11111 7.52778 1.66667 6.25 1.66667C4.97222 1.66667 3.88889 2.11111 3 3C2.11111 3.88889 1.66667 4.97222 1.66667 6.25C1.66667 7 1.83681 7.70139 2.17708 8.35417C2.51736 9.00694 3 9.55556 3.625 10Z"
                      fill="#4A6741"
                    />
                  </svg>
                  <span className="text-[#4A6741] text-[14px] font-bold leading-5">{t("home.companionTip")}</span>
                </div>
                <p className="text-[#2D3A3A] text-[12px] italic leading-[19.5px] opacity-80">
                  {t("home.companionTipText")}
                </p>
                <Link
                  to="/profile"
                  className="text-[#4A6741] text-[10px] font-bold uppercase tracking-[0.5px] leading-[15px] hover:underline"
                >
                  {t("home.updateProfile")}
                </Link>
              </div>
            </div>

            {/* Community Quote */}
            <div className="rounded-2xl border border-[rgba(74,103,65,0.1)] bg-[#F0F4F0] shadow-[0_1px_2px_0_rgba(0,0,0,0.05)] p-6">
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2">
                  <svg width="13" height="9" viewBox="0 0 13 9" fill="none">
                    <path
                      d="M1.275 9L3 6C2.175 6 1.46875 5.70625 0.88125 5.11875C0.29375 4.53125 0 3.825 0 3C0 2.175 0.29375 1.46875 0.88125 0.88125C1.46875 0.29375 2.175 0 3 0C3.825 0 4.53125 0.29375 5.11875 0.88125C5.70625 1.46875 6 2.175 6 3C6 3.2875 5.96562 3.55312 5.89687 3.79688C5.82812 4.04063 5.725 4.275 5.5875 4.5L3 9H1.275ZM8.025 9L9.75 6C8.925 6 8.21875 5.70625 7.63125 5.11875C7.04375 4.53125 6.75 3.825 6.75 3C6.75 2.175 7.04375 1.46875 7.63125 0.88125C8.21875 0.29375 8.925 0 9.75 0C10.575 0 11.2812 0.29375 11.8687 0.88125C12.4562 1.46875 12.75 2.175 12.75 3C12.75 3.2875 12.7156 3.55312 12.6469 3.79688C12.5781 4.04063 12.475 4.275 12.3375 4.5L9.75 9H8.025Z"
                      fill="#4A6741"
                    />
                  </svg>
                  <span className="text-[#4A6741] text-[14px] font-bold leading-5">{t("home.communityQuote")}</span>
                </div>
                <div className="flex flex-col gap-4">
                  <p className="text-[#2D3A3A] text-[12px] italic font-medium leading-[19.5px]">
                    {t("home.quoteText")}
                  </p>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-[rgba(74,103,65,0.2)]" />
                    <span className="text-[#6B7280] text-[10px] leading-[15px]">{t("home.memberSince")}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
