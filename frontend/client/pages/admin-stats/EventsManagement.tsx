import Navbar from "@/components/Navbar";

export default function EventsManagement() {
  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <Navbar />
      <div className="pt-[52px] max-w-[1180px] mx-auto px-4 sm:px-6 py-8 flex flex-col items-center justify-center min-h-[calc(100vh-52px)]">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-[#ECFDF5] rounded-full flex items-center justify-center mx-auto mb-4">
            <svg width="32" height="32" viewBox="0 0 45 50" fill="none">
              <path d="M5 50C3.625 50 2.44792 49.5104 1.46875 48.5312C0.489583 47.5521 0 46.375 0 45V10C0 8.625 0.489583 7.44792 1.46875 6.46875C2.44792 5.48958 3.625 5 5 5H7.5V0H12.5V5H32.5V0H37.5V5H40C41.375 5 42.5521 5.48958 43.5312 6.46875C44.5104 7.44792 45 8.625 45 10V45C45 46.375 44.5104 47.5521 43.5312 48.5312C42.5521 49.5104 41.375 50 40 50H5ZM5 45H40V20H5V45ZM5 15H40V10H5V15Z" fill="#059669"/>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-black mb-2">Quản lý sự kiện</h1>
          <p className="text-[#64748B] text-sm leading-6">
            Trang này đang được xây dựng. Tiếp tục nhắn tin để hoàn thiện nội dung trang này.
          </p>
        </div>
      </div>
    </div>
  );
}
