import { Link, useParams } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { getImageUrl } from "@/lib/utils";

const StarFull = () => (
  <svg width="22" height="21" viewBox="0 0 22 21" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4.2075 20.9L5.995 13.1725L0 7.975L7.92 7.2875L11 0L14.08 7.2875L22 7.975L16.005 13.1725L17.7925 20.9L11 16.8025L4.2075 20.9Z" fill="#FBBF24"/>
  </svg>
);

const StarHalf = () => (
  <svg width="22" height="21" viewBox="0 0 22 21" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M14.465 16.335L13.5575 12.375L16.61 9.735L12.595 9.3775L11 5.6375V14.2175L14.465 16.335ZM4.2075 20.9L5.995 13.1725L0 7.975L7.92 7.2875L11 0L14.08 7.2875L22 7.975L16.005 13.1725L17.7925 20.9L11 16.8025L4.2075 20.9Z" fill="#FBBF24"/>
  </svg>
);

const StarSmall = ({ filled }: { filled?: boolean }) => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3.06 15.2L4.36 9.58L0 5.8L5.76 5.3L8 0L10.24 5.3L16 5.8L11.64 9.58L12.94 15.2L8 12.22L3.06 15.2Z" fill={filled !== false ? "#FBBF24" : "#E2E8F0"}/>
  </svg>
);

interface EventStats {
  event_id: number;
  title: string;
  total_registrations: number;
  capacity: number;
  registration_rate: number;
  average_rating: number;
  feedback_count: number;
  rating_distribution: {
    one: number;
    two: number;
    three: number;
    four: number;
    five: number;
  };
}

interface Participant {
  user_id: number;
  full_name: string;
  avatar_url?: string;
  registered_at: string;
}

interface EventOut {
  event_id: number;
  title: string;
  description: string;
  start_time: string;
  location: string;
  image_url?: string;
  status: string;
}

export default function Index() {
  const { id } = useParams<{ id: string }>();

  const { data: event } = useQuery({
    queryKey: ["event", id],
    queryFn: () => apiFetch<EventOut>(`/api/v1/events/${id}`),
    enabled: !!id,
  });

  const { data: stats } = useQuery({
    queryKey: ["event-stats", id],
    queryFn: () => apiFetch<EventStats>(`/api/v1/events/${id}/statistics`),
    enabled: !!id,
  });

  const { data: participants } = useQuery({
    queryKey: ["event-participants", id],
    queryFn: () => apiFetch<Participant[]>(`/api/v1/events/${id}/participants`),
    enabled: !!id,
  });

  if (!event || !stats) {
    return (
      <div className="min-h-screen bg-[#F8F9FA]">
        <Navbar />
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-wc-green border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  const attendanceRate = Math.round(stats.registration_rate * 100);

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <Navbar />
      <div className="max-w-[1180px] mx-auto px-4 sm:px-6 py-8">
        {/* Page header */}
        <div className="flex items-center gap-3 mb-6">
          <Link to="/organizer/events" className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-slate-100 transition-colors flex-shrink-0">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 14.25L3.75 9L9 3.75" stroke="#1B1B1D" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M14.25 9H3.75" stroke="#1B1B1D" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Link>
          <h1 className="text-xl font-bold leading-[30px] text-black">Thống kê sự kiện</h1>
        </div>

        {/* Event card */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6 mb-6">
          <div className="flex flex-col sm:flex-row items-start gap-5">
            <div className="w-full sm:w-[140px] flex-shrink-0">
              <img
                src={getImageUrl(event.image_url, "https://api.builder.io/api/v1/image/assets/TEMP/803c3de7ce411d9f4e7d4bc98154a2da6da183bc?width=280")}
                alt={event.title}
                className="w-full sm:w-[140px] h-[100px] object-cover rounded-lg"
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-slate-800 text-white text-[11px] font-semibold tracking-wide uppercase">
                  {event.status}
                </span>
                <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-500 text-[11px] font-semibold tracking-wide">
                  Sự kiện
                </span>
              </div>
              <h2 className="text-2xl font-bold leading-8 text-black mb-2">{event.title}</h2>
              <div className="flex items-center gap-1.5 text-[#45464D] text-sm">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0">
                  <g clipPath="url(#clip0_date)">
                    <path d="M4.66699 1.16669V3.50002" stroke="#94A3B8" strokeWidth="1.16667" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M9.33301 1.16669V3.50002" stroke="#94A3B8" strokeWidth="1.16667" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M11.0833 2.33331H2.91667C2.27233 2.33331 1.75 2.85565 1.75 3.49998V11.6666C1.75 12.311 2.27233 12.8333 2.91667 12.8333H11.0833C11.7277 12.8333 12.25 12.311 12.25 11.6666V3.49998C12.25 2.85565 11.7277 2.33331 11.0833 2.33331Z" stroke="#94A3B8" strokeWidth="1.16667" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M1.75 5.83331H12.25" stroke="#94A3B8" strokeWidth="1.16667" strokeLinecap="round" strokeLinejoin="round"/>
                  </g>
                  <defs><clipPath id="clip0_date"><rect width="14" height="14" fill="white"/></clipPath></defs>
                </svg>
                <span>{new Date(event.start_time).toLocaleString("vi-VN")}</span>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0 self-start">
              <button className="flex items-center gap-2 px-4 h-[37px] border border-slate-200 rounded-lg text-slate-600 text-[13px] font-medium hover:bg-slate-50 transition-colors whitespace-nowrap">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M14 10V12.6667C14 13.0203 13.8595 13.3594 13.6095 13.6095C13.3594 13.8595 13.0203 14 12.6667 14H3.33333C2.97971 14 2.64057 13.8595 2.39052 13.6095C2.14048 13.3594 2 13.0203 2 12.6667V10" stroke="#475569" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M11.3337 5.33333L8.00033 2L4.66699 5.33333" stroke="#475569" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M8 2V10" stroke="#475569" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Xuất báo cáo
              </button>
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
          {/* Attendance rate */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
            <p className="text-[12px] font-semibold text-[#515F74] tracking-[0.7px] uppercase mb-4">Tỷ lệ đăng ký</p>
            <div className="flex items-center gap-3 mb-4">
              <span className="text-[36px] font-black leading-10 text-emerald-600">{attendanceRate}%</span>
            </div>
            <div className="w-full h-1.5 bg-slate-200 rounded-full mb-4 overflow-hidden">
              <div className="h-full bg-emerald-600 rounded-full" style={{ width: `${attendanceRate}%` }} />
            </div>
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <g clipPath="url(#clip0_reg)">
                      <path d="M8 10.5V9.5C8 8.96957 7.78929 8.46086 7.41421 8.08579C7.03914 7.71071 6.53043 7.5 6 7.5H3C2.46957 7.5 1.96086 7.71071 1.58579 8.08579C1.21071 8.46086 1 8.96957 1 9.5V10.5" stroke="#3B82F6" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M4.5 5.5C5.60457 5.5 6.5 4.60457 6.5 3.5C6.5 2.39543 5.60457 1.5 4.5 1.5C3.39543 1.5 2.5 2.39543 2.5 3.5C2.5 4.60457 3.39543 5.5 4.5 5.5Z" stroke="#3B82F6" strokeLinecap="round" strokeLinejoin="round"/>
                    </g>
                    <defs><clipPath id="clip0_reg"><rect width="12" height="12" fill="white"/></clipPath></defs>
                  </svg>
                  <span className="text-xs font-medium text-slate-500">Số người đăng ký</span>
                </div>
                <span className="text-[13px] font-bold text-blue-500">{stats.total_registrations} người</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <g clipPath="url(#clip0_att)">
                      <path d="M8 10.5V9.5C8 8.96957 7.78929 8.46086 7.41421 8.08579C7.03914 7.71071 6.53043 7.5 6 7.5H3C2.46957 7.5 1.96086 7.71071 1.58579 8.08579C1.21071 8.46086 1 8.96957 1 9.5V10.5" stroke="#059669" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M4.5 5.5C5.60457 5.5 6.5 4.60457 6.5 3.5C6.5 2.39543 5.60457 1.5 4.5 1.5C3.39543 1.5 2.5 2.39543 2.5 3.5C2.5 4.60457 3.39543 5.5 4.5 5.5Z" stroke="#059669" strokeLinecap="round" strokeLinejoin="round"/>
                    </g>
                    <defs><clipPath id="clip0_att"><rect width="12" height="12" fill="white"/></clipPath></defs>
                  </svg>
                  <span className="text-xs font-medium text-slate-500">Sức chứa tối đa</span>
                </div>
                <span className="text-[13px] font-bold text-emerald-600">{stats.capacity} người</span>
              </div>
            </div>
          </div>

          {/* Average rating - dark card */}
          <div className="rounded-lg p-6 flex flex-col gap-2" style={{ backgroundColor: "#131B2E" }}>
            <p className="text-[12px] font-semibold tracking-[0.7px] uppercase" style={{ color: "#7C839B" }}>
              ĐÁNH GIÁ TRUNG BÌNH
            </p>
            <div className="flex items-center gap-2">
              <span className="text-[40px] font-black leading-12 text-white">{stats.average_rating}</span>
              <div className="flex items-center gap-1">
                <StarFull />
                <StarFull />
                <StarFull />
                <StarFull />
                <StarHalf />
              </div>
            </div>
            <p className="text-[13px] text-slate-400">{stats.feedback_count} Đánh giá & Phản hồi</p>
          </div>

          {/* Participants list */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-3 overflow-y-auto max-h-[220px]">
            <div className="flex items-center justify-between mb-3 px-1">
              <span className="text-[13px] font-bold text-black">Danh sách tham gia</span>
              <span className="text-[13px] font-bold text-black">{participants?.length ?? 0}</span>
            </div>
            <div className="flex flex-col gap-1.5 mb-3">
              {(participants ?? []).map(p => (
                <div key={p.user_id} className="flex items-center gap-2">
                  <img
                    src={getImageUrl(p.avatar_url, "https://api.builder.io/api/v1/image/assets/TEMP/1aa6cda7cbb8af6978846088580c88c40f54f3f7?width=48")}
                    alt={p.full_name}
                    className="w-6 h-6 rounded-full object-cover flex-shrink-0"
                  />
                  <div>
                    <p className="text-[11px] font-medium text-black leading-[14px]">{p.full_name}</p>
                    <p className="text-[9px] font-medium text-slate-400 tracking-[0.4px]">Tham gia lúc: {new Date(p.registered_at).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Reviews & Feedback */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm px-6 py-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-black">Đánh giá & Phản hồi</h3>
            <button className="text-sm font-medium text-emerald-600 hover:text-emerald-700 transition-colors">
              Xem tất cả báo cáo
            </button>
          </div>
          <div className="border border-slate-100 rounded-lg p-4">
            <div className="flex items-start gap-4">
              <img
                src="https://api.builder.io/api/v1/image/assets/TEMP/95ac0912a171473c57936f1717b51a3b63d64638?width=80"
                alt="Vũ Minh Tú"
                className="w-10 h-10 rounded-full object-cover flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-semibold text-black">Vũ Minh Tú</span>
                  <div className="flex items-center gap-1">
                    <StarSmall />
                    <StarSmall />
                    <StarSmall />
                    <StarSmall />
                    <StarSmall />
                  </div>
                </div>
                <p className="text-sm text-slate-600 leading-[22px]">
                  Bữa tiệc sang trọng, cơ hội networking tuyệt vời.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
