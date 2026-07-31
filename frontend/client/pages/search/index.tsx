import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import {
  searchUsers,
  sendFriendRequest,
  UserSearchOut,
} from "@/lib/friendsApi";

const API_URL = (import.meta.env.VITE_API_URL as string) || "";

function getAvatarUrl(url?: string) {
  if (!url) return undefined;
  return url.startsWith("http") ? url : `${API_URL}${url}`;
}

const LEVEL_COLORS: Record<string, { text: string; bg: string }> = {
  N1: { text: "text-[#2563EB]", bg: "bg-[#EFF6FF]" },
  N2: { text: "text-[#4A6741]", bg: "bg-[#F1F5F0]" },
  N3: { text: "text-[#EA580C]", bg: "bg-[#FFF7ED]" },
  N4: { text: "text-[#475569]", bg: "bg-[#F1F5F9]" },
  N5: { text: "text-[#64748B]", bg: "bg-[#F8FAFC]" },
  "Bản ngữ": { text: "text-[#9333EA]", bg: "bg-[#FAF5FF]" },
};

function LevelBadge({ level }: { level?: string }) {
  if (!level) return null;
  const colors = LEVEL_COLORS[level] ?? { text: "text-[#6B7280]", bg: "bg-[#F1F5F9]" };
  return (
    <span
      className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${colors.bg} ${colors.text} shrink-0`}
    >
      {level}
    </span>
  );
}

function UserAvatar({ src, size = 48 }: { src?: string; size?: number }) {
  if (src) {
    return (
      <img
        src={src}
        alt=""
        className="rounded-full object-cover shrink-0"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <div
      className="rounded-full bg-[#E2E8F0] border border-[#E2E8E2] flex items-center justify-center shrink-0"
      style={{ width: size, height: size }}
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path
          d="M8 8C6.9 8 5.95833 7.60833 5.175 6.825C4.39167 6.04167 4 5.1 4 4C4 2.9 4.39167 1.95833 5.175 1.175C5.95833 0.391667 6.9 0 8 0C9.1 0 10.0417 0.391667 10.825 1.175C11.6083 1.95833 12 2.9 12 4C12 5.1 11.6083 6.04167 10.825 6.825C10.0417 7.60833 9.1 8 8 8ZM0 16V13.2C0 12.6333 0.145833 12.1125 0.4375 11.6375C0.729167 11.1625 1.11667 10.8 1.6 10.55C2.63333 10.0333 3.68333 9.64583 4.75 9.3875C5.81667 9.12917 6.9 9 8 9C9.1 9 10.1833 9.12917 11.25 9.3875C12.3167 9.64583 13.3667 10.0333 14.4 10.55C14.8833 10.8 15.2708 11.1625 15.5625 11.6375C15.8542 12.1125 16 12.6333 16 13.2V16H0Z"
          fill="#6B7280"
        />
      </svg>
    </div>
  );
}

function FriendStatusButton({
  user,
  onSend,
  isLoading,
}: {
  user: UserSearchOut;
  onSend: (id: number) => void;
  isLoading?: boolean;
}) {
  const { friendship_status, user_id } = user;

  if (friendship_status === "FRIEND") {
    return (
      <span className="px-3 py-1.5 rounded-lg bg-[#F1F5F0] text-[#4A6741] text-xs font-semibold">
        Bạn bè
      </span>
    );
  }
  if (friendship_status === "REQUEST_SENT") {
    return (
      <span className="px-3 py-1.5 rounded-lg bg-[#F1F5F9] text-[#6B7280] text-xs font-semibold">
        Đã gửi lời mời
      </span>
    );
  }
  if (friendship_status === "REQUEST_RECEIVED") {
    return (
      <Link
        to="/friends"
        className="px-3 py-1.5 rounded-lg bg-[#FFF7ED] text-[#EA580C] text-xs font-semibold hover:bg-orange-100 transition-colors"
      >
        Phản hồi lời mời
      </Link>
    );
  }
  return (
    <button
      onClick={() => onSend(user_id)}
      disabled={isLoading}
      className="px-3 py-1.5 rounded-lg bg-[#4A6741] text-white text-xs font-semibold hover:bg-[#3d5836] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
    >
      Thêm bạn
    </button>
  );
}

function UserCard({
  user,
  onSend,
  sendingId,
}: {
  user: UserSearchOut;
  onSend: (id: number) => void;
  sendingId?: number;
}) {
  return (
    <div className="rounded-xl border border-[#E2E8E2] bg-white p-4 hover:shadow-md transition-shadow flex flex-col gap-3">
      <div className="flex items-start gap-3">
        <UserAvatar src={getAvatarUrl(user.avatar_url)} size={48} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <Link
              to={`/profile/${user.user_id}`}
              className="text-sm font-bold text-[#2D3A3A] hover:underline truncate"
            >
              {user.full_name}
            </Link>
            <LevelBadge level={user.japanese_level} />
          </div>
          {user.location && (
            <p className="text-[11px] text-[#6B7280] mt-0.5">{user.location}</p>
          )}
        </div>
      </div>

      {user.hobbies.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {user.hobbies.slice(0, 4).map((hobby) => (
            <span
              key={hobby}
              className="px-1.5 py-0.5 rounded bg-[#F1F5F9] text-[10px] text-[#6B7280] font-medium"
            >
              {hobby}
            </span>
          ))}
          {user.hobbies.length > 4 && (
            <span className="text-[10px] text-[#94A3B8] self-center">
              +{user.hobbies.length - 4}
            </span>
          )}
        </div>
      )}

      <div className="flex items-center justify-between pt-1 border-t border-[#F1F5F9]">
        <Link
          to={`/profile/${user.user_id}`}
          className="text-xs text-[#4A6741] font-semibold hover:underline"
        >
          Xem hồ sơ
        </Link>
        <FriendStatusButton
          user={user}
          onSend={onSend}
          isLoading={sendingId === user.user_id}
        />
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="rounded-xl border border-[#E2E8E2] bg-white p-4 animate-pulse flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-[#E2E8E2] shrink-0" />
        <div className="flex-1 space-y-1.5">
          <div className="h-4 bg-[#E2E8E2] rounded w-3/4" />
          <div className="h-3 bg-[#E2E8E2] rounded w-1/2" />
        </div>
      </div>
      <div className="flex gap-1">
        <div className="h-5 bg-[#E2E8E2] rounded w-14" />
        <div className="h-5 bg-[#E2E8E2] rounded w-12" />
        <div className="h-5 bg-[#E2E8E2] rounded w-16" />
      </div>
      <div className="h-px bg-[#F1F5F9]" />
      <div className="flex justify-between">
        <div className="h-4 bg-[#E2E8E2] rounded w-16" />
        <div className="h-7 bg-[#E2E8E2] rounded w-20" />
      </div>
    </div>
  );
}

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [inputQ, setInputQ] = useState(searchParams.get("q") ?? "");
  const [gender, setGender] = useState("");
  const [level, setLevel] = useState("");
  const [minAge, setMinAge] = useState("");
  const [maxAge, setMaxAge] = useState("");
  const [page, setPage] = useState(1);
  const [sendingId, setSendingId] = useState<number | undefined>();

  const queryClient = useQueryClient();
  const currentQ = searchParams.get("q") ?? "";

  useEffect(() => {
    setInputQ(currentQ);
    setPage(1);
  }, [currentQ]);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["userSearch", currentQ, gender, level, minAge, maxAge, page],
    queryFn: () => {
      const mappedGender = gender === "Nam" ? "MALE" : gender === "Nữ" ? "FEMALE" : gender === "Khác" ? "OTHER" : undefined;
      const mappedLevel = level === "Bản ngữ" ? "Native" : level || undefined;

      return searchUsers({
        q: currentQ || undefined,
        gender: mappedGender,
        japanese_level: mappedLevel,
        min_age: minAge ? Number(minAge) : undefined,
        max_age: maxAge ? Number(maxAge) : undefined,
        page,
        page_size: 12,
      });
    },
  });

  const sendMutation = useMutation({
    mutationFn: (receiver_id: number) => {
      setSendingId(receiver_id);
      return sendFriendRequest(receiver_id);
    },
    onSuccess: () => {
      toast.success("Đã gửi lời mời kết bạn!");
      queryClient.invalidateQueries({ queryKey: ["userSearch"] });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Không thể gửi lời mời kết bạn");
    },
    onSettled: () => setSendingId(undefined),
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    const trimmed = inputQ.trim();
    setSearchParams(trimmed ? { q: trimmed } : {});
  };

  const clearFilters = () => {
    setGender("");
    setLevel("");
    setMinAge("");
    setMaxAge("");
    setPage(1);
  };

  const hasActiveFilters = !!(gender || level || minAge || maxAge);
  const users = data?.data ?? [];
  const pagination = data?.pagination;

  return (
    <div className="min-h-screen bg-[#F9FAF9] font-inter">
      <Navbar />

      <main className="max-w-[1280px] mx-auto px-4 sm:px-6 py-6">
        {/* Page title + Search bar */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#2D3A3A] mb-4">
            Tìm kiếm người dùng
          </h1>
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1 max-w-xl">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path
                    d="M12.45 13.5L7.725 8.775C7.35 9.075 6.91875 9.3125 6.43125 9.4875C5.94375 9.6625 5.425 9.75 4.875 9.75C3.5125 9.75 2.35938 9.27813 1.41562 8.33438C0.471875 7.39063 0 6.2375 0 4.875C0 3.5125 0.471875 2.35938 1.41562 1.41562C2.35938 0.471875 3.5125 0 4.875 0C6.2375 0 7.39063 0.471875 8.33438 1.41562C9.27813 2.35938 9.75 3.5125 9.75 4.875C9.75 5.425 9.6625 5.94375 9.4875 6.43125C9.3125 6.91875 9.075 7.35 8.775 7.725L13.5 12.45L12.45 13.5ZM4.875 8.25C5.8125 8.25 6.60938 7.92188 7.26562 7.26562C7.92188 6.60938 8.25 5.8125 8.25 4.875C8.25 3.9375 7.92188 3.14062 7.26562 2.48438C6.60938 1.82812 5.8125 1.5 4.875 1.5C3.9375 1.5 3.14062 1.82812 2.48438 2.48438C1.82812 3.14062 1.5 3.9375 1.5 4.875C1.5 5.8125 1.82812 6.60938 2.48438 7.26562C3.14062 7.92188 3.9375 8.25 4.875 8.25Z"
                    fill="#94A3B8"
                  />
                </svg>
              </div>
              <input
                type="text"
                value={inputQ}
                onChange={(e) => setInputQ(e.target.value)}
                placeholder="Tìm kiếm theo tên..."
                className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-[#E2E8E2] bg-white text-sm text-[#2D3A3A] placeholder-[#94A3B8] outline-none focus:ring-2 focus:ring-[#4A6741]/20"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2.5 rounded-lg bg-[#4A6741] text-white text-sm font-semibold hover:bg-[#3d5836] transition-colors"
            >
              Tìm kiếm
            </button>
          </form>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-end gap-3 mb-6 p-4 bg-white rounded-xl border border-[#E2E8E2] shadow-sm">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#6B7280] uppercase self-center mr-1">
            <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
              <path
                d="M4.66667 10.5V7H5.83333V8.16667H10.5V9.33333H5.83333V10.5H4.66667ZM0 9.33333V8.16667H3.5V9.33333H0ZM2.33333 7V5.83333H0V4.66667H2.33333V3.5H3.5V7H2.33333ZM4.66667 5.83333V4.66667H10.5V5.83333H4.66667ZM7 3.5V0H8.16667V1.16667H10.5V2.33333H8.16667V3.5H7ZM0 2.33333V1.16667H5.83333V2.33333H0Z"
                fill="#6B7280"
              />
            </svg>
            Bộ lọc
          </div>

          <div className="flex flex-col gap-0.5">
            <label className="text-[10px] font-bold text-[#94A3B8] uppercase px-0.5">
              Giới tính
            </label>
            <select
              value={gender}
              onChange={(e) => {
                setGender(e.target.value);
                setPage(1);
              }}
              className="px-3 py-1.5 rounded-lg border border-[#E2E8E2] bg-white text-xs text-[#2D3A3A] outline-none focus:ring-2 focus:ring-[#4A6741]/20 cursor-pointer"
            >
              <option value="">Tất cả</option>
              <option value="Nam">Nam</option>
              <option value="Nữ">Nữ</option>
              <option value="Khác">Khác</option>
            </select>
          </div>

          <div className="flex flex-col gap-0.5">
            <label className="text-[10px] font-bold text-[#94A3B8] uppercase px-0.5">
              Trình độ tiếng Nhật
            </label>
            <select
              value={level}
              onChange={(e) => {
                setLevel(e.target.value);
                setPage(1);
              }}
              className="px-3 py-1.5 rounded-lg border border-[#E2E8E2] bg-white text-xs text-[#2D3A3A] outline-none focus:ring-2 focus:ring-[#4A6741]/20 cursor-pointer"
            >
              <option value="">Tất cả</option>
              <option value="N1">N1</option>
              <option value="N2">N2</option>
              <option value="N3">N3</option>
              <option value="N4">N4</option>
              <option value="N5">N5</option>
              <option value="Bản ngữ">Bản ngữ</option>
            </select>
          </div>

          <div className="flex flex-col gap-0.5">
            <label className="text-[10px] font-bold text-[#94A3B8] uppercase px-0.5">
              Độ tuổi
            </label>
            <div className="flex items-center gap-1">
              <input
                type="number"
                value={minAge}
                onChange={(e) => {
                  setMinAge(e.target.value);
                  setPage(1);
                }}
                placeholder="Từ"
                min={16}
                max={99}
                className="w-16 px-2 py-1.5 rounded-lg border border-[#E2E8E2] bg-white text-xs text-[#2D3A3A] outline-none focus:ring-2 focus:ring-[#4A6741]/20"
              />
              <span className="text-xs text-[#94A3B8]">–</span>
              <input
                type="number"
                value={maxAge}
                onChange={(e) => {
                  setMaxAge(e.target.value);
                  setPage(1);
                }}
                placeholder="Đến"
                min={16}
                max={99}
                className="w-16 px-2 py-1.5 rounded-lg border border-[#E2E8E2] bg-white text-xs text-[#2D3A3A] outline-none focus:ring-2 focus:ring-[#4A6741]/20"
              />
            </div>
          </div>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="px-3 py-1.5 rounded-lg bg-[#FEF2F2] text-[#DC2626] text-xs font-semibold hover:bg-red-100 transition-colors self-end"
            >
              Xóa bộ lọc
            </button>
          )}
        </div>

        {/* Results header */}
        <div className="mb-4 flex items-center justify-between min-h-[24px]">
          {pagination != null ? (
            <p className="text-sm text-[#6B7280]">
              Tìm thấy{" "}
              <span className="font-semibold text-[#2D3A3A]">
                {pagination.total}
              </span>{" "}
              người dùng
              {currentQ && (
                <>
                  {" "}cho "
                  <span className="font-semibold text-[#2D3A3A]">
                    {currentQ}
                  </span>
                  "
                </>
              )}
            </p>
          ) : (
            <span />
          )}
          {isFetching && !isLoading && (
            <span className="text-xs text-[#94A3B8]">Đang cập nhật...</span>
          )}
        </div>

        {/* Results */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-full bg-[#F1F5F9] flex items-center justify-center mx-auto mb-4">
              <svg width="28" height="28" viewBox="0 0 14 14" fill="none">
                <path
                  d="M12.45 13.5L7.725 8.775C7.35 9.075 6.91875 9.3125 6.43125 9.4875C5.94375 9.6625 5.425 9.75 4.875 9.75C3.5125 9.75 2.35938 9.27813 1.41562 8.33438C0.471875 7.39063 0 6.2375 0 4.875C0 3.5125 0.471875 2.35938 1.41562 1.41562C2.35938 0.471875 3.5125 0 4.875 0C6.2375 0 7.39063 0.471875 8.33438 1.41562C9.27813 2.35938 9.75 3.5125 9.75 4.875C9.75 5.425 9.6625 5.94375 9.4875 6.43125C9.3125 6.91875 9.075 7.35 8.775 7.725L13.5 12.45L12.45 13.5ZM4.875 8.25C5.8125 8.25 6.60938 7.92188 7.26562 7.26562C7.92188 6.60938 8.25 5.8125 8.25 4.875C8.25 3.9375 7.92188 3.14062 7.26562 2.48438C6.60938 1.82812 5.8125 1.5 4.875 1.5C3.9375 1.5 3.14062 1.82812 2.48438 2.48438C1.82812 3.14062 1.5 3.9375 1.5 4.875C1.5 5.8125 1.82812 6.60938 2.48438 7.26562C3.14062 7.92188 3.9375 8.25 4.875 8.25Z"
                  fill="#94A3B8"
                />
              </svg>
            </div>
            <p className="text-[#6B7280] font-medium">
              {currentQ || hasActiveFilters
                ? "Không tìm thấy người dùng phù hợp"
                : "Nhập tên để tìm kiếm người dùng"}
            </p>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="mt-3 text-sm text-[#4A6741] font-semibold hover:underline"
              >
                Xóa bộ lọc
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {users.map((user) => (
                <UserCard
                  key={user.user_id}
                  user={user}
                  onSend={(id) => sendMutation.mutate(id)}
                  sendingId={sendingId}
                />
              ))}
            </div>

            {/* Pagination */}
            {pagination && pagination.total_pages > 1 && (
              <div className="flex justify-center items-center gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="px-3 py-1.5 rounded-lg border border-[#E2E8E2] bg-white text-sm font-medium text-[#2D3A3A] hover:bg-[#F9FAF9] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Trước
                </button>
                <span className="px-3 py-1.5 text-sm text-[#6B7280]">
                  Trang {page} / {pagination.total_pages}
                </span>
                <button
                  disabled={page >= pagination.total_pages}
                  onClick={() => setPage((p) => p + 1)}
                  className="px-3 py-1.5 rounded-lg border border-[#E2E8E2] bg-white text-sm font-medium text-[#2D3A3A] hover:bg-[#F9FAF9] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Tiếp
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
