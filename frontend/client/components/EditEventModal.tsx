import { useState, useRef, useEffect } from "react";
import { apiFetch } from "@/lib/api";

const parseVietnameseDateTime = (str: string) => {
  const regex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2})(?:\s+(SA|CH|AM|PM))?$/i;
  const match = str.trim().match(regex);
  if (!match) return null;
  let [_, d, m, y, h, min, ampm] = match;
  let hour = parseInt(h, 10);
  if (ampm) {
    ampm = ampm.toUpperCase();
    if ((ampm === 'CH' || ampm === 'PM') && hour < 12) hour += 12;
    if ((ampm === 'SA' || ampm === 'AM') && hour === 12) hour = 0;
  }
  const YYYY = y;
  const MM = m.padStart(2, '0');
  const DD = d.padStart(2, '0');
  const HH = hour.toString().padStart(2, '0');
  const mm = min.padStart(2, '0');
  return `${YYYY}-${MM}-${DD}T${HH}:${mm}`;
};

const formatVietnameseDateTime = (isoStr: string) => {
  if (!isoStr) return "";
  const [date, time] = isoStr.split("T");
  if (!date || !time) return isoStr;
  const [y, m, d] = date.split("-");
  let [H, min] = time.split(":");
  let hour = parseInt(H, 10);
  let ampm = "SA";
  if (hour >= 12) {
    ampm = "CH";
    if (hour > 12) hour -= 12;
  }
  if (hour === 0) hour = 12;
  return `${d}/${m}/${y} ${hour.toString().padStart(2, '0')}:${min} ${ampm}`;
};

function DateTimePickerInput({ name, value, onChange }: { name: string, value: string, onChange: (e: any) => void }) {
  const [textValue, setTextValue] = useState(formatVietnameseDateTime(value));
  const [lastPushedValue, setLastPushedValue] = useState(value);
  const hiddenInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (value !== lastPushedValue) {
      setTextValue(formatVietnameseDateTime(value));
      setLastPushedValue(value);
    }
  }, [value, lastPushedValue]);

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newText = e.target.value;
    setTextValue(newText);
    const parsed = parseVietnameseDateTime(newText);
    if (parsed && parsed !== value) {
      setLastPushedValue(parsed);
      onChange({ target: { name, value: parsed } });
    }
  };

  const handleNativeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    onChange({ target: { name, value: val } });
  };

  const handleBlur = () => {
    setTextValue(formatVietnameseDateTime(value));
  };

  return (
    <div className="relative">
      <input
        type="text"
        value={textValue}
        onChange={handleTextChange}
        onBlur={handleBlur}
        placeholder="DD/MM/YYYY HH:mm SA"
        className="h-[33px] w-full pl-8 pr-[10px] text-[13px] text-black border border-slate-200 rounded-[6px] outline-none focus:border-slate-400 transition-colors"
      />
      <div 
        className="absolute left-[8px] top-1/2 -translate-y-1/2 cursor-pointer text-slate-400 hover:text-emerald-600 z-10"
        onClick={() => {
          try { hiddenInputRef.current?.showPicker(); } catch (e) { hiddenInputRef.current?.focus(); }
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="17" rx="2" />
          <path d="M8 2v4M16 2v4M3 10h18" />
        </svg>
      </div>
      <input
        type="datetime-local"
        ref={hiddenInputRef}
        value={value ? value.slice(0, 16) : ""}
        onChange={handleNativeChange}
        className="absolute w-0 h-0 opacity-0 pointer-events-none"
        style={{ border: 'none', padding: 0 }}
      />
    </div>
  );
}

interface Event {
  id: number;
  name: string;
  category: string;
  maxAttendees: number;
  date: string;
  endDate: string;
  location: string;
  description: string;
  coverImage: string;
  status: "upcoming" | "ongoing" | "finished" | "closed" | "cancelled";
  timeStatus: "upcoming" | "ongoing" | "finished";
  isClosed: boolean;
  isCancelled: boolean;
}

type EventForm = Event & {
  eventType?: string;
};

interface EditEventModalProps {
  event: Event;
  onClose: () => void;
  onSave: (event: Event) => void;
  onCancel: () => void;
  onCloseRegistration: () => void;
}

const categories = [
  "Giao lưu Ngôn ngữ & Văn hóa",
  "Ẩm thực & Đời sống",
  "Thể thao & Giải trí",
  "Nghệ thuật & Sáng tạo",
  "Công nghệ & Thiết kế",
  "Sự nghiệp & Networking",
  "Khác",
];

const defaultCreateCover =
  "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&h=200&fit=crop";

export default function EditEventModal({
  event,
  onClose,
  onSave,
  onCancel,
  onCloseRegistration,
}: EditEventModalProps) {
  const [isCreateMode] = useState(event.id === 0);
  const [form, setForm] = useState<EventForm>({
    ...event,
    eventType: "",
    coverImage: event.coverImage || defaultCreateCover,
  });
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateForm = () => {
    if (!form.name.trim()) {
      setValidationError("Tên sự kiện không được để trống");
      return false;
    }
    if (!form.category) {
      setValidationError("Danh mục không được để trống");
      return false;
    }
    if (!form.date) {
      setValidationError("Ngày tổ chức không được để trống");
      return false;
    }
    if (!form.location.trim()) {
      setValidationError("Địa điểm không được để trống");
      return false;
    }
    if (!form.maxAttendees || form.maxAttendees <= 0) {
      setValidationError("Số lượng tối đa phải lớn hơn 0");
      return false;
    }
    if (!form.description.trim()) {
      setValidationError("Mô tả không được để trống");
      return false;
    }
    setValidationError(null);
    return true;
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setUploadError("Ảnh không được vượt quá 10MB");
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await apiFetch<{ url: string }>("/api/v1/events/upload-image", {
        method: "POST",
        body: formData,
      });
      setForm((prev) => ({ ...prev, coverImage: res.url }));
    } catch (err: any) {
      setUploadError(err.message || "Upload ảnh thất bại");
    } finally {
      setIsUploading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    if (!validateForm()) {
      return;
    }
    onSave(form as Event);
  };

  if (isCreateMode) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-sm p-3 sm:p-4">
        <div className="w-full max-w-[620px] overflow-hidden rounded-[16px] bg-white shadow-[0_20px_60px_rgba(15,23,42,0.18)]">
          <div className="border-b border-slate-100 px-5 pb-3 pt-2.5 sm:px-6">
            <div className="mb-2 flex justify-center">
              <div className="flex items-center gap-1">
                {[...Array(6)].map((_, index) => (
                  <span key={index} className="h-1 w-1 rounded-full bg-slate-300" />
                ))}
              </div>
            </div>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-[20px] font-bold leading-tight text-slate-900">
                  Tạo sự kiện mới
                </h2>
                <p className="mt-0.5 text-xs text-slate-500">
                  Điền thông tin để tạo sự kiện mới
                </p>
              </div>
              <button
                onClick={onClose}
                className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                aria-label="Đóng"
              >
                <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                  <path d="M15 5L5 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  <path d="M5 5L15 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            </div>
          </div>

          <div className="max-h-[calc(100vh-130px)] overflow-y-auto px-5 py-4 sm:px-6">
            {validationError && (
              <div className="mb-4 flex items-center gap-2 rounded-[8px] border border-rose-200 bg-rose-50 p-3">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-rose-600 flex-shrink-0">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span className="text-xs font-medium text-rose-600">{validationError}</span>
              </div>
            )}
            <div className="grid grid-cols-1 gap-3">
              <div>
                <label className="mb-1.5 block text-[13px] font-semibold text-slate-900">
                  Tên sự kiện <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Vd: Hội thảo Digital Marketing 2024"
                  className="h-10 w-full rounded-[8px] border border-slate-200 px-3 text-[13px] outline-none transition-colors placeholder:text-slate-350 focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-[13px] font-semibold text-slate-900">
                    Danh mục <span className="text-rose-500">*</span>
                  </label>
                  <select
                    name="category"
                    value={form.category}
                    onChange={handleChange}
                    className="h-10 w-full rounded-[8px] border border-slate-200 bg-white px-3 text-[13px] outline-none transition-colors focus:border-emerald-500"
                  >
                    <option value="">Chọn danh mục</option>
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-[13px] font-semibold text-slate-900">
                    Loại sự kiện
                  </label>
                  <input
                    type="text"
                    name="eventType"
                    value={form.eventType || ""}
                    onChange={handleChange}
                    placeholder="Nhập loại sự kiện"
                    className="h-10 w-full rounded-[8px] border border-slate-200 px-3 text-[13px] outline-none transition-colors placeholder:text-slate-350 focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-[13px] font-semibold text-slate-900">
                    Ngày tổ chức <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="4" width="18" height="17" rx="2" />
                        <path d="M8 2v4M16 2v4M3 10h18" />
                      </svg>
                    </div>
                    <input
                      type="date"
                      name="date"
                      value={form.date ? form.date.slice(0, 10) : ""}
                      onChange={handleChange}
                      className="h-10 w-full rounded-[8px] border border-slate-200 bg-white pl-9 pr-3 text-[13px] outline-none transition-colors focus:border-emerald-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-[13px] font-semibold text-slate-900">
                    Địa điểm <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 21s6-5.1 6-11a6 6 0 1 0-12 0c0 5.9 6 11 6 11z" />
                        <circle cx="12" cy="10" r="2.5" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      name="location"
                      value={form.location}
                      onChange={handleChange}
                      placeholder="Nhập địa điểm..."
                      className="h-10 w-full rounded-[8px] border border-slate-200 px-9 pr-3 text-[13px] outline-none transition-colors placeholder:text-slate-350 focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-[160px_minmax(0,1fr)]">
                <div>
                  <label className="mb-1.5 block text-[13px] font-semibold text-slate-900">
                    Số lượng tối đa <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="maxAttendees"
                    value={form.maxAttendees}
                    onChange={handleChange}
                    placeholder="Vd: 100"
                    className="h-10 w-full rounded-[8px] border border-slate-200 px-3 text-[13px] outline-none transition-colors placeholder:text-slate-350 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-[13px] font-semibold text-slate-900">
                    Mô tả <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    rows={2}
                    placeholder="Mô tả nội dung, mục đích sự kiện..."
                    className="min-h-[64px] w-full resize-none rounded-[8px] border border-slate-200 px-3 py-2 text-[13px] outline-none transition-colors placeholder:text-slate-350 focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-[13px] font-semibold text-slate-900">
                  Ảnh bìa sự kiện
                </label>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-[10px] border border-dashed border-slate-200 bg-slate-50 text-[12px] font-medium text-slate-400 transition-colors hover:border-slate-300 hover:bg-slate-100 hover:text-slate-500 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="3" />
                    <path d="M3 16l5-5 4 4 4-4 5 5" />
                    <path d="M10 8h.01" />
                  </svg>
                  <span>{isUploading ? "Đang tải..." : "Tải lên ảnh bìa sự kiện"}</span>
                </button>
                {uploadError && (
                  <p className="mt-1.5 text-xs text-rose-500">{uploadError}</p>
                )}
                <div className="mt-2.5 flex items-center gap-2 rounded-[10px] border border-slate-100 p-2">
                  <div className="h-12 w-16 flex-shrink-0 overflow-hidden rounded-[8px] bg-slate-100">
                    <img src={form.coverImage} alt="Ảnh bìa" className="h-full w-full object-cover" />
                  </div>
                  <div className="text-xs text-slate-500">
                    Ảnh bìa hiện tại sẽ được dùng khi tạo sự kiện.
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-slate-100 px-5 py-3 sm:px-6">
            <button
              onClick={onClose}
              className="h-10 rounded-[8px] px-5 text-[13px] font-semibold text-slate-900 transition-colors hover:bg-slate-100"
            >
              Hủy
            </button>
            <button
              onClick={handleSave}
              className="h-10 rounded-[8px] bg-emerald-600 px-5 text-[13px] font-semibold text-white shadow-md shadow-emerald-600/20 transition-colors hover:bg-emerald-700"
            >
              Tạo sự kiện
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-[620px] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 pt-3 pb-[10px] border-b border-slate-100">
          {/* Drag dots */}
          <div className="flex justify-center mb-2">
            <div className="flex items-center gap-1">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="w-1 h-1 rounded-full bg-gray-300"
                />
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-black leading-snug">
              Chỉnh sửa sự kiện
            </h2>
            <button
              onClick={onClose}
              className="w-4 h-4 flex items-center justify-center text-gray-500 hover:text-gray-700 transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                  d="M12 4L4 12"
                  stroke="#6B7280"
                  strokeWidth="1.33333"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M4 4L12 12"
                  stroke="#6B7280"
                  strokeWidth="1.33333"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="px-5 py-3 flex flex-col gap-[10px] overflow-y-auto flex-1">
          {/* Row 1: Event name + Category */}
          <div className="flex gap-2">
            <div className="flex flex-col gap-0.5 flex-1">
              <label className="text-xs font-medium text-black leading-[18px]">
                Tên sự kiện
              </label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                className="h-[33px] px-[10px] text-[13px] text-black border border-slate-200 rounded-[6px] outline-none focus:border-slate-400 transition-colors"
              />
            </div>
            <div className="flex flex-col gap-0.5 w-[140px]">
              <label className="text-xs font-medium text-black leading-[18px]">
                Danh mục
              </label>
              <select
                name="category"
                value={form.category}
                onChange={handleChange}
                className="h-[33px] px-[10px] text-[13px] text-black border border-slate-200 rounded-[6px] bg-white outline-none focus:border-slate-400 transition-colors appearance-none cursor-pointer"
              >
                <option value="">Chọn danh mục</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 2: Max attendees + Date & Time */}
          <div className="flex gap-2">
            <div className="flex flex-col gap-0.5 w-[140px]">
              <label className="text-xs font-medium text-black leading-[18px]">
                Số lượng tối đa
              </label>
              <input
                type="number"
                name="maxAttendees"
                value={form.maxAttendees}
                onChange={handleChange}
                placeholder="200"
                className="h-[33px] px-[10px] text-[13px] text-black/50 border border-slate-200 rounded-[6px] outline-none focus:border-slate-400 transition-colors"
              />
            </div>
            <div className="flex flex-col gap-0.5 flex-1">
              <label className="text-xs font-medium text-black leading-[18px]">
                Ngày & Giờ bắt đầu
              </label>
              <DateTimePickerInput name="date" value={form.date} onChange={handleChange} />
            </div>
            <div className="flex flex-col gap-0.5 flex-1">
              <label className="text-xs font-medium text-black leading-[18px]">
                Thời gian kết thúc
              </label>
              <DateTimePickerInput name="endDate" value={form.endDate} onChange={handleChange} />
            </div>
          </div>

          {/* Row 3: Location + Status */}
          <div className="flex gap-2">
            <div className="flex flex-col gap-0.5 flex-1">
              <label className="text-xs font-medium text-black leading-[18px]">
                Địa điểm
              </label>
              <div className="relative">
                <div className="absolute left-[10px] top-1/2 -translate-y-1/2 pointer-events-none">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <g clipPath="url(#loc-clip)">
                      <path d="M10 5C10 7.4965 7.2305 10.0965 6.3005 10.8995C6.21386 10.9646 6.1084 10.9999 6 10.9999C5.8916 10.9999 5.78614 10.9646 5.6995 10.8995C4.7695 10.0965 2 7.4965 2 5C2 3.93913 2.42143 2.92172 3.17157 2.17157C3.92172 1.42143 4.93913 1 6 1C7.06087 1 8.07828 1.42143 8.82843 2.17157C9.57857 2.92172 10 3.93913 10 5Z" stroke="#94A3B8" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M6 6.5C6.82843 6.5 7.5 5.82843 7.5 5C7.5 4.17157 6.82843 3.5 6 3.5C5.17157 3.5 4.5 4.17157 4.5 5C4.5 5.82843 5.17157 6.5 6 6.5Z" stroke="#94A3B8" strokeLinecap="round" strokeLinejoin="round" />
                    </g>
                    <defs><clipPath id="loc-clip"><rect width="12" height="12" fill="white" /></clipPath></defs>
                  </svg>
                </div>
                <input
                  type="text"
                  name="location"
                  value={form.location}
                  onChange={handleChange}
                  className="h-[33px] w-full pl-7 pr-[10px] text-[13px] text-black border border-slate-200 rounded-[6px] outline-none focus:border-slate-400 transition-colors"
                />
              </div>
            </div>
            <div className="flex flex-col gap-0.5 w-[140px]">
              <label className="text-xs font-medium text-black leading-[18px]">
                Trạng thái
              </label>
              <select
                name="status"
                value={form.status === 'closed' ? 'closed' : 'active'}
                onChange={(e) => {
                  const val = e.target.value;
                  setForm(prev => ({ ...prev, status: val === 'closed' ? 'closed' : 'upcoming' }));
                }}
                className="h-[33px] px-[10px] text-[13px] text-black border border-slate-200 rounded-[6px] bg-white outline-none focus:border-slate-400 transition-colors appearance-none cursor-pointer"
              >
                <option value="active">Hoạt động</option>
                <option value="closed">Đã đóng đăng ký</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div className="flex flex-col gap-0.5 flex-1">
            <label className="text-xs font-medium text-black leading-[18px]">
              Mô tả
            </label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={3}
              className="w-full px-[10px] py-[6px] text-[13px] text-black border border-slate-200 rounded-[6px] outline-none focus:border-slate-400 transition-colors resize-none"
            />
          </div>

          {/* Cover image */}
          <div className="flex flex-col gap-0.5">
            <label className="text-xs font-medium text-black leading-[18px]">
              Ảnh bìa
            </label>
            <div className="flex items-center gap-3">
              <div className="w-16 h-[42px] border border-slate-200 rounded-[6px] overflow-hidden flex-shrink-0 p-[0.5px] bg-slate-50">
                <img
                  src={form.coverImage}
                  alt="Cover"
                  className="w-full h-full object-cover rounded-[4px]"
                />
              </div>
              
              <div className="flex-1 flex flex-col gap-1">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                />
                <button 
                  type="button"
                  disabled={isUploading}
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-[34px] border border-dashed border-slate-300 rounded-[8px] flex items-center justify-center gap-2 text-[11px] font-medium text-slate-500 hover:border-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUploading ? (
                    <>
                      <svg className="animate-spin h-3 w-3 text-slate-500" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Đang tải lên...
                    </>
                  ) : (
                    <>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="17 8 12 3 7 8" />
                        <line x1="12" y1="3" x2="12" y2="15" />
                      </svg>
                      Chọn ảnh sự kiện (JPG, PNG, WebP)
                    </>
                  )}
                </button>
                {uploadError && (
                  <span className="text-[10px] text-red-500 font-medium">{uploadError}</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 pt-1 pb-3 border-t border-slate-100 flex flex-col gap-2">
          {/* Action buttons row */}
          <div className="flex gap-2">
            <button
              onClick={onCancel}
              className="flex-1 h-[30px] flex items-center justify-center gap-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-medium rounded-[6px] transition-colors"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <g clipPath="url(#cancel-clip)">
                  <path d="M6 11C8.76142 11 11 8.76142 11 6C11 3.23858 8.76142 1 6 1C3.23858 1 1 3.23858 1 6C1 8.76142 3.23858 11 6 11Z" stroke="white" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M2.4502 2.45001L9.5502 9.55001" stroke="white" strokeLinecap="round" strokeLinejoin="round" />
                </g>
                <defs><clipPath id="cancel-clip"><rect width="12" height="12" fill="white" /></clipPath></defs>
              </svg>
              Hủy sự kiện
            </button>
            <button
              onClick={onCloseRegistration}
              className="flex-1 h-[30px] flex items-center justify-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-medium rounded-[6px] transition-colors"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <g clipPath="url(#lock-clip)">
                  <path d="M9.5 5.5H2.5C1.94772 5.5 1.5 5.94772 1.5 6.5V10C1.5 10.5523 1.94772 11 2.5 11H9.5C10.0523 11 10.5 10.5523 10.5 10V6.5C10.5 5.94772 10.0523 5.5 9.5 5.5Z" stroke="white" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M3.5 5.5V3.5C3.5 2.83696 3.76339 2.20107 4.23223 1.73223C4.70107 1.26339 5.33696 1 6 1C6.66304 1 7.29893 1.26339 7.76777 1.73223C8.23661 2.20107 8.5 2.83696 8.5 3.5V5.5" stroke="white" strokeLinecap="round" strokeLinejoin="round" />
                </g>
                <defs><clipPath id="lock-clip"><rect width="12" height="12" fill="white" /></clipPath></defs>
              </svg>
              Đóng đăng ký
            </button>
          </div>

          {/* Save button */}
          <div className="flex justify-end">
            <button
              onClick={() => onSave(form as Event)}
              className="h-[32px] px-4 flex items-center gap-1.5 bg-[#131B2E] hover:bg-[#1e2d4a] text-white text-[13px] font-medium rounded-[6px] transition-colors"
            >
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                <path d="M8.23333 1.625C8.51908 1.62907 8.79165 1.74588 8.99167 1.95L11.05 4.00833C11.2541 4.20835 11.3709 4.48092 11.375 4.76667V10.2917C11.375 10.579 11.2609 10.8545 11.0577 11.0577C10.8545 11.2609 10.579 11.375 10.2917 11.375H2.70833C2.42102 11.375 2.14547 11.2609 1.9423 11.0577C1.73914 10.8545 1.625 10.579 1.625 10.2917V2.70833C1.625 2.42102 1.73914 2.14547 1.9423 1.9423C2.14547 1.73914 2.42102 1.625 2.70833 1.625H8.23333Z" stroke="white" strokeWidth="1.08333" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M9.20866 11.375V7.58332C9.20866 7.43966 9.15159 7.30189 9.05001 7.20031C8.94843 7.09872 8.81065 7.04166 8.66699 7.04166H4.33366C4.19 7.04166 4.05222 7.09872 3.95064 7.20031C3.84906 7.30189 3.79199 7.43966 3.79199 7.58332V11.375" stroke="white" strokeWidth="1.08333" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M3.79199 1.625V3.79167C3.79199 3.93533 3.84906 4.0731 3.95064 4.17468C4.05222 4.27627 4.19 4.33333 4.33366 4.33333H8.12533" stroke="white" strokeWidth="1.08333" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Lưu thay đổi
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export type { Event };
