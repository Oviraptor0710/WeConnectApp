import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import { useTranslation } from "react-i18next";
import {
  getUserProfile,
  sendFriendRequest,
  unfriend,
} from "@/lib/friendsApi";

const API_URL = (import.meta.env.VITE_API_URL as string) || "";

function getMediaUrl(url?: string) {
  if (!url) return undefined;
  return url.startsWith("http") ? url : `${API_URL}${url}`;
}

function FriendActionButton({
  status,
  userId,
}: {
  status: "FRIEND" | "REQUEST_SENT" | "REQUEST_RECEIVED" | "NONE";
  userId: number;
}) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const sendMutation = useMutation({
    mutationFn: () => sendFriendRequest(userId),
    onSuccess: () => {
      toast.success(t("friends.requestSentSuccess"));
      queryClient.invalidateQueries({ queryKey: ["userProfile", userId] });
    },
    onError: (err: Error) => {
      toast.error(err.message || t("friends.requestSentError"));
    },
  });

  const unfriendMutation = useMutation({
    mutationFn: () => unfriend(userId),
    onSuccess: () => {
      toast.success(t("friends.unfriendSuccess"));
      queryClient.invalidateQueries({ queryKey: ["userProfile", userId] });
    },
    onError: (err: Error) => {
      toast.error(err.message || t("friends.unfriendError"));
    },
  });

  if (status === "FRIEND") {
    return (
      <div className="flex gap-2 self-start sm:self-auto flex-shrink-0">
        <span className="px-5 sm:px-6 py-2.5 sm:py-3 rounded-2xl bg-[#F1F5F0] text-[#4A6741] text-sm sm:text-base font-bold">
          {t("friends.friend")}
        </span>
        <button
          onClick={() => {
            if (window.confirm(t("friends.unfriendConfirmSimple"))) {
              unfriendMutation.mutate();
            }
          }}
          disabled={unfriendMutation.isPending}
          className="px-4 py-2.5 rounded-2xl border border-[#DC2626]/20 bg-[#FEF2F2] text-[#DC2626] text-sm font-bold hover:bg-red-100 transition-colors disabled:opacity-60"
        >
          {t("friends.unfriend")}
        </button>
      </div>
    );
  }

  if (status === "REQUEST_SENT") {
    return (
      <span className="self-start sm:self-auto flex-shrink-0 px-5 sm:px-6 py-2.5 sm:py-3 rounded-2xl bg-[#F1F5F9] text-[#6B7280] text-sm sm:text-base font-bold">
        {t("friends.sent")}
      </span>
    );
  }

  if (status === "REQUEST_RECEIVED") {
    return (
      <Link
        to="/friends"
        className="self-start sm:self-auto flex-shrink-0 px-5 sm:px-6 py-2.5 sm:py-3 rounded-2xl border border-[#4A6741]/20 bg-[#F1F5F0] text-[#4A6741] text-sm sm:text-base font-bold hover:bg-[#E8F0E8] transition-colors"
      >
        {t("friends.viewRequests")}
      </Link>
    );
  }

  return (
    <button
      onClick={() => sendMutation.mutate()}
      disabled={sendMutation.isPending}
      className="self-start sm:self-auto flex-shrink-0 px-5 sm:px-6 py-2.5 sm:py-3 rounded-2xl border border-[#2D3A3A]/10 bg-white/10 shadow-[0_1px_2px_0_rgba(0,0,0,0.05)] backdrop-blur-sm text-[#2D3A3A] text-sm sm:text-base font-bold hover:bg-[#F1F5F0] transition-colors disabled:opacity-60"
    >
      {sendMutation.isPending ? t("friends.processing") : t("friends.add")}
    </button>
  );
}

export default function UserProfilePage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["userProfile", id],
    queryFn: () => getUserProfile(id!),
    enabled: !!id,
  });

  const user = data?.data;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F9FAF9] font-inter">
        <Navbar />
        <div className="flex justify-center items-center py-24">
          <div className="text-[#6B7280]">{t("profile.loading")}</div>
        </div>
      </div>
    );
  }

  if (isError || !user) {
    return (
      <div className="min-h-screen bg-[#F9FAF9] font-inter">
        <Navbar />
        <div className="flex flex-col justify-center items-center py-24 gap-4">
          <p className="text-[#6B7280]">{t("profile.userNotFound")}</p>
          <Link to="/search" className="text-[#4A6741] font-semibold hover:underline">
            {t("profile.backToSearch")}
          </Link>
        </div>
      </div>
    );
  }

  const avatarUrl = getMediaUrl(user.avatar_url);
  const coverUrl = getMediaUrl(user.cover_url);

  return (
    <div className="min-h-screen bg-[#F9FAF9] font-inter">
      <Navbar />

      <main>
        {/* Profile Header Section */}
        <div className="bg-white border-b border-[#E2E8E2]">
          {/* Banner */}
          <div className="relative h-48 sm:h-64 md:h-80 overflow-hidden">
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(45deg, #1A2A2A 0%, #4A6741 50%, #60A5FA 100%)",
                opacity: 0.9,
              }}
            />
            {coverUrl && (
              <img
                src={coverUrl}
                alt=""
                className="absolute inset-0 w-full h-full object-cover mix-blend-overlay"
              />
            )}
          </div>

          {/* Profile info row */}
          <div className="max-w-[1152px] mx-auto px-4 sm:px-6">
            <div className="relative z-10 flex flex-col sm:flex-row sm:items-end gap-4 sm:gap-6 pb-6 sm:pb-10 -mt-12 sm:-mt-16 md:-mt-20">
              {/* Avatar */}
              <div className="flex-shrink-0 relative z-20">
                <div className="w-28 h-28 sm:w-36 sm:h-36 md:w-44 md:h-44 rounded-full bg-white shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] p-1 sm:p-1.5 overflow-hidden">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={user.full_name}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full rounded-full bg-[#E2E8F0] flex items-center justify-center">
                      <svg width="40" height="40" viewBox="0 0 16 16" fill="none">
                        <path
                          d="M8 8C6.9 8 5.95833 7.60833 5.175 6.825C4.39167 6.04167 4 5.1 4 4C4 2.9 4.39167 1.95833 5.175 1.175C5.95833 0.391667 6.9 0 8 0C9.1 0 10.0417 0.391667 10.825 1.175C11.6083 1.95833 12 2.9 12 4C12 5.1 11.6083 6.04167 10.825 6.825C10.0417 7.60833 9.1 8 8 8ZM0 16V13.2C0 12.6333 0.145833 12.1125 0.4375 11.6375C0.729167 11.1625 1.11667 10.8 1.6 10.55C2.63333 10.0333 3.68333 9.64583 4.75 9.3875C5.81667 9.12917 6.9 9 8 9C9.1 9 10.1833 9.12917 11.25 9.3875C12.3167 9.64583 13.3667 10.0333 14.4 10.55C14.8833 10.8 15.2708 11.1125 15.5625 11.6375C15.8542 12.1125 16 12.6333 16 13.2V16H0Z"
                          fill="#6B7280"
                        />
                      </svg>
                    </div>
                  )}
                </div>
              </div>

              {/* Name + location + action button */}
              <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between flex-1 gap-4 sm:pb-4">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-[#2D3A3A] leading-tight">
                      {user.full_name}
                    </h1>
                    {user.japanese_level && (
                      <span className="px-2 py-1 rounded-lg bg-[#4A6741]/10 text-[#4A6741] text-sm font-bold">
                        {user.japanese_level}
                      </span>
                    )}
                  </div>
                  {user.location && (
                    <div className="flex items-center gap-1">
                      <svg width="10" height="12" viewBox="0 0 10 12" fill="none">
                        <path
                          d="M4.66667 5.83333C4.9875 5.83333 5.26215 5.7191 5.49062 5.49062C5.7191 5.26215 5.83333 4.9875 5.83333 4.66667C5.83333 4.34583 5.7191 4.07118 5.49062 3.84271C5.26215 3.61424 4.9875 3.5 4.66667 3.5C4.34583 3.5 4.07118 3.61424 3.84271 3.84271C3.61424 4.07118 3.5 4.34583 3.5 4.66667C3.5 4.9875 3.61424 5.26215 3.84271 5.49062C4.07118 5.7191 4.34583 5.83333 4.66667 5.83333ZM4.66667 10.1208C5.85278 9.03194 6.73264 8.04271 7.30625 7.15312C7.87986 6.26354 8.16667 5.47361 8.16667 4.78333C8.16667 3.72361 7.82882 2.8559 7.15312 2.18021C6.47743 1.50451 5.64861 1.16667 4.66667 1.16667C3.68472 1.16667 2.8559 1.50451 2.18021 2.18021C1.50451 2.8559 1.16667 3.72361 1.16667 4.78333C1.16667 5.47361 1.45347 6.26354 2.02708 7.15312C2.60069 8.04271 3.48056 9.03194 4.66667 10.1208ZM4.66667 11.6667C3.10139 10.3347 1.93229 9.09757 1.15937 7.95521C0.386458 6.81285 0 5.75556 0 4.78333C0 3.325 0.469097 2.16319 1.40729 1.29792C2.34549 0.432639 3.43194 0 4.66667 0C5.90139 0 6.98785 0.432639 7.92604 1.29792C8.86424 2.16319 9.33333 3.325 9.33333 4.78333C9.33333 5.75556 8.94688 6.81285 8.17396 7.95521C7.40104 9.09757 6.23194 10.3347 4.66667 11.6667Z"
                          fill="#6B7280"
                        />
                      </svg>
                      <span className="text-sm sm:text-base font-medium text-[#6B7280]">
                        {t(`locations.${user.location}`, { defaultValue: user.location })}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      if (user.friendship_status !== "FRIEND") {
                        toast.error("Hiện tại chưa thể nhắn tin vì chưa kết bạn");
                      } else {
                        navigate(`/chat?user_id=${user.user_id}`);
                      }
                    }}
                    className="p-2 sm:p-2.5 rounded-2xl border border-[#4A6741]/20 bg-[#F1F5F0] text-[#4A6741] hover:bg-[#E8F0E8] transition-colors"
                  >
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                    </svg>
                  </button>
                  <FriendActionButton
                    status={user.friendship_status}
                    userId={user.user_id}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Content */}
        <div className="max-w-[1152px] mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
            {/* Left column: Bio + Hobbies */}
            <div className="lg:col-span-8 flex flex-col gap-6 sm:gap-8">
              {/* Bio Card */}
              {user.bio && (
                <div className="bg-white rounded-2xl border border-[#E2E8E2] shadow-[0_1px_2px_0_rgba(0,0,0,0.05)] p-5 sm:p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <svg width="16" height="20" viewBox="0 0 16 20" fill="none">
                      <path
                        d="M4 16H12V14H4V16ZM4 12H12V10H4V12ZM2 20C1.45 20 0.979167 19.8042 0.5875 19.4125C0.195833 19.0208 0 18.55 0 18V2C0 1.45 0.195833 0.979167 0.5875 0.5875C0.979167 0.195833 1.45 0 2 0H10L16 6V18C16 18.55 15.8042 19.0208 15.4125 19.4125C15.0208 19.8042 14.55 20 14 20H2ZM9 7V2H2V18H14V7H9ZM2 2V7V2V7V18V2Z"
                        fill="#4A6741"
                      />
                    </svg>
                    <h2 className="text-lg sm:text-xl font-bold text-[#2D3A3A]">
                      {t("profile.bio")}
                    </h2>
                  </div>
                  <p className="text-sm sm:text-base text-[#6B7280] leading-relaxed">
                    {user.bio}
                  </p>
                </div>
              )}

              {/* Hobbies Card */}
              {user.hobbies.length > 0 && (
                <div className="bg-white rounded-2xl border border-[#E2E8E2] shadow-[0_1px_2px_0_rgba(0,0,0,0.05)] p-5 sm:p-6">
                  <div className="flex items-center gap-2 mb-5 sm:mb-6">
                    <svg width="20" height="19" viewBox="0 0 20 19" fill="none">
                      <path
                        d="M6.85 14.825L10 12.925L13.15 14.85L12.325 11.25L15.1 8.85L11.45 8.525L10 5.125L8.55 8.5L4.9 8.825L7.675 11.25L6.85 14.825ZM3.825 19L5.45 11.975L0 7.25L7.2 6.625L10 0L12.8 6.625L20 7.25L14.55 11.975L16.175 19L10 15.275L3.825 19Z"
                        fill="#4A6741"
                      />
                    </svg>
                    <h2 className="text-lg sm:text-xl font-bold text-[#2D3A3A]">
                      {t("profile.interests")}
                    </h2>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {user.hobbies.map((hobby) => (
                      <div
                        key={hobby.hobby_id}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-full border border-[#4A6741]/10 bg-[#F1F5F0] shadow-[0_1px_2px_0_rgba(0,0,0,0.05)]"
                      >
                        <span className="text-sm font-semibold text-[#4A6741]">
                          {t(`hobbiesList.${hobby.name}`, { defaultValue: hobby.name })}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* No info state */}
              {!user.bio && user.hobbies.length === 0 && (
                <div className="bg-white rounded-2xl border border-[#E2E8E2] shadow-[0_1px_2px_0_rgba(0,0,0,0.05)] p-5 sm:p-6 text-center">
                  <p className="text-sm text-[#6B7280]">
                    {t("profile.noInfo")}
                  </p>
                </div>
              )}
            </div>

            {/* Right column: Info */}
            <div className="lg:col-span-4">
              <div className="bg-white rounded-2xl border border-[#E2E8E2] shadow-[0_1px_2px_0_rgba(0,0,0,0.05)] p-5 sm:p-6">
                <div className="flex items-center gap-2 mb-5 sm:mb-6">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path
                      d="M9 15H11V9H9V15ZM10 7C10.2833 7 10.5208 6.90417 10.7125 6.7125C10.9042 6.52083 11 6.28333 11 6C11 5.71667 10.9042 5.47917 10.7125 5.2875C10.5208 5.09583 10.2833 5 10 5C9.71667 5 9.47917 5.09583 9.2875 5.2875C9.09583 5.47917 9 5.71667 9 6C9 6.28333 9.09583 6.52083 9.2875 6.7125C9.47917 6.90417 9.71667 7 10 7ZM10 20C8.61667 20 7.31667 19.7375 6.1 19.2125C4.88333 18.6875 3.825 17.975 2.925 17.075C2.025 16.175 1.3125 15.1167 0.7875 13.9C0.2625 12.6833 0 11.3833 0 10C0 8.61667 0.2625 7.31667 0.7875 6.1C1.3125 4.88333 2.025 3.825 2.925 2.925C3.825 2.025 4.88333 1.3125 6.1 0.7875C7.31667 0.2625 8.61667 0 10 0C11.3833 0 12.6833 0.2625 13.9 0.7875C15.1167 1.3125 16.175 2.025 17.075 2.925C17.975 3.825 18.6875 4.88333 19.2125 6.1C19.7375 7.31667 20 8.61667 20 10C20 11.3833 19.7375 12.6833 19.2125 13.9C18.6875 15.1167 17.975 16.175 17.075 17.075C16.175 17.975 15.1167 18.6875 13.9 19.2125C12.6833 19.7375 11.3833 20 10 20ZM10 18C12.2333 18 14.125 17.225 15.675 15.675C17.225 14.125 18 12.2333 18 10C18 7.76667 17.225 5.875 15.675 4.325C14.125 2.775 12.2333 2 10 2C7.76667 2 5.875 2.775 4.325 4.325C2.775 5.875 2 7.76667 2 10C2 12.2333 2.775 14.125 4.325 15.675C5.875 17.225 7.76667 18 10 18Z"
                      fill="#4A6741"
                    />
                  </svg>
                  <h2 className="text-lg sm:text-xl font-bold text-[#2D3A3A]">
                    {t("profile.info")}
                  </h2>
                </div>

                <div className="flex flex-col gap-4">
                  {user.japanese_level && (
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-lg bg-[#F1F5F0]">
                        <svg width="14" height="14" viewBox="0 0 17 15" fill="none">
                          <path
                            d="M8.175 15L11.5875 6H13.1625L16.575 15H15L14.1938 12.7125H10.5562L9.75 15H8.175ZM2.25 12.75L1.2 11.7L4.9875 7.9125C4.55 7.475 4.15312 6.975 3.79688 6.4125C3.44062 5.85 3.1125 5.2125 2.8125 4.5H4.3875C4.6375 4.9875 4.8875 5.4125 5.1375 5.775C5.3875 6.1375 5.6875 6.5 6.0375 6.8625C6.45 6.45 6.87813 5.87188 7.32188 5.12813C7.76562 4.38438 8.1 3.675 8.325 3H0V1.5H5.25V0H6.75V1.5H12V3H9.825C9.5625 3.9 9.16875 4.825 8.64375 5.775C8.11875 6.725 7.6 7.45 7.0875 7.95L8.8875 9.7875L8.325 11.325L6.0375 8.98125L2.25 12.75ZM11.025 11.4H13.725L12.375 7.575L11.025 11.4Z"
                            fill="#4A6741"
                          />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-[#2D3A3A]">
                          {t("profile.japaneseLevel")}
                        </p>
                        <p className="text-xs text-[#6B7280]">
                          {user.japanese_level}
                        </p>
                      </div>
                    </div>
                  )}

                  {user.location && (
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-lg bg-[#F1F5F0]">
                        <svg width="10" height="12" viewBox="0 0 10 12" fill="none">
                          <path
                            d="M4.66667 5.83333C4.9875 5.83333 5.26215 5.7191 5.49062 5.49062C5.7191 5.26215 5.83333 4.9875 5.83333 4.66667C5.83333 4.34583 5.7191 4.07118 5.49062 3.84271C5.26215 3.61424 4.9875 3.5 4.66667 3.5C4.34583 3.5 4.07118 3.61424 3.84271 3.84271C3.61424 4.07118 3.5 4.34583 3.5 4.66667C3.5 4.9875 3.61424 5.26215 3.84271 5.49062C4.07118 5.7191 4.34583 5.83333 4.66667 5.83333ZM4.66667 10.1208C5.85278 9.03194 6.73264 8.04271 7.30625 7.15312C7.87986 6.26354 8.16667 5.47361 8.16667 4.78333C8.16667 3.72361 7.82882 2.8559 7.15312 2.18021C6.47743 1.50451 5.64861 1.16667 4.66667 1.16667C3.68472 1.16667 2.8559 1.50451 2.18021 2.18021C1.50451 2.8559 1.16667 3.72361 1.16667 4.78333C1.16667 5.47361 1.45347 6.26354 2.02708 7.15312C2.60069 8.04271 3.48056 9.03194 4.66667 10.1208ZM4.66667 11.6667C3.10139 10.3347 1.93229 9.09757 1.15937 7.95521C0.386458 6.81285 0 5.75556 0 4.78333C0 3.325 0.469097 2.16319 1.40729 1.29792C2.34549 0.432639 3.43194 0 4.66667 0C5.90139 0 6.98785 0.432639 7.92604 1.29792C8.86424 2.16319 9.33333 3.325 9.33333 4.78333C9.33333 5.75556 8.94688 6.81285 8.17396 7.95521C7.40104 9.09757 6.23194 10.3347 4.66667 11.6667Z"
                            fill="#4A6741"
                          />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-[#2D3A3A]">
                          {t("profile.location")}
                        </p>
                        <p className="text-xs text-[#6B7280]">
                          {t(`locations.${user.location}`, { defaultValue: user.location })}
                        </p>
                      </div>
                    </div>
                  )}

                  {user.hobbies.length > 0 && (
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-lg bg-[#F1F5F0]">
                        <svg width="16" height="15" viewBox="0 0 20 19" fill="none">
                          <path
                            d="M6.85 14.825L10 12.925L13.15 14.85L12.325 11.25L15.1 8.85L11.45 8.525L10 5.125L8.55 8.5L4.9 8.825L7.675 11.25L6.85 14.825ZM3.825 19L5.45 11.975L0 7.25L7.2 6.625L10 0L12.8 6.625L20 7.25L14.55 11.975L16.175 19L10 15.275L3.825 19Z"
                            fill="#4A6741"
                          />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-[#2D3A3A] mb-1">
                          {t("profile.interests")}
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {user.hobbies.slice(0, 4).map((h) => (
                            <span
                              key={h.hobby_id}
                              className="text-[10px] text-[#6B7280] bg-[#F1F5F9] px-1.5 py-0.5 rounded"
                            >
                              {t(`hobbiesList.${h.name}`, { defaultValue: h.name })}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {!user.japanese_level && !user.location && user.hobbies.length === 0 && (
                    <p className="text-sm text-[#6B7280] text-center py-2">
                      {t("profile.noInfoSimple")}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
