import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import Pusher from "pusher-js";
import EmojiPicker, { type EmojiClickData } from "emoji-picker-react";
import Navbar from "@/components/Navbar";
import { API_BASE_URL } from "@/lib/api";
import { getAccessToken, getCurrentUser } from "@/lib/auth";
import {
  createOrGetConversation,
  getPusherConfig,
  listConversations,
  listMessages,
  markConversationRead,
  sendMessage as sendChatMessage,
  sendTypingStatus,
  translateMessage,
  uploadChatFile,
  type ChatConversation,
  type ChatMessage as ApiChatMessage,
} from "@/lib/chatApi";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { sendCallInvite } from "@/lib/videoApi";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Conversation {
  id: string;
  conversationId: number;
  participantId: number;
  name: string;
  avatar?: string;
  lastMessage: string;
  lastMessageId?: number;
  time: string;
  unreadCount: number;
  isOnline?: boolean;
  isActive?: boolean;
  isMine?: boolean;
}

interface Message {
  id: string;
  messageId: number;
  conversationId: number;
  senderId: number;
  from: "me" | "other";
  content: string;
  time: string;
  type: string;
  translation?: string;
  isJapanese?: boolean;
  isRead?: boolean;
}

interface SearchResult {
  id: string;
  name: string;
  level: string;
  levelTextColor: string;
  levelBg: string;
  relation: string;
  age: number;
  personality: string;
  avatar?: string;
}

const searchResults: SearchResult[] = [
  {
    id: "1",
    name: "Minh Anh (Hana)",
    level: "N2",
    levelTextColor: "text-[#4A6741]",
    levelBg: "bg-[#F1F5F0]",
    relation: "friends.friend",
    age: 24,
    personality: "Hướng ngoại",
    avatar:
      "https://api.builder.io/api/v1/image/assets/TEMP/26982b5d03d04105c9c8d651554b7c0e4f06b327?width=80",
  },
  {
    id: "2",
    name: "Nguyễn Nhật Minh",
    level: "N1",
    levelTextColor: "text-[#2563EB]",
    levelBg: "bg-[#EFF6FF]",
    relation: "Đồng nghiệp",
    age: 28,
    personality: "Điềm đạm",
  },
  {
    id: "3",
    name: "Minh Triết",
    level: "N3",
    levelTextColor: "text-[#EA580C]",
    levelBg: "bg-[#FFF7ED]",
    relation: "Gần đây",
    age: 20,
    personality: "Sáng tạo",
  },
  {
    id: "4",
    name: "Hoàng Minh Tâm",
    level: "Bản ngữ",
    levelTextColor: "text-[#9333EA]",
    levelBg: "bg-[#FAF5FF]",
    relation: "Khách hàng",
    age: 32,
    personality: "Chuyên nghiệp",
    avatar:
      "https://api.builder.io/api/v1/image/assets/TEMP/d47b11540b990b3a08f0348a2706340a9ec5a6be?width=80",
  },
  {
    id: "5",
    name: "Vũ Đức Minh",
    level: "N4",
    levelTextColor: "text-[#475569]",
    levelBg: "bg-[#F1F5F9]",
    relation: "Người mới",
    age: 19,
    personality: "Nhiệt tình",
  },
  {
    id: "6",
    name: "Minh Hằng",
    level: "N2",
    levelTextColor: "text-[#16A34A]",
    levelBg: "bg-[#F0FDF4]",
    relation: "Bạn bè",
    age: 25,
    personality: "Vui vẻ",
  },
];

const EMPTY_LAST_MESSAGE = "Chưa có tin nhắn";

function previewContent(content: string, type?: string): string {
  if (type === "GAME_INVITE") return "🎮 Lời mời vào phòng game";
  if (type === "FILE") return "📎 File đính kèm";
  if (type === "IMAGE") return "🖼️ Ảnh";
  return content;
}

function formatChatTime(value?: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const now = new Date();
  const sameDay = date.toDateString() === now.toDateString();
  if (sameDay) {
    return date.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) {
    return "Hôm qua";
  }

  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
  });
}

function containsJapanese(text: string): boolean {
  return /[\u3040-\u30ff\u3400-\u9fff]/.test(text);
}

function toConversation(data: ChatConversation, currentUserId: number | null): Conversation {
  const isMine = data.last_message?.sender_id === currentUserId;
  const lastMessage = data.last_message
    ? `${isMine ? "Bạn: " : ""}${previewContent(data.last_message.content, data.last_message.type)}`
    : EMPTY_LAST_MESSAGE;

  return {
    id: String(data.conversation_id),
    conversationId: data.conversation_id,
    participantId: data.participant.user_id,
    name: data.participant.full_name,
    avatar: data.participant.avatar_url ?? undefined,
    lastMessage,
    lastMessageId: data.last_message?.message_id,
    time: formatChatTime(data.last_message?.created_at ?? data.last_message_at ?? data.created_at),
    unreadCount: data.unread_count,
    isMine,
  };
}

function toMessage(data: ApiChatMessage, currentUserId: number | null): Message {
  return {
    id: String(data.message_id),
    messageId: data.message_id,
    conversationId: data.conversation_id,
    senderId: data.sender_id,
    from: data.sender_id === currentUserId ? "me" : "other",
    content: data.content,
    time: formatChatTime(data.created_at),
    type: data.type,
    translation: data.translated_content ?? undefined,
    isJapanese: containsJapanese(data.content),
    isRead: data.is_read,
  };
}

function sortConversations(items: Conversation[]): Conversation[] {
  return [...items].sort((a, b) => {
    const aId = a.lastMessageId ?? 0;
    const bId = b.lastMessageId ?? 0;
    return bId - aId;
  });
}

// ─── SVG Icons ────────────────────────────────────────────────────────────────

function WeConnectLogo() {
  return (
    <svg width="32" height="28" viewBox="0 0 32 28" fill="none">
      <path
        d="M7.5 28.75C6.45833 28.75 5.57292 28.3854 4.84375 27.6562C4.11458 26.9271 3.75 26.0417 3.75 25C3.75 23.9583 4.11458 23.0729 4.84375 22.3438C5.57292 21.6146 6.45833 21.25 7.5 21.25C7.79167 21.25 8.0625 21.2812 8.3125 21.3438C8.5625 21.4062 8.80208 21.4896 9.03125 21.5938L10.8125 19.375C10.2292 18.7292 9.82292 18 9.59375 17.1875C9.36458 16.375 9.3125 15.5625 9.4375 14.75L6.90625 13.9062C6.55208 14.4271 6.10417 14.8438 5.5625 15.1562C5.02083 15.4688 4.41667 15.625 3.75 15.625C2.70833 15.625 1.82292 15.2604 1.09375 14.5312C0.364583 13.8021 0 12.9167 0 11.875C0 10.8333 0.364583 9.94792 1.09375 9.21875C1.82292 8.48958 2.70833 8.125 3.75 8.125C4.79167 8.125 5.67708 8.48958 6.40625 9.21875C7.13542 9.94792 7.5 10.8333 7.5 11.875C7.5 11.9167 7.5 11.9583 7.5 12C7.5 12.0417 7.5 12.0833 7.5 12.125L10.0312 13C10.4479 12.25 11.0052 11.6146 11.7031 11.0938C12.401 10.5729 13.1875 10.2396 14.0625 10.0938V7.375C13.25 7.14583 12.5781 6.70312 12.0469 6.04688C11.5156 5.39062 11.25 4.625 11.25 3.75C11.25 2.70833 11.6146 1.82292 12.3438 1.09375C13.0729 0.364583 13.9583 0 15 0C16.0417 0 16.9271 0.364583 17.6562 1.09375C18.3854 1.82292 18.75 2.70833 18.75 3.75C18.75 4.625 18.4792 5.39062 17.9375 6.04688C17.3958 6.70312 16.7292 7.14583 15.9375 7.375V10.0938C16.8125 10.2396 17.599 10.5729 18.2969 11.0938C18.9948 11.6146 19.5521 12.25 19.9688 13L22.5 12.125V12C22.5 11.9583 22.5 11.9167 22.5 11.875C22.5 10.8333 22.8646 9.94792 23.5938 9.21875C24.3229 8.48958 25.2083 8.125 26.25 8.125C27.2917 8.125 28.1771 8.48958 28.9062 9.21875C29.6354 9.94792 30 10.8333 30 11.875C30 12.9167 29.6354 13.8021 28.9062 14.5312C28.1771 15.2604 27.2917 15.625 26.25 15.625C25.5833 15.625 24.974 15.4688 24.4219 15.1562C23.8698 14.8438 23.4271 14.4271 23.0938 13.9062L20.5625 14.75C20.6875 15.5625 20.6354 16.3698 20.4062 17.1719C20.1771 17.974 19.7708 18.7083 19.1875 19.375L20.9688 21.5625C21.1979 21.4583 21.4375 21.3802 21.6875 21.3281C21.9375 21.276 22.2083 21.25 22.5 21.25C23.5417 21.25 24.4271 21.6146 25.1562 22.3438C25.8854 23.0729 26.25 23.9583 26.25 25C26.25 26.0417 25.8854 26.9271 25.1562 27.6562C24.4271 28.3854 23.5417 28.75 22.5 28.75C21.4583 28.75 20.5729 28.3854 19.8438 27.6562C19.1146 26.9271 18.75 26.0417 18.75 25C18.75 24.5833 18.8177 24.1823 18.9531 23.7969C19.0885 23.4115 19.2708 23.0625 19.5 22.75L17.7188 20.5312C16.8646 21.0104 15.9531 21.25 14.9844 21.25C14.0156 21.25 13.1042 21.0104 12.25 20.5312L10.5 22.75C10.7292 23.0625 10.9115 23.4115 11.0469 23.7969C11.1823 24.1823 11.25 24.5833 11.25 25C11.25 26.0417 10.8854 26.9271 10.1562 27.6562C9.42708 28.3854 8.54167 28.75 7.5 28.75ZM3.75 13.125C4.10417 13.125 4.40104 13.0052 4.64062 12.7656C4.88021 12.526 5 12.2292 5 11.875C5 11.5208 4.88021 11.224 4.64062 10.9844C4.40104 10.7448 4.10417 10.625 3.75 10.625C3.39583 10.625 3.09896 10.7448 2.85938 10.9844C2.61979 11.224 2.5 11.5208 2.5 11.875C2.5 12.2292 2.61979 12.526 2.85938 12.7656C3.09896 13.0052 3.39583 13.125 3.75 13.125ZM7.5 26.25C7.85417 26.25 8.15104 26.1302 8.39062 25.8906C8.63021 25.651 8.75 25.3542 8.75 25C8.75 24.6458 8.63021 24.349 8.39062 24.1094C8.15104 23.8698 7.85417 23.75 7.5 23.75C7.14583 23.75 6.84896 23.8698 6.60938 24.1094C6.36979 24.349 6.25 24.6458 6.25 25C6.25 25.3542 6.36979 25.651 6.60938 25.8906C6.84896 26.1302 7.14583 26.25 7.5 26.25ZM15 5C15.3542 5 15.651 4.88021 15.8906 4.64062C16.1302 4.40104 16.25 4.10417 16.25 3.75C16.25 3.39583 16.1302 3.09896 15.8906 2.85938C15.651 2.61979 15.3542 2.5 15 2.5C14.6458 2.5 14.349 2.61979 14.1094 2.85938C13.8698 3.09896 13.75 3.39583 13.75 3.75C13.75 4.10417 13.8698 4.40104 14.1094 4.64062C14.349 4.88021 14.6458 5 15 5ZM15 18.75C15.875 18.75 16.6146 18.4479 17.2188 17.8438C17.8229 17.2396 18.125 16.5 18.125 15.625C18.125 14.75 17.8229 14.0104 17.2188 13.4062C16.6146 12.8021 15.875 12.5 15 12.5C14.125 12.5 13.3854 12.8021 12.7812 13.4062C12.1771 14.0104 11.875 14.75 11.875 15.625C11.875 16.5 12.1771 17.2396 12.7812 17.8438C13.3854 18.4479 14.125 18.75 15 18.75ZM22.5 26.25C22.8542 26.25 23.151 26.1302 23.3906 25.8906C23.6302 25.651 23.75 25.3542 23.75 25C23.75 24.6458 23.6302 24.349 23.3906 24.1094C23.151 23.8698 22.8542 23.75 22.5 23.75C22.1458 23.75 21.849 23.8698 21.6094 24.1094C21.3698 24.349 21.25 24.6458 21.25 25C21.25 25.3542 21.3698 25.651 21.6094 25.8906C21.849 26.1302 22.1458 26.25 22.5 26.25ZM26.25 13.125C26.6042 13.125 26.901 13.0052 27.1406 12.7656C27.3802 12.526 27.5 12.2292 27.5 11.875C27.5 11.5208 27.3802 11.224 27.1406 10.9844C26.901 10.7448 26.6042 10.625 26.25 10.625C25.8958 10.625 25.599 10.7448 25.3594 10.9844C25.1198 11.224 25 11.5208 25 11.875C25 12.2292 25.1198 12.526 25.3594 12.7656C25.599 13.0052 25.8958 13.125 26.25 13.125Z"
        fill="#4EDEA3"
      />
    </svg>
  );
}

function IconHome() {
  return (
    <svg width="14" height="15" viewBox="0 0 14 15" fill="none">
      <path
        d="M1.66667 13.3333H4.16667V8.33333H9.16667V13.3333H11.6667V5.83333L6.66667 2.08333L1.66667 5.83333V13.3333ZM0 15V5L6.66667 0L13.3333 5V15H7.5V10H5.83333V15H0Z"
        fill="currentColor"
      />
    </svg>
  );
}

function IconFriends() {
  return (
    <svg width="19" height="14" viewBox="0 0 19 14" fill="none">
      <path
        d="M0 13.3333V11C0 10.5278 0.121528 10.0938 0.364583 9.69792C0.607639 9.30208 0.930556 9 1.33333 8.79167C2.19444 8.36111 3.06944 8.03819 3.95833 7.82292C4.84722 7.60764 5.75 7.5 6.66667 7.5C7.58333 7.5 8.48611 7.60764 9.375 7.82292C10.2639 8.03819 11.1389 8.36111 12 8.79167C12.4028 9 12.7257 9.30208 12.9688 9.69792C13.2118 10.0938 13.3333 10.5278 13.3333 11V13.3333H0ZM15 13.3333V10.8333C15 10.2222 14.8299 9.63542 14.4896 9.07292C14.1493 8.51042 13.6667 8.02778 13.0417 7.625C13.75 7.70833 14.4167 7.85069 15.0417 8.05208C15.6667 8.25347 16.25 8.5 16.7917 8.79167C17.2917 9.06944 17.6736 9.37847 17.9375 9.71875C18.2014 10.059 18.3333 10.4306 18.3333 10.8333V13.3333H15ZM6.66667 6.66667C5.75 6.66667 4.96528 6.34028 4.3125 5.6875C3.65972 5.03472 3.33333 4.25 3.33333 3.33333C3.33333 2.41667 3.65972 1.63194 4.3125 0.979167C4.96528 0.326389 5.75 0 6.66667 0C7.58333 0 8.36806 0.326389 9.02083 0.979167C9.67361 1.63194 10 2.41667 10 3.33333C10 4.25 9.67361 5.03472 9.02083 5.6875C8.36806 6.34028 7.58333 6.66667 6.66667 6.66667ZM15 3.33333C15 4.25 14.6736 5.03472 14.0208 5.6875C13.3681 6.34028 12.5833 6.66667 11.6667 6.66667C11.5139 6.66667 11.3194 6.64931 11.0833 6.61458C10.8472 6.57986 10.6528 6.54167 10.5 6.5C10.875 6.05556 11.1632 5.5625 11.3646 5.02083C11.566 4.47917 11.6667 3.91667 11.6667 3.33333C11.6667 2.75 11.566 2.1875 11.3646 1.64583C11.1632 1.10417 10.875 0.611111 10.5 0.166667C10.6944 0.0972222 10.8889 0.0520833 11.0833 0.03125C11.2778 0.0104167 11.4722 0 11.6667 0C12.5833 0 13.3681 0.326389 14.0208 0.979167C14.6736 1.63194 15 2.41667 15 3.33333ZM1.66667 11.6667H11.6667V11C11.6667 10.8472 11.6285 10.7083 11.5521 10.5833C11.4757 10.4583 11.375 10.3611 11.25 10.2917C10.5 9.91667 9.74306 9.63542 8.97917 9.44792C8.21528 9.26042 7.44444 9.16667 6.66667 9.16667C5.88889 9.16667 5.11806 9.26042 4.35417 9.44792C3.59028 9.63542 2.83333 9.91667 2.08333 10.2917C1.95833 10.3611 1.85764 10.4583 1.78125 10.5833C1.70486 10.7083 1.66667 10.8472 1.66667 11V11.6667ZM6.66667 5C7.125 5 7.51736 4.83681 7.84375 4.51042C8.17014 4.18403 8.33333 3.79167 8.33333 3.33333C8.33333 2.875 8.17014 2.48264 7.84375 2.15625C7.51736 1.82986 7.125 1.66667 6.66667 1.66667C6.20833 1.66667 5.81597 1.82986 5.48958 2.15625C5.16319 2.48264 5 2.875 5 3.33333C5 3.79167 5.16319 4.18403 5.48958 4.51042C5.81597 4.83681 6.20833 5 6.66667 5Z"
        fill="currentColor"
      />
    </svg>
  );
}

function IconChat() {
  return (
    <svg width="17" height="17" viewBox="0 0 17 17" fill="none">
      <path
        d="M0 16.6667V1.66667C0 1.20833 0.163194 0.815972 0.489583 0.489583C0.815972 0.163194 1.20833 0 1.66667 0H15C15.4583 0 15.8507 0.163194 16.1771 0.489583C16.5035 0.815972 16.6667 1.20833 16.6667 1.66667V11.6667C16.6667 12.125 16.5035 12.5174 16.1771 12.8438C15.8507 13.1701 15.4583 13.3333 15 13.3333H3.33333L0 16.6667ZM2.625 11.6667H15V1.66667H1.66667V12.6042L2.625 11.6667ZM1.66667 11.6667V1.66667V11.6667Z"
        fill="currentColor"
      />
    </svg>
  );
}

function IconCalendar() {
  return (
    <svg width="15" height="17" viewBox="0 0 15 17" fill="none">
      <path
        d="M1.66667 16.6667C1.20833 16.6667 0.815972 16.5035 0.489583 16.1771C0.163194 15.8507 0 15.4583 0 15V3.33333C0 2.875 0.163194 2.48264 0.489583 2.15625C0.815972 1.82986 1.20833 1.66667 1.66667 1.66667H2.5V0H4.16667V1.66667H10.8333V0H12.5V1.66667H13.3333C13.7917 1.66667 14.184 1.82986 14.5104 2.15625C14.8368 2.48264 15 2.875 15 3.33333V15C15 15.4583 14.8368 15.8507 14.5104 16.1771C14.184 16.5035 13.7917 16.6667 13.3333 16.6667H1.66667ZM1.66667 15H13.3333V6.66667H1.66667V15ZM1.66667 5H13.3333V3.33333H1.66667V5Z"
        fill="currentColor"
      />
    </svg>
  );
}

function IconGame() {
  return (
    <svg width="17" height="12" viewBox="0 0 17 12" fill="none">
      <path
        d="M2.1125 11.6667C1.40417 11.6667 0.855556 11.4201 0.466667 10.9271C0.0777778 10.434 -0.0680556 9.83333 0.0291667 9.125L0.904167 2.875C1.02917 2.04167 1.40069 1.35417 2.01875 0.8125C2.63681 0.270833 3.3625 0 4.19583 0H12.4458C13.2792 0 14.0049 0.270833 14.6229 0.8125C15.241 1.35417 15.6125 2.04167 15.7375 2.875L16.6125 9.125C16.7097 9.83333 16.5639 10.434 16.175 10.9271C15.7861 11.4201 15.2375 11.6667 14.5292 11.6667C14.2375 11.6667 13.9667 11.6146 13.7167 11.5104C13.4667 11.4062 13.2375 11.25 13.0292 11.0417L11.1542 9.16667H5.4875L3.6125 11.0417C3.40417 11.25 3.175 11.4062 2.925 11.5104C2.675 11.6146 2.40417 11.6667 2.1125 11.6667ZM12.4875 6.66667C12.7236 6.66667 12.9215 6.58681 13.0813 6.42708C13.241 6.26736 13.3208 6.06944 13.3208 5.83333C13.3208 5.59722 13.241 5.39931 13.0813 5.23958C12.9215 5.07986 12.7236 5 12.4875 5C12.2514 5 12.0535 5.07986 11.8938 5.23958C11.734 5.39931 11.6542 5.59722 11.6542 5.83333C11.6542 6.06944 11.734 6.26736 11.8938 6.42708C12.0535 6.58681 12.2514 6.66667 12.4875 6.66667ZM10.8208 4.16667C11.0569 4.16667 11.2549 4.08681 11.4146 3.92708C11.5743 3.76736 11.6542 3.56944 11.6542 3.33333C11.6542 3.09722 11.5743 2.89931 11.4146 2.73958C11.2549 2.57986 11.0569 2.5 10.8208 2.5C10.5847 2.5 10.3868 2.57986 10.2271 2.73958C10.0674 2.89931 9.9875 3.09722 9.9875 3.33333C9.9875 3.56944 10.0674 3.76736 10.2271 3.92708C10.3868 4.08681 10.5847 4.16667 10.8208 4.16667ZM4.77917 6.66667H6.02917V5.20833H7.4875V3.95833H6.02917V2.5H4.77917V3.95833H3.32083V5.20833H4.77917V6.66667Z"
        fill="currentColor"
      />
    </svg>
  );
}

function IconSearch({ className }: { className?: string }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      className={className}
    >
      <path
        d="M12.45 13.5L7.725 8.775C7.35 9.075 6.91875 9.3125 6.43125 9.4875C5.94375 9.6625 5.425 9.75 4.875 9.75C3.5125 9.75 2.35938 9.27813 1.41562 8.33438C0.471875 7.39063 0 6.2375 0 4.875C0 3.5125 0.471875 2.35938 1.41562 1.41562C2.35938 0.471875 3.5125 0 4.875 0C6.2375 0 7.39063 0.471875 8.33438 1.41562C9.27813 2.35938 9.75 3.5125 9.75 4.875C9.75 5.425 9.6625 5.94375 9.4875 6.43125C9.3125 6.91875 9.075 7.35 8.775 7.725L13.5 12.45L12.45 13.5ZM4.875 8.25C5.8125 8.25 6.60938 7.92188 7.26562 7.26562C7.92188 6.60938 8.25 5.8125 8.25 4.875C8.25 3.9375 7.92188 3.14062 7.26562 2.48438C6.60938 1.82812 5.8125 1.5 4.875 1.5C3.9375 1.5 3.14062 1.82812 2.48438 2.48438C1.82812 3.14062 1.5 3.9375 1.5 4.875C1.5 5.8125 1.82812 6.60938 2.48438 7.26562C3.14062 7.92188 3.9375 8.25 4.875 8.25Z"
        fill="#6B7280"
      />
    </svg>
  );
}

function IconPhone() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path
        d="M16.95 18C14.8667 18 12.8083 17.5458 10.775 16.6375C8.74167 15.7292 6.89167 14.4417 5.225 12.775C3.55833 11.1083 2.27083 9.25833 1.3625 7.225C0.454167 5.19167 0 3.13333 0 1.05C0 0.75 0.1 0.5 0.3 0.3C0.5 0.1 0.75 0 1.05 0H5.1C5.33333 0 5.54167 0.0791667 5.725 0.2375C5.90833 0.395833 6.01667 0.583333 6.05 0.8L6.7 4.3C6.73333 4.56667 6.725 4.79167 6.675 4.975C6.625 5.15833 6.53333 5.31667 6.4 5.45L3.975 7.9C4.30833 8.51667 4.70417 9.1125 5.1625 9.6875C5.62083 10.2625 6.125 10.8167 6.675 11.35C7.19167 11.8667 7.73333 12.3458 8.3 12.7875C8.86667 13.2292 9.46667 13.6333 10.1 14L12.45 11.65C12.6 11.5 12.7958 11.3875 13.0375 11.3125C13.2792 11.2375 13.5167 11.2167 13.75 11.25L17.2 11.95C17.4333 12.0167 17.625 12.1375 17.775 12.3125C17.925 12.4875 18 12.6833 18 12.9V16.95C18 17.25 17.9 17.5 17.7 17.7C17.5 17.9 17.25 18 16.95 18Z"
        fill="#6B7280"
      />
    </svg>
  );
}



function IconTranslate() {
  return (
    <svg width="13" height="12" viewBox="0 0 13 12" fill="none">
      <path
        d="M6.35833 11.6667L9.0125 4.66667H10.2375L12.8917 11.6667H11.6667L11.0396 9.8875H8.21042L7.58333 11.6667H6.35833ZM1.75 9.91667L0.933333 9.1L3.87917 6.15417C3.53889 5.81389 3.23021 5.425 2.95312 4.9875C2.67604 4.55 2.42083 4.05417 2.1875 3.5H3.4125C3.60694 3.87917 3.80139 4.20972 3.99583 4.49167C4.19028 4.77361 4.42361 5.05556 4.69583 5.3375C5.01667 5.01667 5.34965 4.56701 5.69479 3.98854C6.03993 3.41007 6.3 2.85833 6.475 2.33333H0V1.16667H4.08333V0H5.25V1.16667H9.33333V2.33333H7.64167C7.4375 3.03333 7.13125 3.75278 6.72292 4.49167C6.31458 5.23056 5.91111 5.79444 5.5125 6.18333L6.9125 7.6125L6.475 8.80833L4.69583 6.98542L1.75 9.91667ZM8.575 8.86667H10.675L9.625 5.89167L8.575 8.86667Z"
        fill="#4A6741"
      />
    </svg>
  );
}

function IconSend() {
  return (
    <svg width="19" height="16" viewBox="0 0 19 16" fill="none">
      <path
        d="M0 16V0L19 8L0 16ZM2 13L13.85 8L2 3V6.5L8 8L2 9.5V13Z"
        fill="white"
      />
    </svg>
  );
}



function IconUser() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path
        d="M8 8C6.9 8 5.95833 7.60833 5.175 6.825C4.39167 6.04167 4 5.1 4 4C4 2.9 4.39167 1.95833 5.175 1.175C5.95833 0.391667 6.9 0 8 0C9.1 0 10.0417 0.391667 10.825 1.175C11.6083 1.95833 12 2.9 12 4C12 5.1 11.6083 6.04167 10.825 6.825C10.0417 7.60833 9.1 8 8 8ZM0 16V13.2C0 12.6333 0.145833 12.1125 0.4375 11.6375C0.729167 11.1625 1.11667 10.8 1.6 10.55C2.63333 10.0333 3.68333 9.64583 4.75 9.3875C5.81667 9.12917 6.9 9 8 9C9.1 9 10.1833 9.12917 11.25 9.3875C12.3167 9.64583 13.3667 10.0333 14.4 10.55C14.8833 10.8 15.2708 11.1625 15.5625 11.6375C15.8542 12.1125 16 12.6333 16 13.2V16H0ZM2 14H14V13.2C14 13.0167 13.9542 12.85 13.8625 12.7C13.7708 12.55 13.65 12.4333 13.5 12.35C12.6 11.9 11.6917 11.5625 10.775 11.3375C9.85833 11.1125 8.93333 11 8 11C7.06667 11 6.14167 11.1125 5.225 11.3375C4.30833 11.5625 3.4 11.9 2.5 12.35C2.35 12.4333 2.22917 12.55 2.1375 12.7C2.04583 12.85 2 13.0167 2 13.2V14ZM8 6C8.55 6 9.02083 5.80417 9.4125 5.4125C9.80417 5.02083 10 4.55 10 4C10 3.45 9.80417 2.97917 9.4125 2.5875C9.02083 2.19583 8.55 2 8 2C7.45 2 6.97917 2.19583 6.5875 2.5875C6.19583 2.97917 6 3.45 6 4C6 4.55 6.19583 5.02083 6.5875 5.4125C6.97917 5.80417 7.45 6 8 6Z"
        fill="#6B7280"
      />
    </svg>
  );
}

function IconFilter() {
  return (
    <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
      <path
        d="M4.66667 10.5V7H5.83333V8.16667H10.5V9.33333H5.83333V10.5H4.66667ZM0 9.33333V8.16667H3.5V9.33333H0ZM2.33333 7V5.83333H0V4.66667H2.33333V3.5H3.5V7H2.33333ZM4.66667 5.83333V4.66667H10.5V5.83333H4.66667ZM7 3.5V0H8.16667V1.16667H10.5V2.33333H8.16667V3.5H7ZM0 2.33333V1.16667H5.83333V2.33333H0Z"
        fill="#6B7280"
      />
    </svg>
  );
}

function IconChevronDown() {
  return (
    <svg width="8" height="5" viewBox="0 0 8 5" fill="none">
      <path
        d="M4 4.93333L0 0.933333L0.933333 0L4 3.06667L7.06667 0L8 0.933333L4 4.93333Z"
        fill="#6B7280"
      />
    </svg>
  );
}

function IconFile() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path
        d="M10 1H3C2.46957 1 1.96086 1.21071 1.58579 1.58579C1.21071 1.96086 1 2.46957 1 3V15C1 15.5304 1.21071 16.0391 1.58579 16.4142C1.96086 16.7893 2.46957 17 3 17H15C15.5304 17 16.0391 16.7893 16.4142 16.4142C16.7893 16.0391 17 15.5304 17 15V8L10 1Z"
        stroke="#6B7280"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10 1V8H17"
        stroke="#6B7280"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconEmoji() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path
        d="M13.5 9C13.9167 9 14.2708 8.85417 14.5625 8.5625C14.8542 8.27083 15 7.91667 15 7.5C15 7.08333 14.8542 6.72917 14.5625 6.4375C14.2708 6.14583 13.9167 6 13.5 6C13.0833 6 12.7292 6.14583 12.4375 6.4375C12.1458 6.72917 12 7.08333 12 7.5C12 7.91667 12.1458 8.27083 12.4375 8.5625C12.7292 8.85417 13.0833 9 13.5 9ZM6.5 9C6.91667 9 7.27083 8.85417 7.5625 8.5625C7.85417 8.27083 8 7.91667 8 7.5C8 7.08333 7.85417 6.72917 7.5625 6.4375C7.27083 6.14583 6.91667 6 6.5 6C6.08333 6 5.72917 6.14583 5.4375 6.4375C5.14583 6.72917 5 7.08333 5 7.5C5 7.91667 5.14583 8.27083 5.4375 8.5625C5.72917 8.85417 6.08333 9 6.5 9ZM10 15.5C11.1333 15.5 12.1625 15.1792 13.0875 14.5375C14.0125 13.8958 14.6833 13.05 15.1 12H4.9C5.31667 13.05 5.9875 13.8958 6.9125 14.5375C7.8375 15.1792 8.86667 15.5 10 15.5ZM10 20C8.61667 20 7.31667 19.7375 6.1 19.2125C4.88333 18.6875 3.825 17.975 2.925 17.075C2.025 16.175 1.3125 15.1167 0.7875 13.9C0.2625 12.6833 0 11.3833 0 10C0 8.61667 0.2625 7.31667 0.7875 6.1C1.3125 4.88333 2.025 3.825 2.925 2.925C3.825 2.025 4.88333 1.3125 6.1 0.7875C7.31667 0.2625 8.61667 0 10 0C11.3833 0 12.6833 0.2625 13.9 0.7875C15.1167 1.3125 16.175 2.025 17.075 2.925C17.975 3.825 18.6875 4.88333 19.2125 6.1C19.7375 7.31667 20 8.61667 20 10C20 11.3833 19.7375 12.6833 19.2125 13.9C18.6875 15.1167 17.975 16.175 17.075 17.075C16.175 17.975 15.1167 18.6875 13.9 19.2125C12.6833 19.7375 11.3833 20 10 20ZM10 18C12.2333 18 14.125 17.225 15.675 15.675C17.225 14.125 18 12.2333 18 10C18 7.76667 17.225 5.875 15.675 4.325C14.125 2.775 12.2333 2 10 2C7.76667 2 5.875 2.775 4.325 4.325C2.775 5.875 2 7.76667 2 10C2 12.2333 2.775 14.125 4.325 15.675C5.875 17.225 7.76667 18 10 18Z"
        fill="#4A6741"
      />
    </svg>
  );
}

// ─── Avatar ────────────────────────────────────────────────────────────────────

function Avatar({
  src,
  alt,
  size = 48,
  className,
}: {
  src?: string;
  alt?: string;
  size?: number;
  className?: string;
}) {
  if (src) {
    return (
      <img
        src={src}
        alt={alt || ""}
        width={size}
        height={size}
        className={cn("rounded-full object-cover shrink-0", className)}
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <div
      className={cn(
        "rounded-full bg-[#E2E8F0] border border-[#E2E8E2] flex items-center justify-center shrink-0",
        className
      )}
      style={{ width: size, height: size }}
    >
      <IconUser />
    </div>
  );
}

// ─── Level Badge ──────────────────────────────────────────────────────────────

function LevelBadge({
  level,
  textColor,
  bg,
}: {
  level: string;
  textColor: string;
  bg: string;
}) {
  return (
    <span
      className={cn(
        "px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-tight",
        bg,
        textColor
      )}
    >
      {level}
    </span>
  );
}

// ─── Search Dropdown ──────────────────────────────────────────────────────────

function SearchDropdown({
  results,
  onClose,
}: {
  results: SearchResult[];
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const [ageFilter, setAgeFilter] = useState("Tất cả");
  const [genderFilter, setGenderFilter] = useState("Tất cả");
  const [interestFilter, setInterestFilter] = useState("Tất cả");
  const [levelFilter, setLevelFilter] = useState("Tất cả");

  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  const FilterSelect = ({
    label,
    value,
    onChange,
  }: {
    label: string;
    value: string;
    onChange: (v: string) => void;
  }) => (
    <div className="flex flex-col gap-1 flex-1 min-w-0">
      <div className="px-1">
        <span className="text-[9px] font-bold text-[#6B7280] uppercase">
          {label}
        </span>
      </div>
      <div className="relative">
        <select
          value={value}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => onChange(e.target.value)}
          className="w-full h-[38px] border border-[#E2E8E2] rounded-lg bg-white text-[11px] font-semibold text-[#2D3A3A] pl-2 pr-7 appearance-none outline-none cursor-pointer"
        >
          <option>{t("chat.all") || "Tất cả"}</option>
        </select>
        <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2">
          <IconChevronDown />
        </div>
      </div>
    </div>
  );

  return (
    <div className="absolute top-full left-0 mt-1 w-[550px] max-w-[calc(100vw-2rem)] rounded-2xl border border-[#E2E8E2] bg-white shadow-2xl overflow-hidden z-50">
      {/* Filter header */}
      <div className="p-4 border-b border-[#E2E8E2] bg-[rgba(248,250,252,0.5)] flex flex-col gap-3">
        <div className="flex items-center gap-1.5">
          <IconFilter />
          <span className="text-[10px] font-bold text-[#6B7280] uppercase tracking-[0.5px]">
            {t("chat.searchFilters")}
          </span>
        </div>
        <div className="flex items-end gap-2">
          <FilterSelect
            label={t("chat.age")}
            value={ageFilter}
            onChange={setAgeFilter}
          />
          <FilterSelect
            label={t("chat.gender")}
            value={genderFilter}
            onChange={setGenderFilter}
          />
          <FilterSelect
            label={t("chat.interests")}
            value={interestFilter}
            onChange={setInterestFilter}
          />
          <FilterSelect
            label={t("chat.japaneseLevel")}
            value={levelFilter}
            onChange={setLevelFilter}
          />
        </div>
      </div>

      {/* Results header */}
      <div className="px-4 py-2 border-b border-[rgba(226,232,226,0.3)] bg-white">
        <span className="text-[10px] font-bold text-[#6B7280] uppercase tracking-[1px]">
          {t("chat.results", { count: results.length })}
        </span>
      </div>

      {/* Results list */}
      <div className="max-h-[360px] overflow-y-auto">
        {results.map((r, i) => (
          <div
            key={r.id}
            className={cn(
              "flex items-center gap-3 px-4 py-2.5 hover:bg-[#F9FAF9] transition-colors cursor-pointer",
              i > 0 && "border-t border-[rgba(226,232,226,0.3)]"
            )}
          >
            <Avatar src={r.avatar} size={40} />
            <div className="flex flex-col flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold text-[#2D3A3A] truncate">
                  {r.name}
                </span>
                <LevelBadge
                  level={r.level}
                  textColor={r.levelTextColor}
                  bg={r.levelBg}
                />
              </div>
              <span className="text-[11px] text-[#6B7280]">
                {t(r.relation)} • {r.age} tuổi • {r.personality}
              </span>
            </div>
            <button className="text-[11px] font-bold text-[#4A6741] hover:underline shrink-0">
              {t("chat.viewProfile")}
            </button>
          </div>
        ))}

        {/* Scroll hint */}
        <div className="px-4 py-4 border-t border-[rgba(226,232,226,0.3)] text-center">
          <span className="text-[11px] font-medium text-[rgba(107,114,128,0.6)]">
            {t("chat.scrollMore")}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Header ───────────────────────────────────────────────────────────────────

const navItems = [
  { label: "navbar.home", icon: <IconHome />, active: false },
  { label: "navbar.friends", icon: <IconFriends />, active: false },
  { label: "navbar.chat", icon: <IconChat />, active: true },
  { label: "navbar.events", icon: <IconCalendar />, active: false },
  { label: "navbar.games", icon: <IconGame />, active: false },
];

export function Header() {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setShowDropdown(e.target.value.length > 0);
  };

  return (
    <header className="flex flex-col border-b border-[#E2E8E2] bg-white shadow-sm shrink-0 px-4 sm:px-6 z-30">
      <div className="flex h-16 items-center gap-4 sm:gap-8">
        {/* Logo */}
        <div className="flex items-center gap-2 shrink-0">
          <WeConnectLogo />
          <span className="text-xl font-extrabold text-[#2D3A3A] tracking-tight leading-none">
            WeConnect
          </span>
        </div>

        {/* Nav */}
        <nav className="hidden md:flex items-stretch self-stretch gap-0">
          {navItems.map((item) => (
            <button
              key={item.label}
              className={cn(
                "flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-lg transition-colors",
                item.active
                  ? "text-[#4A6741] border-b-2 border-[#4A6741] rounded-none"
                  : "text-[#6B7280] hover:text-[#2D3A3A] hover:bg-[#F9FAF9]"
              )}
            >
              <span
                className={cn(
                  item.active ? "text-[#4A6741]" : "text-[#6B7280]"
                )}
              >
                {item.icon}
              </span>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-3 ml-auto">
          {/* Search */}
          <div ref={searchRef} className="relative">
            <div className="relative flex items-center">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <IconSearch />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                onFocus={() => searchQuery.length > 0 && setShowDropdown(true)}
                placeholder={t("navbar.searchPlaceholder")}
                className="w-48 sm:w-64 pl-9 pr-4 py-1.5 rounded-full bg-[rgba(241,245,249,0.8)] text-sm text-[#2D3A3A] placeholder-[#6B7280] outline-none focus:ring-2 focus:ring-[#4A6741]/20 transition-all"
              />
            </div>
            {showDropdown && (
              <SearchDropdown
                results={searchResults}
                onClose={() => setShowDropdown(false)}
              />
            )}
          </div>

          {/* User avatar */}
          <div className="pl-2 border-l border-[#E2E8E2]">
            {(() => {
              const currentUser = getCurrentUser();
              const avatar = currentUser?.avatar_url;
              const avatarSrc = avatar
                ? (avatar.startsWith("/") ? `${API_BASE_URL}${avatar}` : avatar)
                : "https://api.builder.io/api/v1/image/assets/TEMP/970853f39e1b18632ca69640ab7ac67726e7dc95?width=72";
              return currentUser?.role === "ORGANIZER" || currentUser?.role === "admin" ? (
                <div className="w-9 h-9 rounded-full overflow-hidden ring-2 ring-[#4A6741]/10">
                  <img
                    src={avatarSrc}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <Link to="/profile">
                  <div className="w-9 h-9 rounded-full overflow-hidden ring-2 ring-[#4A6741]/10">
                    <img
                      src={avatarSrc}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </Link>
              );
            })()}
          </div>
        </div>
      </div>
    </header>
  );
}

// ─── Conversation Item ────────────────────────────────────────────────────────

function ConversationItem({
  conv,
  isActive,
  onClick,
}: {
  conv: Conversation;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-4 text-left transition-colors",
        isActive
          ? "bg-[rgba(241,245,240,0.5)] border-r-4 border-[#4A6741]"
          : "hover:bg-[#F9FAF9] border-b border-[rgba(226,232,226,0.5)]"
      )}
    >
      <div className="relative shrink-0">
        <Avatar src={conv.avatar} size={48} />
        {conv.isOnline && (
          <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-[#22C55E] border-2 border-white" />
        )}
      </div>
      <div className="flex flex-col flex-1 min-w-0">
        <div className="flex items-end justify-between gap-2">
          <span className="text-sm font-bold text-[#2D3A3A] truncate">
            {conv.name}
          </span>
          <div className="flex items-center gap-1.5 shrink-0">
            {conv.unreadCount > 0 && (
              <span className="min-w-5 h-5 px-1.5 rounded-full bg-[#4A6741] text-[10px] font-bold text-white flex items-center justify-center">
                {conv.unreadCount > 9 ? "9+" : conv.unreadCount}
              </span>
            )}
            <span className="text-[10px] text-[#6B7280]">{conv.time}</span>
          </div>
        </div>
        <span
          className={cn(
            "text-xs mt-0.5 truncate",
            isActive || conv.unreadCount > 0 ? "text-[#4A6741] font-medium" : "text-[#6B7280]"
          )}
        >
          {conv.lastMessage}
        </span>
      </div>
    </button>
  );
}

// ─── Conversation Sidebar ─────────────────────────────────────────────────────

function ConversationSidebar({
  activeId,
  conversations,
  isLoading,
  error,
  onSelect,
  className,
}: {
  activeId: string;
  conversations: Conversation[];
  isLoading: boolean;
  error: string | null;
  onSelect: (id: string) => void;
  className?: string;
}) {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const filteredConversations = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return conversations;
    return conversations.filter((conv) => conv.name.toLowerCase().includes(keyword));
  }, [conversations, query]);

  return (
    <aside className={cn("w-full md:w-80 xl:w-96 flex flex-col border-r border-[#E2E8E2] bg-white shrink-0", className)}>
      {/* Sidebar header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3">
        <h2 className="text-lg font-bold text-[#2D3A3A]">{t("chat.chat")}</h2>
      </div>

      {/* Search */}
      <div className="px-4 pb-3">
        <div className="relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
              <path
                d="M9.68333 10.5L6.00833 6.825C5.71667 7.05833 5.38125 7.24306 5.00208 7.37917C4.62292 7.51528 4.21944 7.58333 3.79167 7.58333C2.73194 7.58333 1.83507 7.21632 1.10104 6.48229C0.367014 5.74826 0 4.85139 0 3.79167C0 2.73194 0.367014 1.83507 1.10104 1.10104C1.83507 0.367014 2.73194 0 3.79167 0C4.85139 0 5.74826 0.367014 6.48229 1.10104C7.21632 1.83507 7.58333 2.73194 7.58333 3.79167C7.58333 4.21944 7.51528 4.62292 7.37917 5.00208C7.24306 5.38125 7.05833 5.71667 6.825 6.00833L10.5 9.68333L9.68333 10.5ZM3.79167 6.41667C4.52083 6.41667 5.14062 6.16146 5.65104 5.65104C6.16146 5.14062 6.41667 4.52083 6.41667 3.79167C6.41667 3.0625 6.16146 2.44271 5.65104 1.93229C5.14062 1.42188 4.52083 1.16667 3.79167 1.16667C3.0625 1.16667 2.44271 1.42188 1.93229 1.93229C1.42188 2.44271 1.16667 3.0625 1.16667 3.79167C1.16667 4.52083 1.42188 5.14062 1.93229 5.65104C2.44271 6.16146 3.0625 6.41667 3.79167 6.41667Z"
                fill="#6B7280"
              />
            </svg>
          </div>
          <input
            type="text"
            value={query}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => setQuery(event.target.value)}
            placeholder={t("chat.searchConversations")}
            className="w-full pl-8 pr-4 py-2.5 rounded-lg bg-[rgba(241,245,249,0.8)] text-sm text-[#2D3A3A] placeholder-[#6B7280] outline-none focus:ring-2 focus:ring-[#4A6741]/20"
          />
        </div>
      </div>

      {/* Conversations */}
      <div className="flex-1 overflow-y-auto">
        {isLoading && (
          <div className="px-4 py-6 text-sm text-[#6B7280]">
            Đang tải hội thoại...
          </div>
        )}
        {!isLoading && error && (
          <div className="px-4 py-6 text-sm text-red-600">
            {error}
          </div>
        )}
        {!isLoading && !error && filteredConversations.length === 0 && (
          <div className="px-4 py-6 text-sm text-[#6B7280]">
            Không có hội thoại phù hợp
          </div>
        )}
        {!isLoading && !error && filteredConversations.map((conv) => (
          <ConversationItem
            key={conv.id}
            conv={conv}
            isActive={activeId === conv.id}
            onClick={() => onSelect(conv.id)}
          />
        ))}
      </div>
    </aside>
  );
}

// ─── Chat Message ─────────────────────────────────────────────────────────────

function ChatMessage({
  msg,
  participantAvatar,
  onTranslate,
  isTranslating,
}: {
  msg: Message;
  participantAvatar?: string;
  onTranslate: (messageId: number) => Promise<void>;
  isTranslating: boolean;
}) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [showTranslation, setShowTranslation] = useState(
    msg.translation !== undefined
  );

  useEffect(() => {
    if (msg.translation) {
      setShowTranslation(true);
    }
  }, [msg.translation]);

  const handleTranslate = async () => {
    if (msg.translation) {
      setShowTranslation(!showTranslation);
      return;
    }
    await onTranslate(msg.messageId);
    setShowTranslation(true);
  };

  // Game-room invitation card — message content is the room code
  if (msg.type === "GAME_INVITE") {
    const roomCode = msg.content.trim();
    const isMine = msg.from === "me";
    return (
      <div className={cn("flex", isMine ? "justify-end" : "justify-start")}>
        <div className="flex flex-col gap-1 max-w-[85%] sm:max-w-[75%]">
          <div className="flex flex-col gap-3 px-4 py-3.5 rounded-2xl border border-[#E2E8E2] bg-white shadow-sm">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#F1F5F0] flex items-center justify-center shrink-0">
                <span className="text-lg">🎮</span>
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[13px] font-bold text-[#2D3A3A] truncate">
                  {isMine ? "Bạn đã mời vào phòng game" : "Lời mời vào phòng game"}
                </span>
                <span className="text-[11px] text-[#6B7280]">
                  Phòng #{roomCode}
                </span>
              </div>
            </div>
            <button
              onClick={() => navigate(`/game?code=${encodeURIComponent(roomCode)}`)}
              className="w-full py-2 rounded-xl bg-[#4A6741] hover:bg-[#3d5836] text-white text-[12px] font-bold transition-colors"
            >
              Tham gia
            </button>
          </div>
          <span className={cn("text-[10px] text-[#6B7280] px-1", isMine && "text-right")}>
            {msg.time}
          </span>
        </div>
      </div>
    );
  }

  // File or image message
  if (msg.type === "FILE" || msg.type === "IMAGE") {
    const isMine = msg.from === "me";
    const isImage = msg.type === "IMAGE" || /^\/(uploads\/|http).*\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(msg.content);
    const fileUrl = msg.content.startsWith("/") ? `${API_BASE_URL}${msg.content}` : msg.content;
    const fileName = msg.content.split("/").pop() || "file";

    if (isImage) {
      return (
        <div className={cn("flex", isMine ? "justify-end" : "justify-start")}>
          <div className="flex flex-col gap-1 max-w-[70%] sm:max-w-[60%]">
            <div className={cn("rounded-2xl overflow-hidden shadow-sm", isMine ? "rounded-tr-none bg-[#4A6741]" : "rounded-tl-none bg-white border border-[#E2E8E2]")}>
              <img src={fileUrl} alt="image" className="max-w-full h-auto object-cover" />
            </div>
            <span className={cn("text-[10px] text-[#6B7280] px-1", isMine && "text-right")}>
              {msg.time}
            </span>
          </div>
        </div>
      );
    }

    return (
      <div className={cn("flex", isMine ? "justify-end" : "justify-start")}>
        <div className="flex flex-col gap-1 max-w-[85%] sm:max-w-[75%]">
          <a
            href={fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "flex items-center gap-2 px-3 py-2.5 rounded-2xl shadow-sm transition-colors",
              isMine
                ? "rounded-tr-none bg-[#4A6741] text-white hover:bg-[#3d5836]"
                : "rounded-tl-none bg-white border border-[#E2E8E2] text-[#2D3A3A] hover:bg-[#F9FAF9]"
            )}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className="shrink-0">
              <path d="M2 16H11V11H16V2H2V16ZM2 18C1.45 18 0.979167 17.8042 0.5875 17.4125C0.195833 17.0208 0 16.55 0 16V2C0 1.45 0.195833 0.979167 0.5875 0.5875C0.979167 0.195833 1.45 0 2 0H16C16.55 0 17.0208 0.195833 17.4125 0.5875C17.8042 0.979172 18 1.45 18 2V12L12 18H2ZM4 11V9H9V11H4ZM4 7V5H14V7H4Z" fill="currentColor"/>
            </svg>
            <span className="text-sm truncate">{fileName}</span>
          </a>
          <span className={cn("text-[10px] text-[#6B7280] px-1", isMine && "text-right")}>
            {msg.time}
          </span>
        </div>
      </div>
    );
  }

  if (msg.from === "other") {
    return (
      <div className="flex items-start gap-3 max-w-[85%] sm:max-w-[75%]">
        <div className="pt-1 shrink-0">
          <Avatar src={participantAvatar} size={32} />
        </div>
        <div className="flex flex-col gap-1">
          <div className="px-3 py-2.5 rounded-tl-none rounded-tr-2xl rounded-br-2xl rounded-bl-2xl border border-[#E2E8E2] bg-white shadow-sm">
            <p
              className="text-sm text-[#2D3A3A] leading-[1.625]"
              style={{
                fontFamily: containsJapanese(msg.content)
                  ? "'Noto Sans JP', 'Hiragino Kaku Gothic Pro', 'Yu Gothic', sans-serif"
                  : "Inter, sans-serif",
              }}
            >
              {msg.content}
            </p>
                {showTranslation && msg.translation && (
                  <div className="mt-2 pt-2 border-t border-[#F1F5F9] flex items-start gap-1.5">
                    <span className="text-[9px] font-bold text-[#4A6741] uppercase shrink-0 mt-0.5">
                      [{getDynamicTargetLanguageLabel(msg.translation, msg.content, i18n.language)}]
                    </span>
                    <p className="text-[11px] text-[#6B7280] leading-[1.5]">
                      {msg.translation}
                    </p>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-3 px-1">
                <span className="text-[10px] text-[#6B7280]">{msg.time}</span>
                {msg.type === "TEXT" && (
                  <button
                    onClick={handleTranslate}
                    disabled={isTranslating}
                    className="flex items-center gap-1 text-[#4A6741] hover:opacity-80 transition-opacity disabled:opacity-50"
                  >
                    <IconTranslate />
                    <span className="text-[10px] font-bold text-[#4A6741]">
                      {isTranslating
                        ? "Đang dịch..."
                        : showTranslation && msg.translation
                          ? t("chat.hideTranslation")
                          : t("chat.translate")}
                    </span>
                  </button>
                )}
              </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-end">
      <div className="flex flex-col items-end gap-1 max-w-[85%] sm:max-w-[75%]">
        <div className="px-3 py-2.5 rounded-tl-2xl rounded-tr-none rounded-br-2xl rounded-bl-2xl bg-[#4A6741] shadow-sm">
          <p className="text-sm text-white leading-[1.625]">{msg.content}</p>
          <div className="text-right opacity-80 mt-0.5">
            <span className="text-[10px] text-[#F1F5F0]">{msg.time}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Chat Window ──────────────────────────────────────────────────────────────

function getEmojiPickerLanguage(i18nLanguage: string) {
  const lang = i18nLanguage.split("-")[0].toLowerCase();
  const supported: Record<string, string> = {
    en: "en",
    ja: "ja",
    jp: "ja",
    ko: "ko",
    zh: "zh",
    fr: "fr",
    de: "de",
    es: "es",
    it: "it",
    pt: "pt",
    ru: "ru",
    ar: "ar",
    tr: "tr",
  };
  return supported[lang] || "en";
}

function ChatWindow({
  conv,
  messages,
  isLoading,
  isSending,
  typingUserId,
  translatingIds,
  currentUserId,
  onSend,
  onTyping,
  onTranslate,
  onBack,
  className,
}: {
  conv: Conversation | null;
  messages: Message[];
  isLoading: boolean;
  isSending: boolean;
  typingUserId: number | null;
  translatingIds: Set<number>;
  currentUserId: number | null;
  onSend: (content: string, type?: string) => Promise<void>;
  onTyping: (isTyping: boolean) => void;
  onTranslate: (messageId: number) => Promise<void>;
  onBack?: () => void;
  className?: string;
}) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [inputValue, setInputValue] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(event.target as Node)
      ) {
        setShowEmojiPicker(false);
      }
    }
    if (showEmojiPicker) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showEmojiPicker]);

  const handleAddEmoji = (emojiData: EmojiClickData) => {
    setInputValue((v) => v + emojiData.emoji);
    setShowEmojiPicker(false);
  };

  const handleStartCall = async () => {
    if (!conv || currentUserId === null) return;
    const minId = Math.min(currentUserId, conv.participantId);
    const maxId = Math.max(currentUserId, conv.participantId);
    const roomName = `room_${minId}_${maxId}`;

    // Notify callee via Pusher before entering the room
    const currentUser = getCurrentUser();
    sendCallInvite({
      calleeId: conv.participantId,
      roomName,
      callerName: currentUser?.full_name ?? "Người dùng",
      callerAvatar: null, // Backend self-populates from current_user.avatar_url
    }).catch(() => {}); // fire-and-forget — don't block navigation on failure

    const params = new URLSearchParams({
      room: roomName,
      partner: conv.name,
      partner_id: conv.participantId.toString(),
      ...(conv.avatar ? { avatar: conv.avatar } : {}),
    });
    navigate(`/call?${params.toString()}`);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, conv?.id]);

  useEffect(() => {
    setInputValue("");
  }, [conv?.id]);

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        window.clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(event.target.value);
    if (!conv) return;

    onTyping(true);
    if (typingTimeoutRef.current) {
      window.clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = window.setTimeout(() => onTyping(false), 1200);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const content = inputValue.trim();
    if (!content || !conv || isSending) return;

    setInputValue("");
    onTyping(false);
    await onSend(content, "TEXT");
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !conv) return;

    setIsUploadingFile(true);
    try {
      const response = await uploadChatFile(file);
      await onSend(response.data.url, "FILE");
    } catch (error) {
      console.error("Upload file failed:", error);
    } finally {
      setIsUploadingFile(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  if (!conv) {
    return (
      <div className={cn("flex flex-col flex-1 min-w-0 bg-[rgba(248,250,252,0.3)] items-center justify-center px-6 text-center", className)}>
        <div className="max-w-sm">
          <h3 className="text-base font-bold text-[#2D3A3A]">
            Chọn một hội thoại
          </h3>
          <p className="mt-2 text-sm text-[#6B7280]">
            Danh sách hội thoại của bạn sẽ hiển thị bên trái sau khi có kết bạn và tin nhắn.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col flex-1 min-w-0 bg-[rgba(248,250,252,0.3)]", className)}>
      {/* Chat header */}
      <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-[#E2E8E2] shadow-sm shrink-0">
        <div className="flex items-center gap-3">
          {/* Back button on mobile */}
          <button
            onClick={onBack}
            className="md:hidden p-1 mr-1 text-[#6B7280] hover:text-[#2D3A3A] transition-colors"
            title="Quay lại danh sách"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
          </button>
          <div className="relative">
            <Avatar src={conv.avatar} size={40} />
            {conv.isOnline && (
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-[#22C55E] border-2 border-white" />
            )}
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#2D3A3A]">{conv.name}</h3>
            {typingUserId === conv.participantId ? (
              <p className="text-xs text-[#22C55E] font-medium">
                Đang nhập...
              </p>
            ) : conv.isOnline && (
              <p className="text-xs text-[#22C55E] font-medium">
                {t("chat.active")}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            id="btn-start-call"
            onClick={handleStartCall}
            title="Bắt đầu cuộc gọi video"
            className="p-2 text-[#6B7280] hover:text-[#4A6741] hover:bg-[#F9FAF9] rounded-full transition-colors"
          >
            <IconPhone />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-4">
        {/* Date divider */}
        <div className="flex justify-center">
          <span className="px-3 py-1 rounded-full bg-[#F1F5F9] text-[10px] font-bold text-[#6B7280] uppercase tracking-[0.5px]">
            {t("chat.today")}
          </span>
        </div>

        {isLoading && (
          <div className="py-8 text-center text-sm text-[#6B7280]">
            Đang tải tin nhắn...
          </div>
        )}
        {!isLoading && messages.length === 0 && (
          <div className="py-8 text-center text-sm text-[#6B7280]">
            Chưa có tin nhắn nào
          </div>
        )}
        {!isLoading && messages.map((msg) => (
          <ChatMessage
            key={msg.id}
            msg={msg}
            participantAvatar={conv.avatar}
            onTranslate={onTranslate}
            isTranslating={translatingIds.has(msg.messageId)}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Message input */}
      <div className="px-4 py-4 bg-white border-t border-[#E2E8E2] shrink-0">
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          {/* Attachment buttons */}
          <div className="flex items-center gap-0 pr-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingFile}
              className="p-2 text-[#6B7280] hover:text-[#2D3A3A] hover:bg-[#F9FAF9] rounded-full transition-colors disabled:opacity-50"
              title="Gửi file"
            >
              <IconFile />
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          {/* Input */}
          <div className="flex-1 relative">
            <input
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              placeholder={t("chat.typeMessage")}
              disabled={isSending || isUploadingFile}
              className="w-full py-2.5 pl-4 pr-12 rounded-full bg-[rgba(241,245,249,0.8)] text-sm text-[#2D3A3A] placeholder-[#6B7280] outline-none focus:ring-2 focus:ring-[#4A6741]/20 transition-all"
            />
            <button
              type="button"
              onClick={() => setShowEmojiPicker((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#4A6741] hover:opacity-80 transition-opacity"
            >
              <IconEmoji />
            </button>
            {showEmojiPicker && (
              <div ref={emojiPickerRef} className="absolute bottom-full right-0 mb-2 z-50">
                <EmojiPicker
                  {...({
                    onEmojiClick: handleAddEmoji,
                    width: 300,
                    height: 350,
                    language: getEmojiPickerLanguage(i18n.language),
                  } as any)}
                />
              </div>
            )}
          </div>

          {/* Send button */}
          <button
            type="submit"
            disabled={!inputValue.trim() || isSending || isUploadingFile}
            className="w-10 h-10 rounded-full bg-[#4A6741] flex items-center justify-center shadow-md hover:bg-[#3d5836] transition-colors shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <IconSend />
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

function getTargetLanguage(i18nLanguage: string): "VI" | "JA" | "EN" {
  const lang = i18nLanguage.split("-")[0].toLowerCase();
  if (lang === "vi") return "VI";
  if (lang === "ja" || lang === "jp") return "JA";
  return "EN";
}

function getTargetLanguageLabel(i18nLanguage: string): string {
  const lang = i18nLanguage.split("-")[0].toLowerCase();
  if (lang === "vi") return "Tiếng Việt";
  if (lang === "ja" || lang === "jp") return "日本語";
  return "English";
}

function getDynamicTargetLanguageLabel(translatedText: string | undefined, originalText: string, i18nLanguage: string): string {
  if (translatedText && containsJapanese(translatedText)) return "日本語";
  if (containsJapanese(originalText)) return "Tiếng Việt";
  return getTargetLanguageLabel(i18nLanguage);
}

export default function Index() {
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedUserId = Number(searchParams.get("user_id"));
  const currentUserId = getCurrentUser()?.user_id ?? null;
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [conversationError, setConversationError] = useState<string | null>(null);
  const [typingUserId, setTypingUserId] = useState<number | null>(null);
  const [translatingIds, setTranslatingIds] = useState<Set<number>>(new Set());
  const pusherRef = useRef<Pusher | null>(null);
  const lastTypingStateRef = useRef(false);
  const [pusherReady, setPusherReady] = useState(false);
  const [showChatWindowOnMobile, setShowChatWindowOnMobile] = useState(false);
  const { i18n } = useTranslation();

  const activeConv = useMemo(
    () => conversations.find((conversation) => conversation.id === activeConvId) ?? null,
    [activeConvId, conversations]
  );

  const updateConversationFromMessage = (message: ApiChatMessage) => {
    setConversations((items) =>
      sortConversations(
        items.map((conversation) => {
          if (conversation.conversationId !== message.conversation_id) {
            return conversation;
          }

          const isMine = message.sender_id === currentUserId;
          return {
            ...conversation,
            lastMessage: `${isMine ? "Bạn: " : ""}${previewContent(message.content, message.type)}`,
            lastMessageId: message.message_id,
            time: formatChatTime(message.created_at),
            unreadCount:
              isMine || conversation.id === activeConvId
                ? 0
                : conversation.unreadCount + 1,
            isMine,
          };
        })
      )
    );
  };

  useEffect(() => {
    let cancelled = false;

    async function loadConversations() {
      setIsLoadingConversations(true);
      setConversationError(null);
      try {
        const response = await listConversations();
        if (cancelled) return;

        let mapped = sortConversations(
          response.data.map((conversation) => toConversation(conversation, currentUserId))
        );

        if (Number.isFinite(requestedUserId) && requestedUserId > 0) {
          try {
            const opened = await createOrGetConversation(requestedUserId);
            const openedConversation = toConversation(opened.data, currentUserId);
            mapped = sortConversations([
              openedConversation,
              ...mapped.filter((conversation) => conversation.id !== openedConversation.id),
            ]);
            setActiveConvId(openedConversation.id);
            setShowChatWindowOnMobile(true);
            setSearchParams({}, { replace: true });
          } catch (error) {
            setConversationError(
              error instanceof Error ? error.message : "Không mở được hội thoại"
            );
          }
        }

        setConversations(mapped);
        setActiveConvId((current) => current || mapped[0]?.id || "");
      } catch (error) {
        if (!cancelled) {
          setConversationError(
            error instanceof Error ? error.message : "Không tải được hội thoại"
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoadingConversations(false);
        }
      }
    }

    loadConversations();
    return () => {
      cancelled = true;
    };
  }, [currentUserId, requestedUserId, setSearchParams]);

  useEffect(() => {
    if (!activeConv) {
      setMessages([]);
      return;
    }

    let cancelled = false;
    const selectedConversation = activeConv;

    async function loadConversationMessages() {
      setIsLoadingMessages(true);
      try {
        const response = await listMessages(selectedConversation.conversationId);
        if (cancelled) return;

        const mapped = response.data.map((message) => toMessage(message, currentUserId));
        setMessages(mapped);
        const lastMessageId = mapped[mapped.length - 1]?.messageId;
        if (lastMessageId) {
          markConversationRead(selectedConversation.conversationId, lastMessageId).catch(() => {});
        }
        setConversations((items) =>
          items.map((conversation) =>
            conversation.id === selectedConversation.id ? { ...conversation, unreadCount: 0 } : conversation
          )
        );
      } finally {
        if (!cancelled) {
          setIsLoadingMessages(false);
        }
      }
    }

    setTypingUserId(null);
    loadConversationMessages();
    return () => {
      cancelled = true;
    };
  }, [activeConv?.conversationId, activeConv?.id, currentUserId]);

  useEffect(() => {
    lastTypingStateRef.current = false;
  }, [activeConv?.id]);

  useEffect(() => {
    let cancelled = false;
    let userChannelName = "";

    async function connectPusher() {
      const token = getAccessToken();
      if (!token || currentUserId === null) return;

      try {
        const response = await getPusherConfig();
        if (cancelled) return;

        const pusher = new Pusher(response.data.key, {
          cluster: response.data.cluster,
          authEndpoint: `${API_BASE_URL}${response.data.auth_endpoint}`,
          auth: {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        });

        pusherRef.current = pusher;
        userChannelName = `private-user-${currentUserId}`;
        const userChannel = pusher.subscribe(userChannelName);
        userChannel.bind("conversation:updated", (payload: ChatConversation) => {
          const updated = toConversation(payload, currentUserId);
          setConversations((items) =>
            sortConversations([
              updated,
              ...items.filter((conversation) => conversation.id !== updated.id),
            ])
          );
        });
        setPusherReady(true);
      } catch (error) {
        console.warn("Pusher is not available for chat realtime", error);
      }
    }

    connectPusher();
    return () => {
      cancelled = true;
      setPusherReady(false);
      if (pusherRef.current) {
        if (userChannelName) {
          pusherRef.current.unsubscribe(userChannelName);
        }
        pusherRef.current.disconnect();
        pusherRef.current = null;
      }
    };
  }, [currentUserId]);

  useEffect(() => {
    const pusher = pusherRef.current;
    if (!pusherReady || !pusher || !activeConv || currentUserId === null) return;

    const channelName = `private-conversation-${activeConv.conversationId}`;
    const channel = pusher.subscribe(channelName);

    channel.bind("chat:new", (payload: ApiChatMessage) => {
      const nextMessage = toMessage(payload, currentUserId);
      setMessages((items) =>
        items.some((message) => message.messageId === nextMessage.messageId)
          ? items
          : [...items, nextMessage]
      );
      updateConversationFromMessage(payload);

      if (payload.sender_id !== currentUserId) {
        markConversationRead(payload.conversation_id, payload.message_id).catch(() => {});
      }
    });

    channel.bind(
      "chat:typing",
      (payload: { conversation_id: number; user_id: number; is_typing: boolean }) => {
        if (payload.user_id === currentUserId) return;
        setTypingUserId(payload.is_typing ? payload.user_id : null);
      }
    );

    channel.bind(
      "chat:read",
      (payload: { user_id: number; last_read_message_id?: number | null }) => {
        if (payload.user_id === currentUserId) return;
        setMessages((items) =>
          items.map((message) =>
            message.from === "me" &&
            (!payload.last_read_message_id || message.messageId <= payload.last_read_message_id)
              ? { ...message, isRead: true }
              : message
          )
        );
      }
    );

    channel.bind(
      "chat:translated",
      (payload: { message_id: number; translated_content: string }) => {
        setMessages((items) =>
          items.map((message) =>
            message.messageId === payload.message_id
              ? { ...message, translation: payload.translated_content }
              : message
          )
        );
      }
    );

    return () => {
      channel.unbind_all();
      pusher.unsubscribe(channelName);
    };
  }, [activeConv?.conversationId, currentUserId, pusherReady]);

  const handleSelectConversation = (id: string) => {
    setActiveConvId(id);
    setShowChatWindowOnMobile(true);
    setConversations((items) =>
      items.map((conversation) =>
        conversation.id === id ? { ...conversation, unreadCount: 0 } : conversation
      )
    );
  };

  const handleSend = async (content: string, type: string = "TEXT") => {
    if (!activeConv) return;

    setIsSending(true);
    try {
      const response = await sendChatMessage(activeConv.conversationId, content, type);
      const sentMessage = toMessage(response.data, currentUserId);
      setMessages((items) =>
        items.some((message) => message.messageId === sentMessage.messageId)
          ? items
          : [...items, sentMessage]
      );
      updateConversationFromMessage(response.data);
    } finally {
      setIsSending(false);
    }
  };

  const handleTyping = (isTyping: boolean) => {
    if (!activeConv || lastTypingStateRef.current === isTyping) return;
    lastTypingStateRef.current = isTyping;
    sendTypingStatus(activeConv.conversationId, isTyping).catch(() => {});
  };

  const handleTranslate = async (messageId: number) => {
    setTranslatingIds((items) => new Set(items).add(messageId));
    try {
      const response = await translateMessage(messageId, getTargetLanguage(i18n.language));
      setMessages((items) =>
        items.map((message) =>
          message.messageId === messageId
            ? { ...message, translation: response.data.translated_content }
            : message
        )
      );
    } finally {
      setTranslatingIds((items) => {
        const next = new Set(items);
        next.delete(messageId);
        return next;
      });
    }
  };

  return (
    <div className="flex flex-col h-screen bg-wc-bg overflow-hidden font-inter">
      <Navbar />

      <main className="flex-1 flex overflow-hidden">
        <ConversationSidebar
          activeId={activeConvId}
          conversations={conversations}
          isLoading={isLoadingConversations}
          error={conversationError}
          onSelect={handleSelectConversation}
          className={cn(showChatWindowOnMobile ? "hidden md:flex" : "flex")}
        />
        <ChatWindow
          conv={activeConv}
          messages={messages}
          isLoading={isLoadingMessages}
          isSending={isSending}
          typingUserId={typingUserId}
          translatingIds={translatingIds}
          currentUserId={currentUserId}
          onSend={handleSend}
          onTyping={handleTyping}
          onTranslate={handleTranslate}
          onBack={() => setShowChatWindowOnMobile(false)}
          className={cn(showChatWindowOnMobile ? "flex" : "hidden md:flex")}
        />
      </main>
    </div>
  );
}
