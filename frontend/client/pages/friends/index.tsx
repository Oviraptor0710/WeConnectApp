import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import { useTranslation } from "react-i18next";
import {
  getReceivedRequests,
  getFriendSuggestions,
  listFriends,
  acceptFriendRequest,
  rejectFriendRequest,
  sendFriendRequest,
  unfriend,
  FriendRequestWithUser,
  UserSearchOut,
} from "@/lib/friendsApi";

const API_URL = (import.meta.env.VITE_API_URL as string) || "";

function getAvatarUrl(url?: string) {
  if (!url) return undefined;
  return url.startsWith("http") ? url : `${API_URL}${url}`;
}

// ── SVG Icons ──────────────────────────────────────────────────────────────
function MessageBubbleIcon() {
  return (
    <svg width="17" height="18" viewBox="0 0 17 18" fill="none">
      <path
        d="M0 16.6667V1.66667C0 1.20833 0.163194 0.815972 0.489583 0.489583C0.815972 0.163194 1.20833 0 1.66667 0H15C15.4583 0 15.8507 0.163194 16.1771 0.489583C16.5035 0.815972 16.6667 1.20833 16.6667 1.66667V11.6667C16.6667 12.125 16.5035 12.5174 16.1771 12.8438C15.8507 13.1701 15.4583 13.3333 15 13.3333H3.33333L0 16.6667ZM2.625 11.6667H15V1.66667H1.66667V12.6042L2.625 11.6667Z"
        fill="#4A6741"
      />
    </svg>
  );
}

function RemoveFriendIcon() {
  return (
    <svg width="18" height="14" viewBox="0 0 18 14" fill="none">
      <path
        d="M12.5 5.83333V4.16667H17.5V5.83333H12.5ZM6.66667 6.66667C5.75 6.66667 4.96528 6.34028 4.3125 5.6875C3.65972 5.03472 3.33333 4.25 3.33333 3.33333C3.33333 2.41667 3.65972 1.63194 4.3125 0.979167C4.96528 0.326389 5.75 0 6.66667 0C7.58333 0 8.36806 0.326389 9.02083 0.979167C9.67361 1.63194 10 2.41667 10 3.33333C10 4.25 9.67361 5.03472 9.02083 5.6875C8.36806 6.34028 7.58333 6.66667 6.66667 6.66667ZM0 13.3333V11C0 10.5278 0.121528 10.0938 0.364583 9.69792C0.607639 9.30208 0.930556 9 1.33333 8.79167C2.19444 8.36111 3.06944 8.03819 3.95833 7.82292C4.84722 7.60764 5.75 7.5 6.66667 7.5C7.58333 7.5 8.48611 7.60764 9.375 7.82292C10.2639 8.03819 11.1389 8.36111 12 8.79167C12.4028 9 12.7257 9.30208 12.9688 9.69792C13.2118 10.0938 13.3333 10.5278 13.3333 11V13.3333H0ZM1.66667 11.6667H11.6667V11C11.6667 10.8472 11.6285 10.7083 11.5521 10.5833C11.4757 10.4583 11.375 10.3611 11.25 10.2917C10.5 9.91667 9.74306 9.63542 8.97917 9.44792C8.21528 9.26042 7.44444 9.16667 6.66667 9.16667C5.88889 9.16667 5.11806 9.26042 4.35417 9.44792C3.59028 9.63542 2.83333 9.91667 2.08333 10.2917C1.95833 10.3611 1.85764 10.4583 1.78125 10.5833C1.70486 10.7083 1.66667 10.8472 1.66667 11V11.6667ZM6.66667 5C7.125 5 7.51736 4.83681 7.84375 4.51042C8.17014 4.18403 8.33333 3.79167 8.33333 3.33333C8.33333 2.875 8.17014 2.48264 7.84375 2.15625C7.51736 1.82986 7.125 1.66667 6.66667 1.66667C6.20833 1.66667 5.81597 1.82986 5.48958 2.15625C5.16319 2.48264 5 2.875 5 3.33333C5 3.79167 5.16319 4.18403 5.48958 4.51042C5.81597 4.83681 6.20833 5 6.66667 5Z"
        fill="#DC2626"
      />
    </svg>
  );
}

function AddFriendIcon() {
  return (
    <svg width="17" height="12" viewBox="0 0 17 12" fill="none">
      <path
        d="M12.75 7.5V5.25H10.5V3.75H12.75V1.5H14.25V3.75H16.5V5.25H14.25V7.5H12.75ZM6 6C5.175 6 4.46875 5.70625 3.88125 5.11875C3.29375 4.53125 3 3.825 3 3C3 2.175 3.29375 1.46875 3.88125 0.88125C4.46875 0.29375 5.175 0 6 0C6.825 0 7.53125 0.29375 8.11875 0.88125C8.70625 1.46875 9 2.175 9 3C9 3.825 8.70625 4.53125 8.11875 5.11875C7.53125 5.70625 6.825 6 6 6ZM0 12V9.9C0 9.475 0.109375 9.08437 0.328125 8.72812C0.546875 8.37187 0.8375 8.1 1.2 7.9125C1.975 7.525 2.7625 7.23438 3.5625 7.04063C4.3625 6.84688 5.175 6.75 6 6.75C6.825 6.75 7.6375 6.84688 8.4375 7.04063C9.2375 7.23438 10.025 7.525 10.8 7.9125C11.1625 8.1 11.4531 8.37187 11.6719 8.72812C11.8906 9.08437 12 9.475 12 9.9V12H0ZM1.5 10.5H10.5V9.9C10.5 9.7625 10.4656 9.6375 10.3969 9.525C10.3281 9.4125 10.2375 9.325 10.125 9.2625C9.45 8.925 8.76875 8.67188 8.08125 8.50313C7.39375 8.33438 6.7 8.25 6 8.25C5.3 8.25 4.60625 8.33438 3.91875 8.50313C3.23125 8.67188 2.55 8.925 1.875 9.2625C1.7625 9.325 1.67188 9.4125 1.60312 9.525C1.53437 9.6375 1.5 9.7625 1.5 9.9V10.5ZM6 4.5C6.4125 4.5 6.76562 4.35312 7.05937 4.05937C7.35312 3.76562 7.5 3.4125 7.5 3C7.5 2.5875 7.35312 2.23438 7.05937 1.94062C6.76562 1.64687 6.4125 1.5 6 1.5C5.5875 1.5 5.23438 1.64687 4.94063 1.94062C4.64688 2.23438 4.5 2.5875 4.5 3C4.5 3.4125 4.64688 3.76562 4.94063 4.05937C5.23438 4.35312 5.5875 4.5 6 4.5Z"
        fill="#4A6741"
      />
    </svg>
  );
}

function QuoteIcon() {
  return (
    <svg width="13" height="9" viewBox="0 0 13 9" fill="none">
      <path
        d="M1.275 9L3 6C2.175 6 1.46875 5.70625 0.88125 5.11875C0.29375 4.53125 0 3.825 0 3C0 2.175 0.29375 1.46875 0.88125 0.88125C1.46875 0.29375 2.175 0 3 0C3.825 0 4.53125 0.29375 5.11875 0.88125C5.70625 1.46875 6 2.175 6 3C6 3.2875 5.96562 3.55312 5.89687 3.79688C5.82812 4.04063 5.725 4.275 5.5875 4.5L3 9H1.275ZM8.025 9L9.75 6C8.925 6 8.21875 5.70625 7.63125 5.11875C7.04375 4.53125 6.75 3.825 6.75 3C6.75 2.175 7.04375 1.46875 7.63125 0.88125C8.21875 0.29375 8.925 0 9.75 0C10.575 0 11.2812 0.29375 11.8687 0.88125C12.4562 1.46875 12.75 2.175 12.75 3C12.75 3.2875 12.7156 3.55312 12.6469 3.79688C12.5781 4.04063 12.475 4.275 12.3375 4.5L9.75 9H8.025Z"
        fill="#4A6741"
      />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path
        d="M12.45 13.5L7.725 8.775C7.35 9.075 6.91875 9.3125 6.43125 9.4875C5.94375 9.6625 5.425 9.75 4.875 9.75C3.5125 9.75 2.35938 9.27813 1.41562 8.33438C0.471875 7.39063 0 6.2375 0 4.875C0 3.5125 0.471875 2.35938 1.41562 1.41562C2.35938 0.471875 3.5125 0 4.875 0C6.2375 0 7.39063 0.471875 8.33438 1.41562C9.27813 2.35938 9.75 3.5125 9.75 4.875C9.75 5.425 9.6625 5.94375 9.4875 6.43125C9.3125 6.91875 9.075 7.35 8.775 7.725L13.5 12.45L12.45 13.5ZM4.875 8.25C5.8125 8.25 6.60938 7.92188 7.26562 7.26562C7.92188 6.60938 8.25 5.8125 8.25 4.875C8.25 3.9375 7.92188 3.14062 7.26562 2.48438C6.60938 1.82812 5.8125 1.5 4.875 1.5C3.9375 1.5 3.14062 1.82812 2.48438 2.48438C1.82812 3.14062 1.5 3.9375 1.5 4.875C1.5 5.8125 1.82812 6.60938 2.48438 7.26562C3.14062 7.92188 3.9375 8.25 4.875 8.25Z"
        fill="#94A3B8"
      />
    </svg>
  );
}

function UserPlaceholder() {
  return (
    <svg width="20" height="20" viewBox="0 0 16 16" fill="none">
      <path
        d="M8 8C6.9 8 5.95833 7.60833 5.175 6.825C4.39167 6.04167 4 5.1 4 4C4 2.9 4.39167 1.95833 5.175 1.175C5.95833 0.391667 6.9 0 8 0C9.1 0 10.0417 0.391667 10.825 1.175C11.6083 1.95833 12 2.9 12 4C12 5.1 11.6083 6.04167 10.825 6.825C10.0417 7.60833 9.1 8 8 8ZM0 16V13.2C0 12.6333 0.145833 12.1125 0.4375 11.6375C0.729167 11.1625 1.11667 10.8 1.6 10.55C2.63333 10.0333 3.68333 9.64583 4.75 9.3875C5.81667 9.12917 6.9 9 8 9C9.1 9 10.1833 9.12917 11.25 9.3875C12.3167 9.64583 13.3667 10.0333 14.4 10.55C14.8833 10.8 15.2708 11.1625 15.5625 11.6375C15.8542 12.1125 16 12.6333 16 13.2V16H0Z"
        fill="#6B7280"
      />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg width="8" height="12" viewBox="0 0 8 12" fill="none">
      <path d="M4.6 6L0 1.4L1.4 0L7.4 6L1.4 12L0 10.6L4.6 6Z" fill="#4A6741" />
    </svg>
  );
}

// ── Avatar helper ───────────────────────────────────────────────────────────
function Avatar({
  src,
  size,
  className = "",
}: {
  src?: string;
  size: number;
  className?: string;
}) {
  if (src) {
    return (
      <img
        src={src}
        alt=""
        className={`rounded-full object-cover shrink-0 ${className}`}
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <div
      className={`rounded-full bg-[#E2E8F0] flex items-center justify-center shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      <UserPlaceholder />
    </div>
  );
}

// ── Friend Request Card ──────────────────────────────────────────────────────
function FriendRequestCard({
  request,
  onAccept,
  onReject,
  isAccepting,
  isRejecting,
}: {
  request: FriendRequestWithUser;
  onAccept: (requestId: number) => void;
  onReject: (requestId: number) => void;
  isAccepting?: boolean;
  isRejecting?: boolean;
}) {
  const { user } = request;
  const { t } = useTranslation();

  return (
    <div className="flex-shrink-0 w-[300px] sm:w-[310px] flex items-center gap-4 p-4 rounded-2xl border border-[#E2E8E2] bg-white">
      <Avatar src={getAvatarUrl(user.avatar_url)} size={64} />
      <div className="flex flex-col gap-2 min-w-0 flex-1">
        <div>
          <Link
            to={`/profile/${user.user_id}`}
            className="text-sm font-bold text-[#2D3A3A] truncate block hover:underline"
          >
            {user.full_name}
          </Link>
          <p className="text-[10px] text-[#6B7280]">
            {[user.japanese_level, user.location ? t(`locations.${user.location}`, { defaultValue: user.location }) : null].filter(Boolean).join(" • ")}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onAccept(request.request_id)}
            disabled={isAccepting || isRejecting}
            className="px-3 py-1 rounded-md bg-[#4A6741] text-white text-xs font-semibold hover:bg-[#3a5232] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isAccepting ? t("friends.processing") : t("friends.accept")}
          </button>
          <button
            onClick={() => onReject(request.request_id)}
            disabled={isAccepting || isRejecting}
            className="px-3 py-1 rounded-md bg-[#F1F5F9] text-[#6B7280] text-xs font-semibold hover:bg-[#E2E8E2] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {t("friends.ignore")}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Suggestion Card ──────────────────────────────────────────────────────────
function SuggestionCard({
  user,
  onAdd,
  isAdding,
}: {
  user: UserSearchOut;
  onAdd: (userId: number) => void;
  isAdding?: boolean;
}) {
  const { t } = useTranslation();
  const isSent = user.friendship_status === "REQUEST_SENT";
  const isFriend = user.friendship_status === "FRIEND";

  return (
    <div className="flex items-center gap-4">
      <div className="relative shrink-0">
        <Avatar src={getAvatarUrl(user.avatar_url)} size={56} />
      </div>

      <div className="flex flex-col flex-1 min-w-0">
        <Link
          to={`/profile/${user.user_id}`}
          className="text-sm font-bold text-[#2D3A3A] truncate hover:underline"
        >
          {user.full_name}
        </Link>
        <p className="text-[10px] text-[#6B7280]">
          {[user.japanese_level, user.location ? t(`locations.${user.location}`, { defaultValue: user.location }) : null].filter(Boolean).join(" • ")}
        </p>
        {user.hobbies.length > 0 && (
          <div className="flex gap-1 mt-1 flex-wrap">
            {user.hobbies.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="px-[6px] py-[2px] text-[8px] font-medium text-[#6B7280] bg-[#F1F5F9] rounded"
              >
                {t(`hobbiesList.${tag}`, { defaultValue: tag })}
              </span>
            ))}
          </div>
        )}
      </div>

      {isFriend ? (
        <span className="shrink-0 text-[10px] font-semibold text-[#4A6741] bg-[#F1F5F0] px-2 py-1 rounded-lg">
          {t("friends.friend")}
        </span>
      ) : isSent ? (
        <span className="shrink-0 text-[10px] font-semibold text-[#6B7280] bg-[#F1F5F9] px-2 py-1 rounded-lg">
          {t("friends.sent")}
        </span>
      ) : (
        <button
          onClick={() => onAdd(user.user_id)}
          disabled={isAdding}
          className="shrink-0 p-2 rounded-lg bg-[#4A6741]/10 hover:bg-[#4A6741]/20 transition-colors disabled:opacity-60"
        >
          <AddFriendIcon />
        </button>
      )}
    </div>
  );
}

// ── Friends Page ──────────────────────────────────────────────────────────────
export default function FriendsPage() {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [processingRequestId, setProcessingRequestId] = useState<number | null>(null);
  const [sendingToUserId, setSendingToUserId] = useState<number | null>(null);
  const [unfriendingId, setUnfriendingId] = useState<number | null>(null);

  const queryClient = useQueryClient();

  // ── Queries ─────────────────────────────────────────────────────────────
  const { data: requestsData, isLoading: loadingRequests } = useQuery({
    queryKey: ["receivedRequests"],
    queryFn: () => getReceivedRequests(),
  });

  const { data: friendsData, isLoading: loadingFriends } = useQuery({
    queryKey: ["friends", search],
    queryFn: () => listFriends(search || undefined),
    staleTime: 0,
  });

  const { data: suggestionsData, isLoading: loadingSuggestions } = useQuery({
    queryKey: ["suggestions"],
    queryFn: getFriendSuggestions,
  });

  // ── Mutations ────────────────────────────────────────────────────────────
  const acceptMutation = useMutation({
    mutationFn: (requestId: number) => {
      setProcessingRequestId(requestId);
      return acceptFriendRequest(requestId);
    },
    onSuccess: () => {
      toast.success(t("friends.acceptSuccess"));
      queryClient.invalidateQueries({ queryKey: ["receivedRequests"] });
      queryClient.invalidateQueries({ queryKey: ["friends"] });
    },
    onError: (err: Error) => {
      toast.error(err.message || t("friends.acceptError"));
    },
    onSettled: () => setProcessingRequestId(null),
  });

  const rejectMutation = useMutation({
    mutationFn: (requestId: number) => {
      setProcessingRequestId(requestId);
      return rejectFriendRequest(requestId);
    },
    onSuccess: () => {
      toast.success(t("friends.rejectSuccess"));
      queryClient.invalidateQueries({ queryKey: ["receivedRequests"] });
    },
    onError: (err: Error) => {
      toast.error(err.message || t("friends.rejectError"));
    },
    onSettled: () => setProcessingRequestId(null),
  });

  const addFriendMutation = useMutation({
    mutationFn: (userId: number) => {
      setSendingToUserId(userId);
      return sendFriendRequest(userId);
    },
    onSuccess: () => {
      toast.success(t("friends.requestSentSuccess"));
      queryClient.invalidateQueries({ queryKey: ["suggestions"] });
    },
    onError: (err: Error) => {
      toast.error(err.message || t("friends.requestSentError"));
    },
    onSettled: () => setSendingToUserId(null),
  });

  const unfriendMutation = useMutation({
    mutationFn: (userId: number) => {
      setUnfriendingId(userId);
      return unfriend(userId);
    },
    onSuccess: () => {
      toast.success(t("friends.unfriendSuccess"));
      queryClient.invalidateQueries({ queryKey: ["friends"] });
      queryClient.invalidateQueries({ queryKey: ["suggestions"] });
    },
    onError: (err: Error) => {
      toast.error(err.message || t("friends.unfriendError"));
    },
    onSettled: () => setUnfriendingId(null),
  });

  const receivedRequests = requestsData?.data ?? [];
  const friends = friendsData?.data ?? [];
  const suggestions = suggestionsData?.data ?? [];
  const friendsTotal = friendsData?.pagination?.total ?? 0;

  const handleUnfriend = (userId: number, name: string) => {
    if (!window.confirm(t("friends.unfriendConfirm", { name }))) return;
    unfriendMutation.mutate(userId);
  };

  return (
    <div className="min-h-screen bg-[#F9FAF9] font-inter">
      <Navbar />

      <main className="max-w-[1280px] mx-auto px-4 sm:px-6 py-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* ── Left Column ──────────────────────────────────────────────────── */}
        <div className="lg:col-span-8 flex flex-col gap-8">
          {/* Friend Requests Section */}
          <section className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-6 rounded-full bg-[#4A6741]" />
                  <h2 className="text-xl font-bold text-[#2D3A3A]">
                    {t("friends.friendRequests")}
                  </h2>
                </div>
                {receivedRequests.length > 0 && (
                  <span className="text-[11px] italic text-[#6B7280] opacity-75">
                    {t("friends.scrollHint")}
                  </span>
                )}
              </div>
              {receivedRequests.length > 0 && (
                <span className="px-[10px] py-1 rounded-full bg-[#4A6741]/10 text-[11px] font-bold text-[#4A6741]">
                  {t("friends.newRequests", { count: receivedRequests.length })}
                </span>
              )}
            </div>

            {loadingRequests ? (
              <div className="flex gap-4 overflow-x-auto pb-3">
                {[1, 2].map((i) => (
                  <div
                    key={i}
                    className="flex-shrink-0 w-[300px] h-[96px] rounded-2xl border border-[#E2E8E2] bg-white animate-pulse"
                  />
                ))}
              </div>
            ) : receivedRequests.length === 0 ? (
              <div className="py-8 text-center text-sm text-[#6B7280] bg-white rounded-2xl border border-[#E2E8E2]">
                {t("friends.noRequests")}
              </div>
            ) : (
              <div className="relative overflow-hidden">
                <div className="flex gap-4 overflow-x-auto pb-3 scrollbar-thin scrollbar-thumb-[#E2E8E2] scrollbar-track-transparent">
                  {receivedRequests.map((req) => (
                    <FriendRequestCard
                      key={req.request_id}
                      request={req}
                      onAccept={(id) => acceptMutation.mutate(id)}
                      onReject={(id) => rejectMutation.mutate(id)}
                      isAccepting={
                        processingRequestId === req.request_id &&
                        acceptMutation.isPending
                      }
                      isRejecting={
                        processingRequestId === req.request_id &&
                        rejectMutation.isPending
                      }
                    />
                  ))}
                  <div className="flex-shrink-0 flex items-center">
                    <button className="w-8 h-8 flex items-center justify-center rounded-full bg-white border border-[#E2E8E2] shadow-sm hover:bg-[#F1F5F9] transition-colors">
                      <ChevronRightIcon />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* My Friends Section */}
          <section className="flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-6 rounded-full bg-[#4A6741]" />
                  <h2 className="text-xl font-bold text-[#2D3A3A]">
                    {t("friends.myFriends")}
                  </h2>
                  {friendsTotal > 0 && (
                    <span className="text-sm text-[#6B7280]">
                      ({friendsTotal})
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#6B7280] mt-0.5 ml-4">
                  {t("friends.connectedList")}
                </p>
              </div>

              <div className="relative w-full sm:w-80">
                <input
                  type="text"
                  placeholder={t("friends.searchPlaceholder")}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-[9px] rounded-lg border border-[#E2E8E2] bg-white text-sm text-[#6B7280] placeholder-[#6B7280] outline-none focus:ring-2 focus:ring-[#4A6741]/20"
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  <SearchIcon />
                </span>
              </div>
            </div>

            <div className="rounded-2xl border border-[#E2E8E2] bg-white shadow-sm overflow-hidden">
              {loadingFriends ? (
                <div className="divide-y divide-[#E2E8E2]">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="flex items-center gap-4 px-4 py-4 animate-pulse"
                    >
                      <div className="w-14 h-14 rounded-full bg-[#E2E8E2] shrink-0" />
                      <div className="flex-1 space-y-1.5">
                        <div className="h-4 bg-[#E2E8E2] rounded w-1/3" />
                        <div className="h-3 bg-[#E2E8E2] rounded w-1/4" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : friends.length === 0 ? (
                <div className="py-12 text-center text-sm text-[#6B7280]">
                  {search
                    ? t("friends.noFriendsFound")
                    : t("friends.noFriends")}
                </div>
              ) : (
                friends.map((friend, i) => (
                  <div
                    key={friend.user_id}
                    className={`flex items-center gap-4 px-4 py-4 ${
                      i !== friends.length - 1
                        ? "border-b border-[#E2E8E2]"
                        : ""
                    }`}
                  >
                    <Avatar src={getAvatarUrl(friend.avatar_url)} size={56} />

                    <div className="flex-1 min-w-0">
                      <Link
                        to={`/profile/${friend.user_id}`}
                        className="text-base font-bold text-[#2D3A3A] truncate block hover:underline"
                      >
                        {friend.full_name}
                      </Link>
                      <p className="text-xs text-[#6B7280]">
                        {[friend.japanese_level, friend.location ? t(`locations.${friend.location}`, { defaultValue: friend.location }) : null]
                          .filter(Boolean)
                          .join(" • ")}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Link
                        to={`/chat?user_id=${friend.user_id}`}
                        className="p-0 hover:opacity-70 transition-opacity"
                        title="Nhắn tin"
                      >
                        <MessageBubbleIcon />
                      </Link>
                      <button
                        onClick={() =>
                          handleUnfriend(friend.user_id, friend.full_name)
                        }
                        disabled={unfriendingId === friend.user_id}
                        className="p-2 rounded-lg bg-[#FEF2F2] hover:bg-red-100 transition-colors disabled:opacity-60"
                        title="Hủy kết bạn"
                      >
                        <RemoveFriendIcon />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>

        {/* ── Right Column ─────────────────────────────────────────────────── */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* Friend Suggestions */}
          <div className="rounded-2xl border border-[#E2E8E2] bg-white shadow-sm p-6 flex flex-col gap-6">
            <h2 className="text-lg font-bold text-[#2D3A3A]">{t("friends.suggestions")}</h2>

            {suggestionsData?.warning && (
              <div className="px-3 py-2 rounded-lg bg-[#FFF7ED] border border-[#FED7AA]">
                <p className="text-xs text-[#EA580C]">
                  {t("friends.updateProfileHint")}
                </p>
              </div>
            )}

            {loadingSuggestions ? (
              <div className="flex flex-col gap-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-4 animate-pulse">
                    <div className="w-14 h-14 rounded-full bg-[#E2E8E2] shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-4 bg-[#E2E8E2] rounded w-3/4" />
                      <div className="h-3 bg-[#E2E8E2] rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : suggestions.length === 0 ? (
              <p className="text-sm text-[#6B7280] text-center py-4">
                {t("friends.noSuggestions")}
              </p>
            ) : (
              <div className="flex flex-col gap-6">
                {suggestions.map((s) => (
                  <SuggestionCard
                    key={s.user_id}
                    user={s}
                    onAdd={(id) => addFriendMutation.mutate(id)}
                    isAdding={sendingToUserId === s.user_id}
                  />
                ))}
              </div>
            )}

            {suggestions.length > 0 && (
              <Link
                to="/search"
                className="text-center text-sm text-[#4A6741] font-semibold hover:underline"
              >
                {t("friends.searchMore")}
              </Link>
            )}
          </div>

          {/* Community Quote */}
          <div className="rounded-2xl border border-[#4A6741]/10 bg-[#F0F4F0] shadow-sm p-6 flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <QuoteIcon />
              <h3 className="text-sm font-bold text-[#4A6741]">
                {t("friends.communityQuote")}
              </h3>
            </div>
            <div className="flex flex-col gap-4">
              <p className="text-xs font-medium italic text-[#2D3A3A] leading-[1.625]">
                {t("friends.quoteText")}
              </p>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-[#4A6741]/20 shrink-0" />
                <span className="text-[10px] text-[#6B7280]">
                  {t("friends.memberSince")}
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
