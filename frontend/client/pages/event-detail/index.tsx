import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import Navbar from "@/components/Navbar";
import EditEventModal, { Event } from "@/components/EditEventModal";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { useTranslation } from "react-i18next";
import { getImageUrl } from "@/lib/utils";

interface FeedbackOut {
  feedback_id: number;
  rating: number;
  comment: string;
  created_at: string;
  user: {
    user_id: number;
    full_name: string;
    avatar_url: string | null;
  };
}
interface EventOut {
  event_id: number;
  title: string;
  category: string | null;
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

interface UserOut {
  user_id: number;
  role: string;
}

function mapEventOutToEditEvent(e: EventOut): Event {
  const apiStatus = e.status?.toUpperCase();
  let status: "upcoming" | "ongoing" | "finished" | "closed" | "cancelled" = "ongoing";
  if (apiStatus === "FINISHED") status = "closed";
  else if (apiStatus === "CANCELLED") status = "cancelled";
  
  return {
    id: e.event_id,
    name: e.title,
    category: e.category ?? "Sự kiện",
    maxAttendees: e.capacity,
    date: e.start_time,
    endDate: e.end_time || e.start_time,
    location: e.location,
    description: e.description,
    coverImage: getImageUrl(e.image_url, "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&h=200&fit=crop"),
    status,
    timeStatus: apiStatus === "FINISHED" ? "finished" : "ongoing",
    isClosed: apiStatus === "FINISHED",
    isCancelled: apiStatus === "CANCELLED",
  };
}

const CalendarIcon = () => (
  <svg width="18" height="20" viewBox="0 0 18 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g clipPath="url(#clip-cal)">
      <path d="M2 20C1.45 20 0.979167 19.8042 0.5875 19.4125C0.195833 19.0208 0 18.55 0 18V4C0 3.45 0.195833 2.97917 0.5875 2.5875C0.979167 2.19583 1.45 2 2 2H3V0H5V2H13V0H15V2H16C16.55 2 17.0208 2.19583 17.4125 2.5875C17.8042 2.97917 18 3.45 18 4V18C18 18.55 17.8042 19.0208 17.4125 19.4125C17.0208 19.8042 16.55 20 16 20H2ZM2 18H16V8H2V18ZM2 6H16V4H2V6Z" fill="#009668" />
    </g>
    <defs><clipPath id="clip-cal"><rect width="18" height="20" fill="white" /></clipPath></defs>
  </svg>
);

const LocationIcon = () => (
  <svg width="16" height="20" viewBox="0 0 16 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g clipPath="url(#clip-loc)">
      <path d="M8 10C8.55 10 9.02083 9.80417 9.4125 9.4125C9.80417 9.02083 10 8.55 10 8C10 7.45 9.80417 6.97917 9.4125 6.5875C9.02083 6.19583 8.55 6 8 6C7.45 6 6.97917 6.19583 6.5875 6.5875C6.19583 6.97917 6 7.45 6 8C6 8.55 6.19583 9.02083 6.5875 9.4125C6.97917 9.80417 7.45 10 8 10ZM8 17.35C10.0333 15.4833 11.5417 13.7875 12.525 12.2625C13.5083 10.7375 14 9.38333 14 8.2C14 6.38333 13.4208 4.89583 12.2625 3.7375C11.1042 2.57917 9.68333 2 8 2C6.31667 2 4.89583 2.57917 3.7375 3.7375C2.57917 4.89583 2 6.38333 2 8.2C2 9.38333 2.49167 10.7375 3.475 12.2625C4.45833 13.7875 5.96667 15.4833 8 17.35ZM8 20C5.31667 17.7167 3.3125 15.5958 1.9875 13.6375C0.6625 11.6792 0 9.86667 0 8.2C0 5.7 0.804167 3.70833 2.4125 2.225C4.02083 0.741667 5.88333 0 8 0C10.1167 0 11.9792 0.741667 13.5875 2.225C15.1958 3.70833 16 5.7 16 8.2C16 9.86667 15.3375 11.6792 14.0125 13.6375C12.6875 15.5958 10.6833 17.7167 8 20Z" fill="#009668" />
    </g>
    <defs><clipPath id="clip-loc"><rect width="16" height="20" fill="white" /></clipPath></defs>
  </svg>
);

const BackArrowIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12.5 15L7.5 10L12.5 5" stroke="#4A6741" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export default function Index() {
  const { t, i18n } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [newRating, setNewRating] = useState(5);

  const { data: user } = useQuery({
    queryKey: ["me"],
    queryFn: () => apiFetch<UserOut>("/api/v1/users/me"),
  });

  const { data: event, isLoading, isError } = useQuery({
    queryKey: ["event", id],
    queryFn: () => apiFetch<EventOut>(`/api/v1/events/${id}`),
    enabled: !!id,
  });

  const registerMutation = useMutation({
    mutationFn: () => apiFetch(`/api/v1/events/${id}/register`, { method: "POST" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["event", id] }),
  });

  const unregisterMutation = useMutation({
    mutationFn: () => apiFetch(`/api/v1/events/${id}/register`, { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["event", id] }),
  });

  const updateMutation = useMutation({
    mutationFn: (data: Partial<EventOut>) => apiFetch(`/api/v1/events/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event", id] });
      setIsEditing(false);
    },
  });

  const { data: feedbackList } = useQuery({
    queryKey: ["event-feedback", id],
    queryFn: () => apiFetch<FeedbackOut[]>(`/api/v1/events/${id}/feedback`),
    enabled: !!id,
  });

  const feedbackMutation = useMutation({
    mutationFn: (data: { rating: number; comment: string }) =>
      apiFetch(`/api/v1/events/${id}/feedback`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event-feedback", id] });
      setNewComment("");
      setNewRating(5);
    },
  });

  const isOrganizer = user?.user_id === event?.organizer.user_id;
  const hasFeedback = feedbackList?.some((f) => f.user.user_id === user?.user_id);
  const canFeedback = event?.is_registered && !isOrganizer && !hasFeedback;

  const registered = event?.registered_count ?? 0;
  const total = event?.capacity ?? 1;
  const progressPct = (registered / total) * 100;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background font-inter">
        <Navbar />
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-brand-green border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (isError || !event) {
    return (
      <div className="min-h-screen bg-background font-inter">
        <Navbar />
        <main className="max-w-[1180px] mx-auto px-6 py-6 pb-12">
          <p className="text-center text-red-500 py-10">{t("events.loadError")}</p>
        </main>
      </div>
    );
  }

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

  return (
    <div className="min-h-screen bg-background font-inter">
      <Navbar />

      <main className="max-w-[1180px] mx-auto px-6 py-6 pb-12">
        <Link
          to="/events"
          className="inline-flex items-center gap-2 text-brand-dark-green text-sm font-semibold mb-6 hover:opacity-80 transition-opacity"
        >
          <BackArrowIcon />
          <span>{t("events.backToList")}</span>
        </Link>

        <div className="relative rounded-lg overflow-hidden h-[280px] sm:h-[360px] lg:h-[450px] bg-[#F6F3F5] mb-6">
          <img
            src={getImageUrl(finalImage, "https://api.builder.io/api/v1/image/assets/TEMP/78e3156d16c6300089b55bfaf620fc8759e9c921?width=2264")}
            alt={event.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[rgba(19,27,46,0.85)] via-[rgba(19,27,46,0)] to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8">
            <div className="inline-flex items-center bg-brand-green px-3 py-1 rounded-sm mb-3">
              <span className="text-white text-[10px] font-bold tracking-[1.5px] uppercase">{t(`eventStatus.${event.status}`, { defaultValue: event.status })}</span>
            </div>
            {event.category && (
              <div className="mb-3">
                <span className="inline-block bg-white/20 backdrop-blur-md text-white text-[11px] font-bold px-3 py-1 rounded-sm uppercase tracking-wider border border-white/30">
                  {t(`eventCategories.${event.category}`, { defaultValue: event.category })}
                </span>
              </div>
            )}
            <h1 className="text-white text-3xl sm:text-4xl lg:text-[42px] font-black leading-tight tracking-[-1.2px]">
              {event.title}
            </h1>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 items-start">
          <div className="w-full flex-1 min-w-0 order-2 lg:order-1">
            <div className="bg-white rounded-lg border border-[#E4E2E4] shadow-[0_8px_32px_0_rgba(0,0,0,0.04)] p-6">
              <div className="pb-4 mb-5 border-b border-[#F0EDEF]">
                <h2 className="text-[#1B1B1D] text-xl font-bold leading-7 tracking-[-0.5px]">{t("events.eventInfo")}</h2>
              </div>
              <div className="space-y-4 text-[#45464D] text-[15px] leading-[26px]">
                <p>{event.description}</p>
              </div>

              <div className="mt-8 pt-8 border-t border-[#F0EDEF]">
                <div className="flex items-center gap-4 mb-6">
                  <h3 className="text-[#1B1B1D] text-lg font-bold">{t("events.organizer")}</h3>
                </div>
                <Link
                  to={`/profile/${event.organizer.user_id}`}
                  className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100 hover:bg-slate-100/70 transition-colors w-full cursor-pointer"
                >
                  <img
                    src={event.organizer.avatar_url || "https://api.builder.io/api/v1/image/assets/TEMP/1aa6cda7cbb8af6978846088580c88c40f54f3f7?width=48"}
                    alt={event.organizer.full_name}
                    className="w-12 h-12 rounded-full object-cover shadow-sm"
                  />
                  <div>
                    <p className="text-[#1B1B1D] font-bold hover:text-brand-green transition-colors">{event.organizer.full_name}</p>
                    <p className="text-wc-gray text-xs">Organizer</p>
                  </div>
                </Link>
              </div>
            </div>

            <div className="mt-6 bg-white rounded-lg border border-[#E4E2E4] shadow-[0_8px_32px_0_rgba(0,0,0,0.04)] p-6">
              <div className="pb-4 mb-6 border-b border-[#F0EDEF] flex items-center justify-between">
                <h2 className="text-[#1B1B1D] text-xl font-bold leading-7 tracking-[-0.5px]">{t("events.feedback")}</h2>
                <span className="text-wc-gray text-sm font-medium">{feedbackList?.length || 0} {t("events.reviews")}</span>
              </div>

              {canFeedback && (
                <div className="mb-8 p-6 rounded-xl bg-wc-light border border-wc-border">
                  <h4 className="text-[#1B1B1D] font-bold mb-4">{t("events.leaveFeedback")}</h4>
                  <div className="flex items-center gap-2 mb-4">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setNewRating(star)}
                        className="focus:outline-none transition-transform hover:scale-110"
                      >
                        <svg
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill={star <= newRating ? "#FBBF24" : "none"}
                          stroke={star <= newRating ? "#FBBF24" : "#CBD5E1"}
                          strokeWidth="2"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.56 5.82 22 7 14.14l-5-4.87 6.91-1.01L12 2z" />
                        </svg>
                      </button>
                    ))}
                  </div>
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder={t("events.feedbackPlaceholder")}
                    className="w-full h-24 p-4 rounded-lg border border-slate-200 outline-none focus:border-wc-green transition-colors resize-none text-sm mb-4"
                  />
                  <button
                    onClick={() => feedbackMutation.mutate({ rating: newRating, comment: newComment })}
                    disabled={feedbackMutation.isPending || !newComment.trim()}
                    className="bg-wc-green hover:bg-wc-green/90 text-white font-bold py-2 px-6 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {t("events.sendFeedback")}
                  </button>
                </div>
              )}

              <div className="space-y-6">
                {feedbackList && feedbackList.length > 0 ? (
                  feedbackList.map((feedback) => (
                    <div key={feedback.feedback_id} className="flex gap-4 pb-6 border-b border-slate-50 last:border-0 last:pb-0">
                      <img
                        src={feedback.user.avatar_url || "https://api.builder.io/api/v1/image/assets/TEMP/1aa6cda7cbb8af6978846088580c88c40f54f3f7?width=48"}
                        alt={feedback.user.full_name}
                        className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-[#1B1B1D] text-sm">{feedback.user.full_name}</span>
                          <span className="text-[#A1A1A5] text-xs">
                            {new Date(feedback.created_at).toLocaleDateString("vi-VN")}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 mb-2">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <svg
                              key={star}
                              width="12"
                              height="12"
                              viewBox="0 0 24 24"
                              fill={star <= feedback.rating ? "#FBBF24" : "none"}
                              stroke={star <= feedback.rating ? "#FBBF24" : "#CBD5E1"}
                              strokeWidth="2"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.56 5.82 22 7 14.14l-5-4.87 6.91-1.01L12 2z" />
                            </svg>
                          ))}
                        </div>
                        <p className="text-[#45464D] text-sm leading-relaxed">{feedback.comment}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-wc-gray py-8 italic">{t("events.noFeedback")}</p>
                )}
              </div>
            </div>
          </div>

          <div className="w-full lg:w-[380px] flex-shrink-0 order-1 lg:order-2">
            <div className="bg-white rounded-lg border border-[#E4E2E4] shadow-[0_8px_32px_0_rgba(0,0,0,0.04)] p-6">
              <p className="text-[#1B1B1D] text-sm font-semibold mb-5">{t("events.eventDetails")}</p>

              {event.category && (
                <div className="flex items-start gap-3.5 mb-5 pb-5 border-b border-[#F0EDEF]">
                  <div className="w-[42px] h-[42px] rounded-lg bg-brand-icon-bg flex items-center justify-center flex-shrink-0">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4A6741" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
                      <line x1="7" y1="7" x2="7.01" y2="7"/>
                    </svg>
                  </div>
                  <div>
                    <p className="text-[#57657B] text-[10px] font-bold tracking-[1px] uppercase mb-0.5">{t("events.category")}</p>
                    <span className="inline-block bg-wc-light-green text-wc-green text-xs font-bold px-3 py-1 rounded-full">
                      {t(`eventCategories.${event.category}`, { defaultValue: event.category })}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3.5 mb-5">
                <div className="w-[42px] h-[42px] rounded-lg bg-brand-icon-bg flex items-center justify-center flex-shrink-0">
                  <CalendarIcon />
                </div>
                <div>
                  <p className="text-[#57657B] text-[10px] font-bold tracking-[1px] uppercase mb-0.5">{t("events.time")}</p>
                  <p className="text-[#1B1B1D] text-sm font-semibold leading-5">
                    {event.start_time ? new Date(event.start_time).toLocaleDateString(i18n.language === 'ja' ? 'ja-JP' : 'vi-VN', { year: "numeric", month: "long", day: "numeric", weekday: "long" }) : ""}
                  </p>
                  <p className="text-[#45464D] text-xs leading-4">
                    {event.start_time ? new Date(event.start_time).toLocaleTimeString(i18n.language === 'ja' ? 'ja-JP' : 'vi-VN', { hour: "2-digit", minute: "2-digit" }) : ""}
                    {event.end_time ? ` 〜 ${new Date(event.end_time).toLocaleTimeString(i18n.language === 'ja' ? 'ja-JP' : 'vi-VN', { hour: "2-digit", minute: "2-digit" })}` : ""}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5 mb-6 pb-5 border-b border-[#F0EDEF]">
                <div className="w-[42px] h-[42px] rounded-lg bg-brand-icon-bg flex items-center justify-center flex-shrink-0">
                  <LocationIcon />
                </div>
                <div>
                  <p className="text-[#57657B] text-[10px] font-bold tracking-[1px] uppercase mb-0.5">{t("events.location")}</p>
                  <p className="text-[#1B1B1D] text-sm font-semibold leading-5">{event.location}</p>
                </div>
              </div>

              <div className="mb-5">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[#1B1B1D] text-sm font-medium">{t("events.participationStatus")}</span>
                  <span className="text-brand-green text-sm font-semibold">{registered} / {total} {t("events.people")}</span>
                </div>
                <div className="w-full h-1.5 bg-[#F0EDEF] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-brand-green rounded-full"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
                <div className="flex items-center justify-between mt-1.5">
                  <span className="text-[#45464D] text-xs">{t("events.registeredCount", { count: registered })}</span>
                  <span className="text-[#45464D] text-xs">{t("events.emptySpots", { count: total - registered })}</span>
                </div>
              </div>

              {isOrganizer ? (
                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => setIsEditing(true)}
                    className="w-full bg-[#1B1B1D] hover:bg-[#2D2D2F] transition-colors text-white text-sm font-bold py-3.5 px-6 rounded-lg"
                  >
                    {t("events.editEvent")}
                  </button>
                  <Link
                    to={`/organizer/events/${id}/stats`}
                    className="w-full bg-white border border-[#E4E2E4] hover:bg-slate-50 transition-colors text-[#1B1B1D] text-sm font-bold py-3.5 px-6 rounded-lg text-center"
                  >
                    {t("events.viewStats")}
                  </Link>
                </div>
              ) : event.is_full && !event.is_registered ? (
                <button disabled className="w-full bg-gray-300 text-gray-500 text-sm font-bold py-3.5 px-6 rounded-lg cursor-not-allowed">
                  Hết chỗ
                </button>
              ) : event.is_registered ? (
                <button
                  onClick={() => unregisterMutation.mutate()}
                  disabled={unregisterMutation.isPending}
                  className="w-full bg-red-600 hover:bg-red-700 transition-colors text-white text-sm font-bold py-3.5 px-6 rounded-lg disabled:opacity-60"
                >
                  {unregisterMutation.isPending ? t("events.processing") : t("events.cancelRegistration")}
                </button>
              ) : (
                <button
                  onClick={() => registerMutation.mutate()}
                  disabled={registerMutation.isPending}
                  className="w-full bg-[#1B1B1D] hover:bg-[#2D2D2F] transition-colors text-white text-sm font-bold py-3.5 px-6 rounded-lg disabled:opacity-60"
                >
                  {registerMutation.isPending ? t("events.processing") : t("events.registerNow")}
                </button>
              )}
            </div>
          </div>
        </div>

        {isEditing && event && (
          <EditEventModal
            event={mapEventOutToEditEvent(event)}
            onClose={() => setIsEditing(false)}
            onSave={(updated) => {
              updateMutation.mutate({
                title: updated.name,
                description: updated.description,
                location: updated.location,
                capacity: updated.maxAttendees,
                start_time: updated.date,
                // end_time: updated.date, // Need to handle end_time better
              });
            }}
            onCancel={() => {
              if (confirm(t("events.deleteConfirm"))) {
                apiFetch(`/api/v1/events/${id}`, { method: "DELETE" }).then(() => {
                  window.location.href = "/events";
                });
              }
            }}
            onCloseRegistration={() => {
              updateMutation.mutate({ status: "CLOSED" });
            }}
          />
        )}
      </main>
    </div>
  );
}
