import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { apiFetch, API_BASE_URL } from "@/lib/api";

/** Resolve relative avatar paths (e.g. /uploads/...) to absolute URLs for cross-origin deployments. */
function resolveAvatarUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith("/")) return `${API_BASE_URL}${url}`;
  return url;
}
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { useGameRoom } from "./useGameRoom";
import ShiritoriRoomView from "./ShiritoriRoomView";
import * as clock from "@/lib/gameClock";
import { inviteFriendToGameRoom } from "@/lib/chatApi";

interface UserOut {
  user_id: number;
  full_name: string;
  avatar_url: string | null;
  role: string;
}

interface GameRoomOut {
  room_id: number;
  code: string;
  host_id: number;
  room_type: string;
  max_players: number;
  status: string;
  created_at: string;
  started_at?: string | null;
  participants_count: number;
  participants: Array<{ user_id: number; full_name: string; avatar_url: string | null; score: number }>;
}

interface Friend {
  id: string;
  name: string;
  status: "online" | "offline";
  avatarColor: string;
}

// ── CUSTOM SVG ICONS ──

const WeConnectLogo = () => (
  <svg width="25" height="28" viewBox="0 0 30 28.75" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M7.5 28.75C6.45833 28.75 5.57292 28.3854 4.84375 27.6562C4.11458 26.9271 3.75 26.0417 3.75 25C3.75 23.9583 4.11458 23.0729 4.84375 22.3438C5.57292 21.6146 6.45833 21.25 7.5 21.25C7.79167 21.25 8.0625 21.2812 8.3125 21.3438C8.5625 21.4062 8.80208 21.4896 9.03125 21.5938L10.8125 19.375C10.2292 18.7292 9.82292 18 9.59375 17.1875C9.36458 16.375 9.3125 15.5625 9.4375 14.75L6.90625 13.9062C6.55208 14.4271 6.10417 14.8438 5.5625 15.1562C5.02083 15.4688 4.41667 15.625 3.75 15.625C2.70833 15.625 1.82292 15.2604 1.09375 14.5312C0.364583 13.8021 0 12.9167 0 11.875C0 10.8333 0.364583 9.94792 1.09375 9.21875C1.82292 8.48958 2.70833 8.125 3.75 8.125C4.79167 8.125 5.67708 8.48958 6.40625 9.21875C7.13542 9.94792 7.5 10.8333 7.5 11.875C7.5 11.9167 7.5 11.9583 7.5 12C7.5 12.0417 7.5 12.0833 7.5 12.125L10.0312 13C10.4479 12.25 11.0052 11.6146 11.7031 11.0938C12.401 10.5729 13.1875 10.2396 14.0625 10.0938V7.375C13.25 7.14583 12.5781 6.70312 12.0469 6.04688C11.5156 5.39062 11.25 4.625 11.25 3.75C11.25 2.70833 11.6146 1.82292 12.3438 1.09375C13.0729 0.364583 13.9583 0 15 0C16.0417 0 16.9271 0.364583 17.6562 1.09375C18.3854 1.82292 18.75 2.70833 18.75 3.75C18.75 4.625 18.4792 5.39062 17.9375 6.04688C17.3958 6.70312 16.7292 7.14583 15.9375 7.375V10.0938C16.8125 10.2396 17.599 10.5729 18.2969 11.0938C18.9948 11.6146 19.5521 12.25 19.9688 13L22.5 12.125C22.5 12.0833 22.5 12.0417 22.5 12C22.5 11.9583 22.5 11.9167 22.5 11.875C22.5 10.8333 22.8646 9.94792 23.5938 9.21875C24.3229 8.48958 25.2083 8.125 26.25 8.125C27.2917 8.125 28.1771 8.48958 28.9062 9.21875C29.6354 9.94792 30 10.8333 30 11.875C30 12.9167 29.6354 13.8021 28.9062 14.5312C28.1771 15.2604 27.2917 15.625 26.25 15.625C25.5833 15.625 24.974 15.4688 24.4219 15.1562C23.8698 14.8438 23.4271 14.4271 23.0938 13.9062L20.5625 14.75C20.6875 15.5625 20.6354 16.3698 20.4062 17.1719C20.1771 17.974 19.7708 18.7083 19.1875 19.375L20.9688 21.5625C21.1979 21.4583 21.4375 21.3802 21.6875 21.3281C21.9375 21.276 22.2083 21.25 22.5 21.25C23.5417 21.25 24.4271 21.6146 25.1562 22.3438C25.8854 23.0729 26.25 23.9583 26.25 25C26.25 26.0417 25.8854 26.9271 25.1562 27.6562C24.4271 28.3854 23.5417 28.75 22.5 28.75C21.4583 28.75 20.5729 28.3854 19.8438 27.6562C19.1146 26.9271 18.75 26.0417 18.75 25C18.75 24.5833 18.8177 24.1823 18.9531 23.7969C19.0885 23.4115 19.2708 23.0625 19.5 22.75L17.7188 20.5312C16.8646 21.0104 15.9531 21.25 14.9844 21.25C14.0156 21.25 13.1042 21.0104 12.25 20.5312L10.5 22.75C10.7292 23.0625 10.9115 23.4115 11.0469 23.7969C11.1823 24.1823 11.25 24.5833 11.25 25C11.25 26.0417 10.8854 26.9271 10.1562 27.6562C9.42708 28.3854 8.54167 28.75 7.5 28.75Z" fill="#22C55E"/>
  </svg>
);

const GameControllerIcon = () => (
  <svg width="20" height="14" viewBox="0 0 20 14" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M2.535 14C1.685 14 1.02667 13.7042 0.56 13.1125C0.0933333 12.5208 -0.0816667 11.8 0.035 10.95L1.085 3.45C1.235 2.45 1.68083 1.625 2.4225 0.975C3.16417 0.325 4.035 0 5.035 0H14.935C15.935 0 16.8058 0.325 17.5475 0.975C18.2892 1.625 18.735 2.45 18.885 3.45L19.935 10.95C20.0517 11.8 19.8767 12.5208 19.41 13.1125C18.9433 13.7042 18.285 14 17.435 14C17.085 14 16.76 13.9375 16.46 13.8125C16.16 13.6875 15.885 13.5 15.635 13.25L13.385 11H6.585L4.335 13.25C4.085 13.5 3.81 13.6875 3.51 13.8125C3.21 13.9375 2.885 14 2.535 14ZM2.935 11.85L5.785 9H14.185L17.035 11.85C17.0683 11.8833 17.2017 11.9333 17.435 12C17.6183 12 17.7642 11.9458 17.8725 11.8375C17.9808 11.7292 18.0183 11.5833 17.985 11.4L16.885 3.7C16.8183 3.21667 16.6017 2.8125 16.235 2.4875C15.8683 2.1625 15.435 2 14.935 2H5.035C4.535 2 4.10167 2.1625 3.735 2.4875C3.36833 2.8125 3.15167 3.21667 3.085 3.7L1.985 11.4C1.95167 11.5833 1.98917 11.7292 2.0975 11.8375C2.20583 11.9458 2.35167 12 2.535 12C2.56833 12 2.70167 11.95 2.935 11.85ZM14.985 8C15.2683 8 15.5058 7.90417 15.6975 7.7125C15.8892 7.52083 15.985 7.28333 15.985 7C15.985 6.71667 15.8892 6.47917 15.6975 6.2875C15.5058 6.09583 15.2683 6 14.985 6C14.7017 6 14.4642 6.09583 14.2725 6.2875C14.0808 6.47917 13.985 6.71667 13.985 7C13.985 7.28333 14.0808 7.52083 14.2725 7.7125C14.4642 7.90417 14.7017 8 14.985 8ZM12.985 5C13.2683 5 13.5058 4.90417 13.6975 4.7125C13.8892 4.52083 13.985 4.28333 13.985 4C13.985 3.71667 13.8892 3.47917 13.6975 3.2875C13.5058 3.09583 13.2683 3 12.985 3C12.7017 3 12.4642 3.09583 12.2725 3.2875C12.0808 3.47917 11.985 3.71667 11.985 4C11.985 4.28333 12.0808 4.52083 12.2725 4.7125C12.4642 4.90417 12.7017 5 12.985 5ZM5.735 8H7.235V6.25H8.985V4.75H7.235V3H5.735V4.75H3.985V6.25H5.735V8Z" fill="#4A6741"/>
  </svg>
);

const LeaveIcon = () => (
  <svg width="11" height="11" viewBox="0 0 11 11" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M1.16667 10.5C0.845833 10.5 0.571181 10.3858 0.342708 10.1573C0.114236 9.92882 0 9.65417 0 9.33333V1.16667C0 0.845833 0.114236 0.571181 0.342708 0.342708C0.571181 0.114236 0.845833 0 1.16667 0H5.25V1.16667H1.16667V9.33333H5.25V10.5H1.16667ZM7.58333 8.16667L6.78125 7.32083L8.26875 5.83333H3.5V4.66667H8.26875L6.78125 3.17917L7.58333 2.33333L10.5 5.25L7.58333 8.16667Z" fill="#DC2626"/>
  </svg>
);

const TimerIcon = () => (
  <svg width="8" height="10" viewBox="0 0 8 10" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M2 9H6V7.5C6 6.95 5.80417 6.47917 5.4125 6.0875C5.02083 5.69583 4.55 5.5 4 5.5C3.45 5.5 2.97917 5.69583 2.5875 6.0875C2.19583 6.47917 2 6.95 2 7.5V9ZM0 10V9H1V7.5C1 6.99167 1.11875 6.51458 1.35625 6.06875C1.59375 5.62292 1.925 5.26667 2.35 5C1.925 4.73333 1.59375 4.37708 1.35625 3.93125C1.11875 3.48542 1 3.00833 1 2.5V1H0V0H8V1H7V2.5C7 3.00833 6.88125 3.48542 6.64375 3.93125C6.40625 4.37708 6.075 4.73333 5.65 5C6.075 5.26667 6.40625 5.62292 6.64375 6.06875C6.88125 6.51458 7 6.99167 7 7.5V9H8V10H0Z" fill="white"/>
  </svg>
);

const InviteIcon = () => (
  <svg width="13" height="10" viewBox="0 0 13 10" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M9.91667 5.83333V4.08333H8.16667V2.91667H9.91667V1.16667H11.0833V2.91667H12.8333V4.08333H11.0833V5.83333H9.91667ZM4.66667 4.66667C4.025 4.66667 3.47569 4.43819 3.01875 3.98125C2.56181 3.52431 2.33333 2.975 2.33333 2.33333C2.33333 1.69167 2.56181 1.14236 3.01875 0.685417C3.47569 0.228472 4.025 0 4.66667 0C5.30833 0 5.85764 0.228472 6.31458 0.685417C6.77153 1.14236 7 1.69167 7 2.33333C7 2.975 6.77153 3.52431 6.31458 3.98125C5.85764 4.43819 5.30833 4.66667 4.66667 4.66667ZM0 9.33333V7.7C0 7.36944 0.0850694 7.06563 0.255208 6.78854C0.425347 6.51146 0.651389 6.3 0.933333 6.15417C1.53611 5.85278 2.14861 5.62674 2.77083 5.47604C3.39306 5.32535 4.025 5.25 4.66667 5.25C5.30833 5.25 5.94028 5.32535 6.5625 5.47604C7.18472 5.62674 7.79722 5.85278 8.4 6.15417C8.68194 6.3 8.90799 6.51146 9.07812 6.78854C9.24826 7.06563 9.33333 7.36944 9.33333 7.7V9.33333H0ZM1.16667 8.16667H8.16667V7.7C8.16667 7.59306 8.13993 7.49583 8.08646 7.40833C8.03299 7.32083 7.9625 7.25278 7.875 7.20417C7.35 6.94167 6.82014 6.74479 6.28542 6.61354C5.75069 6.48229 5.21111 6.41667 4.66667 6.41667C4.12222 6.41667 3.58264 6.48229 3.04792 6.61354C2.51319 6.74479 1.98333 6.94167 1.45833 7.20417C1.37083 7.25278 1.30035 7.32083 1.24688 7.40833C1.1934 7.49583 1.16667 7.59306 1.16667 7.7V8.16667ZM4.66667 3.5C4.9875 3.5 5.26215 3.38576 5.49062 3.15729C5.7191 2.92882 5.83333 2.65417 5.83333 2.33333C5.83333 2.0125 5.7191 1.73785 5.49062 1.50937C5.26215 1.2809 4.9875 1.16667 4.66667 1.16667C4.34583 1.16667 4.07118 1.2809 3.84271 1.50937C3.61424 1.73785 3.5 2.0125 3.5 2.33333C3.5 2.65417 3.61424 2.92882 3.84271 3.15729C4.07118 3.38576 4.34583 3.5 4.66667 3.5Z" fill="#6B7280"/>
  </svg>
);

const ChatIcon = () => (
  <svg width="17" height="17" viewBox="0 0 17 17" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M16.6667 16.6667L13.3333 13.3333H5C4.54167 13.3333 4.14931 13.1701 3.82292 12.8438C3.49653 12.5174 3.33333 12.125 3.33333 11.6667V10.8333H12.5C12.9583 10.8333 13.3507 10.6701 13.6771 10.3438C14.0035 10.0174 14.1667 9.625 14.1667 9.16667V3.33333H15C15.4583 3.33333 15.8507 3.49653 16.1771 3.82292C16.5035 4.14931 16.6667 4.54167 16.6667 5V16.6667ZM1.66667 8.47917L2.64583 7.5H10.8333V1.66667H1.66667V8.47917ZM0 12.5V1.66667C0 1.20833 0.163194 0.815972 0.489583 0.489583C0.815972 0.163194 1.20833 0 1.66667 0H10.8333C11.2917 0 11.684 0.163194 12.0104 0.489583C12.3368 0.815972 12.5 1.20833 12.5 1.66667V7.5C12.5 7.95833 12.3368 8.35069 12.0104 8.67708C11.684 9.00347 11.2917 9.16667 10.8333 9.16667H3.33333L0 12.5ZM1.66667 7.5V1.66667V7.5Z" fill="#6B7280"/>
  </svg>
);

const BellIcon = () => (
  <svg width="10" height="12" viewBox="0 0 10 12" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M0 9.91667V8.75H1.16667V4.66667C1.16667 3.85972 1.40972 3.14271 1.89583 2.51562C2.38194 1.88854 3.01389 1.47778 3.79167 1.28333V0.875C3.79167 0.631944 3.87674 0.425347 4.04688 0.255208C4.21701 0.0850694 4.42361 0 4.66667 0C4.90972 0 5.11632 0.0850694 5.28646 0.255208C5.4566 0.425347 5.54167 0.631944 5.54167 0.875V1.28333C6.31944 1.47778 6.95139 1.88854 7.4375 2.51562C7.92361 3.14271 8.16667 3.85972 8.16667 4.66667V8.75H9.33333V9.91667H0ZM4.66667 11.6667C4.34583 11.6667 4.07118 11.5524 3.84271 11.324C3.61424 11.0955 3.5 10.8208 3.5 10.5H5.83333C5.83333 10.8208 5.7191 11.0955 5.49062 11.324C5.26215 11.5524 4.9875 11.6667 4.66667 11.6667ZM2.33333 8.75H7V4.66667C7 4.025 6.77153 3.47569 6.31458 3.01875C5.85764 2.56181 5.30833 2.33333 4.66667 2.33333C4.025 2.33333 3.47569 2.56181 3.01875 3.01875C2.56181 3.47569 2.33333 4.025 2.33333 4.66667V8.75Z" fill="#4A6741"/>
  </svg>
);

const SmallPersonIcon = () => (
  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4.66667 4.66667C4.025 4.66667 3.47569 4.43819 3.01875 3.98125C2.56181 3.52431 2.33333 2.975 2.33333 2.33333C2.33333 1.69167 2.56181 1.14236 3.01875 0.685417C3.47569 0.228472 4.025 0 4.66667 0C5.30833 0 5.85764 0.228472 6.31458 0.685417C6.77153 1.14236 7 1.69167 7 2.33333C7 2.975 6.77153 3.52431 6.31458 3.98125C5.85764 4.43819 5.30833 4.66667 4.66667 4.66667ZM0 9.33333V7.7C0 7.36944 0.0850694 7.06563 0.255208 6.78854C0.425347 6.51146 0.651389 6.3 0.933333 6.15417C1.53611 5.85278 2.14861 5.62674 2.77083 5.47604C3.39306 5.32535 4.025 5.25 4.66667 5.25C5.30833 5.25 5.94028 5.32535 6.5625 5.47604C7.18472 5.62674 7.79722 5.85278 8.4 6.15417C8.68194 6.3 8.90799 6.51146 9.07812 6.78854C9.24826 7.06563 9.33333 7.36944 9.33333 7.7V9.33333H0ZM1.16667 8.16667H8.16667V7.7C8.16667 7.59306 8.13993 7.49583 8.08646 7.40833C8.03299 7.32083 7.9625 7.25278 7.875 7.20417C7.35 6.94167 6.82014 6.74479 6.28542 6.61354C5.75069 6.48229 5.21111 6.41667 4.66667 6.41667C4.12222 6.41667 3.58264 6.48229 3.04792 6.61354C2.51319 6.74479 1.98333 6.94167 1.45833 7.20417C1.37083 7.25278 1.30035 7.32083 1.24688 7.40833C1.1934 7.49583 1.16667 7.59306 1.16667 7.7V8.16667ZM4.66667 3.5C4.9875 3.5 5.26215 3.38576 5.49062 3.15729C5.7191 2.92882 5.83333 2.65417 5.83333 2.33333C5.83333 2.0125 5.7191 1.73785 5.49062 1.50937C5.26215 1.2809 4.9875 1.16667 4.66667 1.16667C4.34583 1.16667 4.07118 1.2809 3.84271 1.50937C3.61424 1.73785 3.5 2.0125 3.5 2.33333C3.5 2.65417 3.61424 2.92882 3.84271 3.15729C4.07118 3.38576 4.34583 3.5 4.66667 3.5Z" fill="#4F46E5"/>
  </svg>
);

const EmojiIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M13.5 9C13.9167 9 14.2708 8.85417 14.5625 8.5625C14.8542 8.27083 15 7.91667 15 7.5C15 7.08333 14.8542 6.72917 14.5625 6.4375C14.2708 6.14583 13.9167 6 13.5 6C13.0833 6 12.7292 6.14583 12.4375 6.4375C12.1458 6.72917 12 7.08333 12 7.5C12 7.91667 12.1458 8.27083 12.4375 8.5625C12.7292 8.85417 13.0833 9 13.5 9ZM6.5 9C6.91667 9 7.27083 8.85417 7.5625 8.5625C7.85417 8.27083 8 7.91667 8 7.5C8 7.08333 7.85417 6.72917 7.5625 6.4375C7.27083 6.14583 6.91667 6 6.5 6C6.08333 6 5.72917 6.14583 5.4375 6.4375C5.14583 6.72917 5 7.08333 5 7.5C5 7.91667 5.14583 8.27083 5.4375 8.5625C5.72917 8.85417 6.08333 9 6.5 9ZM10 15.5C11.1333 15.5 12.1625 15.1792 13.0875 14.5375C14.0125 13.8958 14.6833 13.05 15.1 12H13.45C13.0833 12.6167 12.5958 13.1042 11.9875 13.4625C11.3792 13.8208 10.7167 14 10 14C9.28333 14 8.62083 13.8208 8.0125 13.4625C7.40417 13.1042 6.91667 12.6167 6.55 12H4.9C5.31667 13.05 5.9875 13.8958 6.9125 14.5375C7.8375 15.1792 8.86667 15.5 10 15.5ZM10 20C8.61667 20 7.31667 19.7375 6.1 19.2125C4.88333 18.6875 3.825 17.975 2.925 17.075C2.025 16.175 1.3125 15.1167 0.7875 13.9C0.2625 12.6833 0 11.3833 0 10C0 8.61667 0.2625 7.31667 0.7875 6.1C1.3125 4.88333 2.025 3.825 2.925 2.925C3.825 2.025 4.88333 1.3125 6.1 0.7875C7.31667 0.2625 8.61667 0 10 0C11.3833 0 12.6833 0.2625 13.9 0.7875C15.1167 1.3125 16.175 2.025 17.075 2.925C17.975 3.825 18.6875 4.88333 19.2125 6.1C19.7375 7.31667 20 8.61667 20 10C20 11.3833 19.7375 12.6833 19.2125 13.9C18.6875 15.1167 17.975 16.175 17.075 17.075C16.175 17.975 15.1167 18.6875 13.9 19.2125C12.6833 19.7375 11.3833 20 10 20ZM10 18C12.2333 18 14.125 17.225 15.675 15.675C17.225 14.125 18 12.2333 18 10C18 7.76667 17.225 5.875 15.675 4.325C14.125 2.775 12.2333 2 10 2C7.76667 2 5.875 2.775 4.325 4.325C2.775 5.875 2 7.76667 2 10C2 12.2333 2.775 14.125 4.325 15.675C5.875 17.225 7.76667 18 10 18Z" fill="#6B7280"/>
  </svg>
);

const SendIcon = () => (
  <svg width="12" height="10" viewBox="0 0 12 10" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M0 9.33333V0L11.0833 4.66667L0 9.33333ZM1.16667 7.58333L8.07917 4.66667L1.16667 1.75V3.79167L4.66667 4.66667L1.16667 5.54167V7.58333ZM1.16667 7.58333V4.66667V1.75V3.79167V5.54167V7.58333Z" fill="white"/>
  </svg>
);

function QuizGameRoom({ roomCode }: { roomCode: string }) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const g = useGameRoom(roomCode);

  const { data: roomData } = useQuery({
    queryKey: ["game-room", roomCode],
    queryFn: () => apiFetch<GameRoomOut>(`/api/v1/games/rooms/code/${roomCode}`),
    enabled: !!roomCode,
    refetchInterval: 3000,
  });

  // Fetch current user
  const { data: currentUser } = useQuery({
    queryKey: ["me"],
    queryFn: () => apiFetch<UserOut>("/api/v1/users/me"),
  });

  // ── UI STATE VARIABLES ──
  const [activeTab, setActiveTab] = useState<"game" | "scores" | "chat">("game");
  const [isChatCollapsed, setIsChatCollapsed] = useState(false);
  const [message, setMessage] = useState("");
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const [showPauseModal, setShowPauseModal] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [invitedFriends, setInvitedFriends] = useState<string[]>([]);
  const [showEmojiDrawer, setShowEmojiDrawer] = useState(false);

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Fetch real friends
  const { data: friendsResponse } = useQuery({
    queryKey: ["my-friends"],
    queryFn: () => apiFetch<{ data: any[] }>("/api/v1/friends?page_size=100"),
  });
  const friendsList: Friend[] = (friendsResponse?.data ?? []).map((f: any) => ({
    id: String(f.user_id),
    name: f.full_name,
    status: "online" as "online" | "offline",
    avatarColor: "bg-blue-100",
  }));

  // Show result modal when game ends
  useEffect(() => {
    if (g.gameStatus === "ENDED") {
      setShowResultModal(true);
    }
  }, [g.gameStatus]);

  // Scroll to bottom of chat
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [g.messages]);

  // Format MM:SS
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  // Ready status of current user
  const myEntry = g.leaderboard.find((p) => Number(p.user_id) === Number(currentUser?.user_id));
  const readyMe = myEntry?.is_ready ?? false;

  // ── INTERACTIVE EVENT HANDLERS ──

  const handleSend = () => {
    if (!message.trim()) return;
    g.send(message.trim());
    setMessage("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (message.trim()) {
        g.send(message.trim());
        setMessage("");
      }
    }
  };

  const handleAddEmoji = (emoji: string) => {
    setMessage((m) => m + emoji);
    setShowEmojiDrawer(false);
  };

  const handleInviteFriend = async (friend: Friend) => {
    if (invitedFriends.includes(friend.id)) return;
    setInvitedFriends((prev) => [...prev, friend.id]);
    try {
      await inviteFriendToGameRoom(Number(friend.id), roomCode);
    } catch (err) {
      // Roll back the "Đã mời" state so the user can retry
      setInvitedFriends((prev) => prev.filter((id) => id !== friend.id));
      alert(err instanceof Error ? err.message : "Không gửi được lời mời");
    }
  };

  const handleLeaveRoom = () => {
    const confirmLeave = window.confirm(t("gameRoom.confirmLeave"));
    if (confirmLeave) {
      g.leave();
    }
  };

  const handlePauseMatch = () => {
    if (!g.isHost) return;
    g.pause();
    setShowPauseModal(true);
  };

  const handleResumeMatch = () => {
    if (!g.isHost) return;
    g.resume();
    setShowPauseModal(false);
  };

  const handleEndMatchEarly = () => {
    if (!g.isHost) return;
    g.end();
    setShowPauseModal(false);
  };

  // ── SORTED PLAYERS FOR LEADERBOARD ──
  const players = g.leaderboard.map((entry) => {
    const isMe = Number(entry.user_id) === Number(currentUser?.user_id);
    const nameInitial = entry.full_name.substring(0, 2);
    const avatarElement = entry.avatar_url ? (
      <img
        src={resolveAvatarUrl(entry.avatar_url)!}
        alt={entry.full_name}
        className="w-8 h-8 rounded-full object-cover"
      />
    ) : (
      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-800 text-[10px]">
        {nameInitial}
      </div>
    );

    return {
      id: String(entry.user_id),
      name: entry.full_name,
      isMe,
      score: entry.score,
      avatar: avatarElement,
      status: entry.is_ready ? "ready" : "waiting",
    };
  });

  const fallbackPlayer = currentUser ? [
    {
      id: "me",
      name: currentUser.full_name,
      isMe: true,
      score: 0,
      avatar: currentUser.avatar_url ? (
        <img src={resolveAvatarUrl(currentUser.avatar_url)!} alt={currentUser.full_name} className="w-8 h-8 rounded-full object-cover" />
      ) : (
        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-800 text-[10px]">
          {currentUser.full_name.substring(0, 2)}
        </div>
      ),
      status: "waiting" as const,
    }
  ] : [];

  const playersList = players.length > 0 ? players : fallbackPlayer;
  const sortedPlayers = [...playersList].sort((a, b) => b.score - a.score);
  const maxScore = Math.max(...playersList.map((p) => p.score), 1);

  return (
    <div
      className="h-screen flex flex-col overflow-hidden select-none"
      style={{ background: "#F3F4F6", fontFamily: "Inter, -apple-system, Roboto, Helvetica, sans-serif" }}
    >
      {/* ── HEADER NAVBAR ── */}
      <header
        className="flex-shrink-0 px-6"
        style={{ background: "#FFF", borderBottom: "1px solid #E2E8E2", boxShadow: "0 1px 2px 0 rgba(0,0,0,0.05)" }}
      >
        <div className="flex h-14 items-center justify-between">
          {/* Logo and Room Info */}
          <div className="flex items-center gap-4 min-w-0">
            <div className="flex items-center gap-2 cursor-pointer hover:opacity-80" onClick={() => navigate("/")}>
              <WeConnectLogo />
              <span className="text-[18px] leading-7 tracking-[-0.45px] font-extrabold text-[#2D3A3A]">
                WeConnect
              </span>
            </div>
            <div className="w-px h-6 bg-[#E2E8E2]" />
            <div className="flex items-center gap-2">
              <GameControllerIcon />
              <span className="text-[14px] font-semibold text-[#2D3A3A] hidden sm:inline">
                {t("gameRoom.title")}
              </span>
              <span className="text-[14px] text-gray-500 font-medium">
                #{roomCode}
              </span>
            </div>
          </div>

          {/* Status Badge & Leave Button */}
          <div className="flex items-center gap-4">
            <div
              className={cn(
                "flex items-center gap-2 px-3 py-1 rounded-full border",
                g.gameStatus === "WAITING" 
                  ? "bg-amber-50/50 border-amber-200/50 text-amber-600" 
                  : "bg-[#F1F5F0] border-[#E2E8E2] text-[#4A6741]"
              )}
            >
              <div className={cn(
                "w-2 h-2 rounded-full",
                g.gameStatus === "WAITING" ? "bg-amber-500 animate-pulse" : "bg-green-500 animate-pulse"
              )} />
              <span className="text-[11px] font-bold tracking-[0.55px] uppercase">
                {g.gameStatus === "WAITING" 
                  ? t("gameRoom.waiting") 
                  : (g.paused ? t("gameRoom.paused") : t("gameRoom.playing"))}
              </span>
            </div>

            <button
              onClick={handleLeaveRoom}
              className="flex items-center gap-2 px-4 py-1.5 rounded-lg border border-red-100 bg-red-50 hover:bg-red-100 transition duration-200"
            >
              <LeaveIcon />
              <span className="text-[12px] font-bold text-red-600">
                {t("gameRoom.leaveRoom")}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Tab Switcher */}
      <div className="md:hidden flex bg-white border-b border-[#E2E8E2] flex-shrink-0">
        <button
          onClick={() => setActiveTab("game")}
          className={cn(
            "flex-1 py-3 text-xs font-bold text-center border-b-2 transition-colors",
            activeTab === "game"
              ? "text-[#4A6741] border-[#4A6741] bg-[rgba(241,245,240,0.5)]"
              : "text-gray-500 border-transparent hover:text-[#2D3A3A]"
          )}
        >
          🎮 Trò chơi
        </button>
        <button
          onClick={() => setActiveTab("scores")}
          className={cn(
            "flex-1 py-3 text-xs font-bold text-center border-b-2 transition-colors",
            activeTab === "scores"
              ? "text-[#4A6741] border-[#4A6741] bg-[rgba(241,245,240,0.5)]"
              : "text-gray-500 border-transparent hover:text-[#2D3A3A]"
          )}
        >
          🏆 Bảng điểm
        </button>
        <button
          onClick={() => setActiveTab("chat")}
          className={cn(
            "flex-1 py-3 text-xs font-bold text-center border-b-2 transition-colors",
            activeTab === "chat"
              ? "text-[#4A6741] border-[#4A6741] bg-[rgba(241,245,240,0.5)]"
              : "text-gray-500 border-transparent hover:text-[#2D3A3A]"
          )}
        >
          💬 Chat &amp; Người chơi
        </button>
      </div>

      {/* ── MAIN THREE-COLUMN LAYOUT ── */}
      <div className="flex flex-1 overflow-hidden flex-col md:flex-row">
        
        {/* ── LEFT SIDEBAR: TIME & USER LIST & ACTIONS ── */}
        <aside
          className={cn(
            "flex-shrink-0 w-full md:w-64 lg:w-80 flex flex-col overflow-hidden bg-white border-r border-[#E2E8E2]",
            activeTab === "chat" ? "flex" : "hidden md:flex"
          )}
        >
          {/* Total Game Timer */}
          <div className="flex flex-col items-start gap-3 p-6 bg-slate-50/50 border-b border-[#E2E8E2] flex-shrink-0">
            <span className="text-[10px] font-bold tracking-[2px] uppercase text-gray-500">
              {t("gameRoom.matchTime")}
            </span>
            <div className="flex flex-col items-center justify-center w-full rounded-2xl p-4 bg-[#2D3A3A] shadow-inner">
              <span className="text-[36px] font-black leading-10 tracking-[3.6px] text-white">
                {formatTime(g.matchLeft)}
              </span>
              <div className="flex items-center gap-1.5 mt-1 opacity-60">
                <TimerIcon />
                <span className="text-[10px] font-bold uppercase text-white tracking-wider">
                  {t("gameRoom.total")}
                </span>
              </div>
            </div>
          </div>

          {/* Player List */}
          <div className="flex flex-col gap-4 p-4 flex-grow overflow-y-auto">
            <span className="text-[10px] font-bold tracking-[1px] uppercase text-gray-500">
              {t("gameRoom.participants")} ({g.leaderboard.length}/{roomData?.max_players || 10})
            </span>
            <div className="flex flex-col gap-3">
              {g.leaderboard.map((entry) => {
                const isMe = Number(entry.user_id) === Number(currentUser?.user_id);
                const isHost = Number(entry.user_id) === Number(roomData?.host_id);
                const nameInitial = entry.full_name.substring(0, 2);

                return (
                  <div
                    key={entry.user_id}
                    className={`flex items-center gap-4 p-4 rounded-2xl border relative ${
                      isMe ? "border-green-200/50 bg-[#F1F5F0]" : "border-[#E2E8E2] bg-slate-50"
                    }`}
                  >
                    <div className="relative flex-shrink-0">
                      {entry.avatar_url ? (
                        <img
                          src={resolveAvatarUrl(entry.avatar_url)!}
                          alt={entry.full_name}
                          className="w-12 h-12 rounded-2xl object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center font-bold text-blue-800">
                          {nameInitial}
                        </div>
                      )}
                      {isHost && (
                        <div className="absolute -top-1.5 -left-1.5 w-5 h-5 flex items-center justify-center rounded-full border bg-white shadow-sm">
                          <div className="text-[10px]">👑</div>
                        </div>
                      )}
                      <div
                        className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-white ${
                          entry.is_ready ? "bg-green-500" : "bg-blue-500"
                        }`}
                      />
                    </div>
                    <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                      <span className="text-[14px] font-bold leading-5 text-[#2D3A3A] truncate">
                        {isMe ? `${t("gameRoom.you")} (${entry.full_name})` : entry.full_name}
                      </span>
                      <span
                        className={`text-[10px] font-semibold tracking-[0.25px] uppercase ${
                          entry.is_ready ? "text-[#4A6741]" : "text-blue-500"
                        }`}
                      >
                        {entry.is_ready ? t("gameRoom.statusReady") : t("gameRoom.statusWaiting")}
                      </span>
                    </div>
                  </div>
                );
              })}

              {/* Invite Friend Button */}
              <button
                onClick={() => setShowInviteModal(true)}
                className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl border-2 border-dashed border-[#E2E8E2] text-gray-500 hover:text-[#4A6741] hover:border-[#4A6741] hover:bg-[#F1F5F0] transition duration-200"
              >
                <InviteIcon />
                <span className="text-[12px] font-bold">
                  {t("gameRoom.inviteFriends")}
                </span>
              </button>
            </div>
          </div>

          {/* Action buttons (Host controls) */}
          <div className="flex gap-2 p-4 border-t border-[#E2E8E2] bg-white flex-shrink-0">
            <button
              onClick={handlePauseMatch}
              disabled={g.gameStatus !== "PLAYING" || g.paused || !g.isHost}
              className="flex-1 py-2 rounded-lg text-[12px] font-bold border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200"
            >
              {t("gameRoom.stopMatch")}
            </button>
            <button
              onClick={g.ready}
              className="flex-1 py-2 rounded-lg text-[12px] font-bold text-white transition duration-200"
              style={{ background: readyMe ? "#3B82F6" : "#4A6741" }}
            >
              {readyMe ? t("gameRoom.waitingMatch") : t("gameRoom.ready")}
            </button>
          </div>
        </aside>

        {/* ── MIDDLE GAME CARD & CHAT PANEL ── */}
        <div className={cn(
          "flex-1 flex flex-col overflow-hidden min-w-0 bg-[#F1F5F9] border-r border-[#E2E8E2]",
          activeTab !== "scores" ? "flex" : "hidden md:flex"
        )}>
          
          {/* Central Question Container */}
          <div className={cn(
            "flex-grow flex items-center justify-center p-6 overflow-y-auto",
            activeTab === "game" ? "flex" : "hidden md:flex"
          )}>
            {g.gameStatus === "WAITING" ? (
              <div className="relative w-full max-w-[600px] bg-white border border-[#E2E8E2] rounded-[32px] p-8 shadow-sm overflow-hidden flex flex-col items-center justify-center text-center min-h-[380px]">
                {/* Decorative game console icon */}
                <div className="w-20 h-20 bg-slate-50 border border-slate-100 rounded-3xl flex items-center justify-center mb-6 text-4xl shadow-inner animate-bounce">
                  🎮
                </div>
                <h2 className="text-[22px] font-black text-[#2D3A3A] mb-3">
                  {t("gameRoom.gameLobby")}
                </h2>
                <p className="text-sm text-gray-500 max-w-[340px] mb-8 font-medium leading-relaxed">
                  {g.isHost 
                    ? t("gameRoom.hostWaitingMsg") 
                    : t("gameRoom.guestWaitingMsg")}
                </p>

                {g.isHost ? (
                  <button
                    onClick={g.start}
                    className="px-8 py-3.5 bg-[#4A6741] hover:bg-[#3c5435] text-white font-extrabold rounded-2xl transition duration-200 shadow-lg shadow-green-100 flex items-center gap-2 text-sm uppercase tracking-wider active:scale-95 cursor-pointer"
                  >
                    {t("gameRoom.startMatch")}
                  </button>
                ) : (
                  <div className="flex items-center gap-2.5 px-5 py-3 rounded-2xl bg-[#F1F5F0] border border-green-100">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-ping" />
                    <span className="text-xs font-bold text-[#4A6741]">
                      {t("gameRoom.waitingHost")}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="relative w-full max-w-[600px] bg-white border border-[#E2E8E2] rounded-3xl p-6 shadow-sm overflow-hidden flex flex-col items-center">
                
                {/* Lightning decorative SVGs */}
                <div className="absolute left-6 top-6 opacity-25 animate-bounce">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="#22C55E">
                    <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" />
                  </svg>
                </div>
                <div className="absolute right-6 top-10 opacity-25 animate-bounce delay-200">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="#EAB308">
                    <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" />
                  </svg>
                </div>

                {/* Quiz Badge */}
                <div className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-green-500 text-white shadow-sm mb-4">
                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                    <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" />
                  </svg>
                  <span className="text-[12px] font-extrabold tracking-wide uppercase">
                    {g.activeQuestion?.category}
                  </span>
                </div>

                {/* Question Text */}
                <h2 className="text-[20px] font-extrabold text-center text-[#2D3A3A] mb-1.5 max-w-[500px]">
                  {g.activeQuestion?.question}
                </h2>
                <p className="text-[12px] text-gray-500 font-semibold mb-6">
                  {g.activeQuestion?.description}
                </p>

                {/* 4 Answer Grid Options */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 w-full mb-6">
                  {g.activeQuestion?.options.map((opt, idx) => {
                    const isSelected = g.selected === idx;
                    const showRight = g.reveal === idx;
                    const showWrong = g.selected === idx && g.reveal !== null && g.reveal !== idx;

                    let borderClass = "border-[#E2E8E2] hover:border-green-300";
                    let bgClass = "bg-white";
                    let textClass = "text-[#2D3A3A]";

                    if (showRight) {
                      borderClass = "border-green-500 border-2";
                      bgClass = "bg-green-50";
                      textClass = "text-green-700 font-extrabold";
                    } else if (showWrong) {
                      borderClass = "border-red-500 border-2";
                      bgClass = "bg-red-50";
                      textClass = "text-red-700 font-extrabold";
                    } else if (isSelected) {
                      borderClass = "border-green-500 border-2";
                      bgClass = "bg-green-50";
                    }

                    return (
                      <button
                        key={idx}
                        onClick={() => g.answer(idx)}
                        disabled={!g.windowOpen || g.alreadyAnswered}
                        className={`answer-card px-5 py-4 rounded-2xl border text-center transition duration-200 cursor-pointer disabled:cursor-default ${borderClass} ${bgClass}`}
                      >
                        <span className={`text-[14px] font-bold ${textClass}`}>
                          {opt}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Progress Bar and Hint */}
                <div className="w-full flex flex-col items-center gap-3">
                  <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-1000"
                      style={{
                        width: `${(g.secondsLeft / clock.ANSWER_WINDOW_SECONDS) * 100}%`,
                        background: g.secondsLeft <= 3 ? "#EF4444" : "#22C55E",
                      }}
                    />
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-[#2D3A3A]">
                    <svg className="w-4 h-4 text-gray-500 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    <span>
                      {t("gameRoom.answerFast")}{" "}
                      <strong className={g.secondsLeft <= 3 ? "text-red-500 font-bold" : "text-green-600 font-bold"}>
                        {g.secondsLeft} {t("gameRoom.seconds")}
                      </strong>.
                    </span>
                  </div>
                </div>

              </div>
            )}
          </div>

          {/* ── BOTTOM PANEL: CHAT CLIENT ── */}
          <div
            className={cn(
              "flex-shrink-0 flex flex-col bg-white border-t border-[#E2E8E2] w-full transition-all duration-300",
              activeTab === "chat" 
                ? "flex-1 h-full" 
                : (isChatCollapsed ? "h-11 overflow-hidden" : "h-64 md:h-64")
            )}
          >
            {/* Chat header */}
            <div className="flex items-center justify-between px-6 py-2.5 bg-slate-50/80 border-b border-[#E2E8E2]">
              <div className="flex items-center gap-2">
                <ChatIcon />
                <span className="text-[11px] font-black tracking-wider uppercase text-[#2D3A3A]">
                  {t("gameRoom.lobbyAndFeedback")}
                </span>
                {unreadMessageCount > 0 && (
                  <div className="px-2 py-0.5 rounded-full bg-[#F1F5F0]">
                    <span className="text-[10px] font-bold text-[#4A6741]">
                      {t("gameRoom.newMessages", { count: unreadMessageCount })}
                    </span>
                  </div>
                )}
              </div>
              <button 
                onClick={() => setIsChatCollapsed(!isChatCollapsed)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-slate-200/50"
                title={isChatCollapsed ? "Mở rộng chat" : "Thu gọn chat"}
              >
                {isChatCollapsed ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                  </svg>
                )}
              </button>
            </div>

            {/* Message Log */}
            <div
              ref={chatContainerRef}
              className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-3"
            >
              {g.messages.map((msg) => (
                <div key={msg.id}>
                  {msg.type === "system" && (
                    <div className="flex items-start gap-2">
                      <div className="w-7 h-7 flex items-center justify-center rounded-lg bg-green-100 flex-shrink-0">
                        <BellIcon />
                      </div>
                      <div className="flex flex-col gap-0.5 min-w-0">
                        <span className="text-[10px] font-bold text-[#4A6741]">
                          {t("gameRoom.system")}
                        </span>
                        <div className="px-2.5 py-1.5 rounded-tr-xl rounded-br-xl rounded-bl-xl bg-[#F1F5F0]/50 border border-green-100">
                          <p className="text-[12px] text-[#2D3A3A] italic">
                            {msg.text}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {msg.type === "other" && (
                    <div className="flex items-start gap-2">
                      <div className="w-7 h-7 flex items-center justify-center rounded-lg bg-[#E0E7FF] flex-shrink-0">
                        <SmallPersonIcon />
                      </div>
                      <div className="flex flex-col gap-0.5 min-w-0">
                        <span className="text-[10px] font-bold text-[#2D3A3A]">
                          {msg.name}
                        </span>
                        <div className="px-2.5 py-1.5 rounded-tr-xl rounded-br-xl rounded-bl-xl bg-[#F1F5F9] border border-[#E2E8E2]">
                          <p className="text-[12px] text-[#2D3A3A]">
                            {msg.text}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {msg.type === "me" && (
                    <div className="flex items-start gap-2 justify-end">
                      <div className="flex flex-col items-end gap-0.5 min-w-0">
                        <span className="text-[10px] font-bold text-[#2D3A3A]">
                          {msg.name}
                        </span>
                        <div className="px-2.5 py-1.5 rounded-tl-xl rounded-br-xl rounded-bl-xl bg-[#4A6741]">
                          <p className="text-[12px] text-white">
                            {msg.text}
                          </p>
                        </div>
                      </div>
                      <div className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-800 text-white text-[10px] flex-shrink-0 font-bold">
                        {currentUser?.full_name ? currentUser.full_name.substring(0, 2).toUpperCase() : "LM"}
                      </div>
                    </div>
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input message container */}
            <div className="flex items-center gap-3 px-4 py-3 border-t border-[#E2E8E2] bg-white relative flex-shrink-0">
              <div className="flex items-center gap-2 flex-1 px-4 py-2 rounded-2xl border border-[#E2E8E2] bg-[#F8FAFC]">
                <button
                  onClick={() => setShowEmojiDrawer(!showEmojiDrawer)}
                  className="hover:opacity-75 focus:outline-none"
                >
                  <EmojiIcon />
                </button>
                <input
                  type="text"
                  value={message}
                  onChange={(e) => {
                    setMessage(e.target.value);
                    setUnreadMessageCount(0);
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder={t("gameRoom.typeMessage")}
                  className="flex-1 bg-transparent text-[14px] outline-none text-[#2D3A3A]"
                />
              </div>

              <button
                onClick={handleSend}
                className="flex items-center gap-1.5 px-5 py-2 rounded-2xl text-white font-bold bg-[#4A6741] hover:bg-[#3c5435] transition duration-200"
              >
                <span className="text-[13px]">{t("gameRoom.send")}</span>
                <SendIcon />
              </button>

              {/* Mock Emoji Drawer popup */}
              {showEmojiDrawer && (
                <div className="absolute left-6 bottom-16 bg-white border border-[#E2E8E2] rounded-2xl p-3 shadow-md z-40 flex gap-2">
                  {["😊", "👍", "🔥", "⚡", "🎉", "🤣", "😮", "🤔"].map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => handleAddEmoji(emoji)}
                      className="text-xl hover:scale-125 transition duration-150"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── RIGHT SIDEBAR: SCOREBOARD (BẢNG ĐIỂM) ── */}
        <aside className={cn(
          "flex-shrink-0 w-full md:w-64 lg:w-80 flex flex-col bg-white border-l border-[#E2E8E2] overflow-y-auto p-4 gap-4",
          activeTab === "scores" ? "flex" : "hidden md:flex"
        )}>
          <div className="flex items-center gap-1.5 px-3 py-1 bg-orange-50 text-orange-600 border border-orange-200/50 rounded-full self-start flex-shrink-0">
            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
              <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" />
            </svg>
            <span className="text-[10px] font-black tracking-wider uppercase">
              {t("gameRoom.competing")}
            </span>
          </div>

          <h3 className="text-[14px] font-black tracking-widest text-[#2D3A3A] uppercase border-b border-[#E2E8E2] pb-2 flex-shrink-0">
            {t("gameRoom.scoreboard")}
          </h3>

          <div className="flex flex-col gap-3">
            {sortedPlayers.map((player, idx) => {
              const isGold = idx === 0;
              const isSilver = idx === 1;
              const isBronze = idx === 2;

              let badgeBg = "bg-gray-100 text-gray-500";
              let fillBg = "bg-gray-400";
              if (isGold) {
                badgeBg = "bg-yellow-100 text-yellow-600";
                fillBg = "bg-yellow-500";
              } else if (isSilver) {
                badgeBg = "bg-slate-100 text-slate-500";
                fillBg = "bg-slate-500";
              } else if (isBronze) {
                badgeBg = "bg-orange-100 text-orange-600";
                fillBg = "bg-orange-500";
              }

              // Calculate fill width percentage relative to max score
              const barPercent = Math.max(15, Math.min(100, (player.score / maxScore) * 100));

              return (
                <div
                  key={player.id}
                  className={`flex items-center gap-3 p-3 rounded-2xl border transition duration-200 ${
                    player.isMe
                      ? "border-green-200 bg-[#F1F5F0]"
                      : "border-gray-100 hover:bg-slate-50"
                  }`}
                >
                  {/* Rank Badge */}
                  <div className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold ${badgeBg}`}>
                    {idx + 1}
                  </div>

                  {/* Character Avatar */}
                  <div className="relative">
                    {player.avatar}
                    {player.isMe && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 border border-white rounded-full flex items-center justify-center text-[9px] shadow-sm">
                        👑
                      </div>
                    )}
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white bg-green-500" />
                  </div>

                  {/* Player Name and Score Bar */}
                  <div className="flex flex-col flex-1 min-w-0 gap-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[13px] font-bold text-[#2D3A3A] truncate">
                        {player.name}
                      </span>
                      {player.isMe && (
                        <span className="px-1.5 py-0.5 text-[8px] font-extrabold uppercase bg-green-500 text-white rounded">
                          {t("gameRoom.you")}
                        </span>
                      )}
                    </div>
                    {/* Visual Progress Bar */}
                    <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${fillBg}`}
                        style={{ width: `${barPercent}%` }}
                      />
                    </div>
                  </div>

                  {/* Active Score */}
                  <span className={`text-[15px] font-black ${player.isMe ? "text-green-600" : "text-[#2D3A3A]"}`}>
                    {player.score}
                  </span>
                </div>
              );
            })}
          </div>
        </aside>

      </div>

      {/* ── MODAL: INVITE FRIENDS ── */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#E2E8E2] rounded-3xl p-6 shadow-xl w-full max-w-[380px] animate-scale-in">
            <div className="flex justify-between items-center border-b border-[#E2E8E2] pb-3 mb-4">
              <h3 className="text-md font-bold text-[#2D3A3A]">{t("gameRoom.inviteToRoom")}</h3>
              <button
                onClick={() => setShowInviteModal(false)}
                className="text-gray-500 hover:text-red-500 text-xl font-bold"
              >
                &times;
              </button>
            </div>

            <div className="flex flex-col gap-3">
              {friendsList.map((friend) => {
                const isInvited = invitedFriends.includes(friend.id);
                const isAlreadyInRoom = (roomData?.participants || []).some((p) => String(p.user_id) === friend.id);
                return (
                  <div key={friend.id} className="flex items-center justify-between p-2 rounded-2xl hover:bg-slate-50 border border-transparent hover:border-[#E2E8E2] transition">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl ${friend.avatarColor} flex items-center justify-center text-sm font-bold text-slate-700`}>
                        {friend.name.substring(0, 2)}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-[#2D3A3A]">{friend.name}</span>
                        <span className="text-[10px] text-gray-500">
                          {friend.status === "online" ? `🟢 ${t("gameRoom.online")}` : `⚪ ${t("gameRoom.offline")}`}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleInviteFriend(friend)}
                      disabled={isAlreadyInRoom || isInvited || friend.status === "offline"}
                      className={`px-3 py-1.5 rounded-lg text-[11px] font-bold text-white transition ${
                        isAlreadyInRoom
                          ? "bg-slate-200 cursor-default text-slate-500"
                          : isInvited
                          ? "bg-gray-300 cursor-default"
                          : friend.status === "offline"
                          ? "bg-gray-200 cursor-not-allowed opacity-50"
                          : "bg-[#4A6741] hover:bg-[#3c5435]"
                      }`}
                    >
                      {isAlreadyInRoom ? t("gameRoom.inRoom") : isInvited ? t("gameRoom.invited") : t("gameRoom.invite")}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: ADMIN PAUSE GAME ("Dừng trận đấu") ── */}
      {showPauseModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#E2E8E2] rounded-3xl p-6 shadow-2xl w-full max-w-[420px] animate-scale-in">
            {/* Header */}
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                  ⚠️
                </div>
                <h3 className="text-lg font-black text-red-600">{t("gameRoom.pauseMatch")}</h3>
              </div>
              <button
                onClick={handleResumeMatch}
                className="text-gray-500 hover:text-red-500 text-xl font-bold"
              >
                &times;
              </button>
            </div>

            {/* Description */}
            <p className="text-[13px] text-gray-600 leading-relaxed mb-4">
              {t("gameRoom.pauseMatchDesc")}
            </p>

            {/* Yellow Warning details box */}
            <div className="bg-orange-50 border border-orange-200/50 rounded-2xl p-4 mb-5">
              <div className="flex items-center gap-2 mb-2 text-[13px] font-bold text-orange-700">
                <span>⏰</span>
                <span>{t("gameRoom.matchWillPause")}</span>
              </div>
              <ul className="text-xs text-orange-600 space-y-1.5 pl-5 list-disc font-medium">
                <li>{t("gameRoom.pauseRule1")}</li>
                <li>{t("gameRoom.pauseRule2")}</li>
                <li>{t("gameRoom.pauseRule3")}</li>
              </ul>
            </div>

            {/* Action separator */}
            <div className="flex items-center justify-center mb-5 relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#E2E8E2]" />
              </div>
              <span className="relative px-3 bg-white text-[10px] font-black uppercase text-gray-500 tracking-wider">
                {t("gameRoom.whatNext")}
              </span>
            </div>

            {/* Actions Grid */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              {/* Resume button */}
              <button
                onClick={handleResumeMatch}
                className="flex flex-col items-center gap-2 p-4 rounded-2xl border border-green-200 bg-green-50 hover:bg-green-100 transition duration-200 group text-left cursor-pointer"
              >
                <div className="w-9 h-9 rounded-full bg-green-200 flex items-center justify-center text-green-700 group-hover:scale-110 transition duration-200">
                  ▶️
                </div>
                <div className="flex flex-col items-center text-center">
                  <span className="text-[13px] font-extrabold text-green-700">{t("gameRoom.resumeMatch")}</span>
                  <span className="text-[9px] text-green-600 font-medium">{t("gameRoom.resumeMatchDesc")}</span>
                </div>
              </button>

              {/* End button */}
              <button
                onClick={handleEndMatchEarly}
                className="flex flex-col items-center gap-2 p-4 rounded-2xl border border-orange-200 bg-orange-50 hover:bg-orange-100 transition duration-200 group text-left cursor-pointer"
              >
                <div className="w-9 h-9 rounded-full bg-orange-200 flex items-center justify-center text-orange-700 group-hover:scale-110 transition duration-200">
                  🏳️
                </div>
                <div className="flex flex-col items-center text-center">
                  <span className="text-[13px] font-extrabold text-orange-700">{t("gameRoom.endMatch")}</span>
                  <span className="text-[9px] text-orange-600 font-medium">{t("gameRoom.endMatchDesc")}</span>
                </div>
              </button>
            </div>

            {/* Authorizations Footer */}
            <div className="flex items-center gap-2 border-t border-[#E2E8E2] pt-4 text-[10px] text-gray-500 font-medium justify-center">
              <span>🔒</span>
              <span>{t("gameRoom.adminOnly")}</span>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: FINAL RESULT LEADERBOARD PODIUM ── */}
      {showResultModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#E2E8E2] rounded-3xl p-6 shadow-2xl w-full max-w-[620px] animate-scale-in">
            
            {/* Header */}
            <div className="flex justify-between items-center border-b border-[#E2E8E2] pb-3 mb-5">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🏆</span>
                <h2 className="text-[16px] font-black text-[#2D3A3A] tracking-wider uppercase">
                  {t("gameRoom.finalScoreboard")}
                </h2>
              </div>
              <button
                onClick={() => setShowResultModal(false)}
                className="text-gray-500 hover:text-red-500 text-xl font-bold"
              >
                &times;
              </button>
            </div>

            <p className="text-[13px] text-gray-600 font-semibold mb-6 text-center">
              {t("gameRoom.matchEndedMsg")}
            </p>

            {/* Horizontal Podium Display */}
            <div className="flex items-end justify-center gap-6 mb-8 mt-4">
              
              {/* Silver Rank (2nd Position) */}
              <div className="flex flex-col items-center flex-1">
                <div className="relative mb-2">
                  {sortedPlayers[1]?.avatar}
                  <div className="absolute -bottom-2 -right-2 w-6 h-6 rounded-full border bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-600 shadow-sm">
                    2
                  </div>
                </div>
                <h4 className="text-[12px] font-bold text-[#2D3A3A] truncate max-w-[100px]">
                  {sortedPlayers[1]?.name}
                </h4>
                <span className="text-[13px] font-black text-slate-500 mt-1">
                  {sortedPlayers[1]?.score} <span className="text-[10px] text-gray-400 font-semibold">{t("gameRoom.points")}</span>
                </span>
                {/* Podium Block */}
                <div className="w-24 h-16 bg-slate-100 border-t border-[#E2E8E2] rounded-t-xl mt-2 flex items-center justify-center text-xs font-bold text-slate-400">
                  {t("gameRoom.rank")} 2
                </div>
              </div>

              {/* Gold Rank (1st Position - Highlighted center) */}
              <div className="flex flex-col items-center flex-1 -translate-y-4">
                <span className="text-xl animate-bounce mb-1">👑</span>
                <div className="relative mb-2">
                  {sortedPlayers[0]?.avatar}
                  <div className="absolute -bottom-2 -right-2 w-6 h-6 rounded-full border bg-yellow-400 flex items-center justify-center text-[10px] font-bold text-white shadow-md">
                    1
                  </div>
                </div>
                <h4 className="text-[13px] font-extrabold text-[#2D3A3A] truncate max-w-[110px] flex items-center gap-1">
                  {sortedPlayers[0]?.name}
                  {sortedPlayers[0]?.isMe && (
                    <span className="text-[9px] px-1 py-0.2 bg-green-500 text-white rounded">{t("gameRoom.you")}</span>
                  )}
                </h4>
                <span className="text-[15px] font-black text-yellow-600 mt-1">
                  {sortedPlayers[0]?.score} <span className="text-[10px] text-gray-400 font-semibold">{t("gameRoom.points")}</span>
                </span>
                {/* Podium Block */}
                <div className="w-28 h-24 bg-yellow-50 border-t border-yellow-200 rounded-t-xl mt-2 flex items-center justify-center text-xs font-extrabold text-yellow-600 shadow-sm">
                  {t("gameRoom.champion")}
                </div>
              </div>

              {/* Bronze Rank (3rd Position) */}
              <div className="flex flex-col items-center flex-1">
                <div className="relative mb-2">
                  {sortedPlayers[2]?.avatar}
                  <div className="absolute -bottom-2 -right-2 w-6 h-6 rounded-full border bg-orange-200 flex items-center justify-center text-[10px] font-bold text-orange-700 shadow-sm">
                    3
                  </div>
                </div>
                <h4 className="text-[12px] font-bold text-[#2D3A3A] truncate max-w-[100px]">
                  {sortedPlayers[2]?.name}
                </h4>
                <span className="text-[13px] font-black text-orange-600 mt-1">
                  {sortedPlayers[2]?.score} <span className="text-[10px] text-gray-400 font-semibold">{t("gameRoom.points")}</span>
                </span>
                {/* Podium Block */}
                <div className="w-24 h-12 bg-orange-50 border-t border-orange-100 rounded-t-xl mt-2 flex items-center justify-center text-xs font-bold text-orange-400">
                  {t("gameRoom.rank")} 3
                </div>
              </div>

            </div>

            {/* Rank 4 list indicator */}
            {sortedPlayers[3] && (
              <div className="flex items-center justify-between p-3 bg-gray-50 border border-gray-100 rounded-2xl w-full max-w-[400px] mx-auto mb-6">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-gray-400 w-4 text-center">4</span>
                  {sortedPlayers[3].avatar}
                  <span className="text-xs font-bold text-[#2D3A3A]">{sortedPlayers[3].name}</span>
                </div>
                <span className="text-xs font-bold text-gray-500">{sortedPlayers[3].score} {t("gameRoom.points")}</span>
              </div>
            )}

            {/* Buttons control */}
            <div className="flex items-center justify-end gap-3 border-t border-[#E2E8E2] pt-4">
              {g.isHost && (
                <button
                  onClick={g.start}
                  className="px-5 py-2.5 rounded-xl border border-[#4A6741] text-[#4A6741] font-bold hover:bg-[#F1F5F0] transition duration-200 cursor-pointer"
                >
                  {t("gameRoom.playAgain")}
                </button>
              )}
              <button
                onClick={g.leave}
                className="px-5 py-2.5 rounded-xl bg-[#4A6741] text-white font-bold hover:bg-[#3c5435] transition duration-200 cursor-pointer"
              >
                {t("gameRoom.exitRoom")}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

export default function Index() {
  const roomCode = new URLSearchParams(window.location.search).get("code") || "";
  const { data: roomData, isLoading } = useQuery({
    queryKey: ["game-room-route", roomCode],
    queryFn: () => apiFetch<GameRoomOut>(`/api/v1/games/rooms/code/${roomCode}`),
    enabled: !!roomCode,
  });

  if (!roomCode) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        Không tìm thấy mã phòng
      </div>
    );
  }

  if (isLoading && !roomData) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        Đang tải phòng...
      </div>
    );
  }

  if (roomData?.room_type === "SHIRITORI") {
    return <ShiritoriRoomView roomCode={roomCode} />;
  }

  return <QuizGameRoom roomCode={roomCode} />;
}
