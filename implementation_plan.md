# Kế hoạch Triển khai WebSockets (Node.js Microservice)

Mục tiêu của kế hoạch này là giúp bạn **hiểu bản chất** của WebSockets trước, sau đó mới tiến hành **xây dựng một Node.js Microservice** để thay thế Pusher trong dự án WeConnect.

> [!NOTE]
> Kế hoạch được chia làm 2 giai đoạn rõ rệt: Giai đoạn 1 là một "sandbox" độc lập hoàn toàn để bạn vọc vạch lý thuyết. Giai đoạn 2 mới thực sự đụng vào source code của WeConnect.

## User Review Required

> [!IMPORTANT]
> Đây là một sự thay đổi về mặt kiến trúc hệ thống (từ Monolith lai sang Microservices). Bạn vui lòng đọc kỹ lộ trình bên dưới. Nếu đồng ý với cách tiếp cận "Học trước - Làm sau" này, hãy nhấn **Proceed**.

---

## Giai đoạn 1: "Lớp học vỡ lòng" về WebSockets (Sandbox)

Trong giai đoạn này, chúng ta sẽ không đụng gì tới source code của WeConnect. Tôi sẽ tạo một thư mục nháp (sandbox) để bạn trải nghiệm.

### 1. Lý thuyết cơ bản (Tôi sẽ giảng giải chi tiết khi thực hành)
- **HTTP vs WebSockets**: Tại sao HTTP không phù hợp cho chat? (Cơ chế Request-Response vs Full-Duplex).
- **Handshake (Bắt tay)**: Cách trình duyệt "nâng cấp" từ HTTP lên WebSocket.
- **WebSocket thuần (ws) vs Socket.IO**: Phân biệt bản chất và thư viện tiện ích.

### 2. Thực hành Sandbox
Tôi sẽ tạo ra một server siêu nhỏ (khoảng 30 dòng code) và một trang HTML đơn giản:
- **[NEW]** `sandbox/server.js`: Dùng thư viện `ws` của Node.js để tạo server.
- **[NEW]** `sandbox/index.html`: Dùng API WebSocket của trình duyệt để kết nối.
- Bạn có thể mở 2 tab trình duyệt và chat qua lại để thấy dữ liệu đi realtime như thế nào.

---

## Giai đoạn 2: Áp dụng vào WeConnect (Microservice)

Sau khi bạn đã hiểu bản chất, chúng ta sẽ bắt tay vào tích hợp cho dự án chính. Chúng ta sẽ dùng **Socket.IO** (thư viện bọc ngoài WebSocket rất mạnh mẽ của Node.js) để dễ quản lý phòng chat (rooms).

### 1. Khởi tạo Node.js WebSocket Server
Tạo một service hoàn toàn mới chạy song song với backend Python.
- **[NEW]** Thư mục `ws-server/` chứa dự án Node.js.
- **[NEW]** `ws-server/server.js`: Khởi tạo Socket.IO.
- **Logic xác thực**: Server này sẽ đọc cùng một JWT `SECRET_KEY` với Python để xác thực user khi họ kết nối vào Socket.
- **Logic phát sóng (Broadcast)**: Tạo một internal API `POST /internal/broadcast`. Chỉ có backend Python mới được phép gọi API này. Khi Python gọi, Node.js sẽ phát sự kiện tới các phòng chat (rooms) tương ứng.

### 2. Cập nhật hạ tầng (Docker)
- **[MODIFY]** `docker-compose.yml`: Thêm container `ws_server` chạy ở cổng 3000, chung mạng (network) với backend Python để chúng có thể gọi API nội bộ cho nhau.

### 3. Sửa đổi Backend Python
- **[NEW]** `backend/app/utils/internal_webhook.py`: Viết hàm để Python bắn HTTP POST sang Node.js (ví dụ `http://ws_server:3000/internal/broadcast`).
- **[MODIFY]** `backend/app/routers/messages.py`: Ở các API tạo tin nhắn, gỡ lệnh gọi `Pusher` và thay bằng hàm webhook nội bộ vừa tạo.

### 4. Sửa đổi Frontend React
- Cài đặt thư viện `socket.io-client`.
- **[NEW]** `frontend/client/hooks/useChatSocket.ts`: Tạo custom hook quản lý kết nối Socket.IO tới cổng `3000`.
- **[MODIFY]** `frontend/client/pages/chat/index.tsx`: Gỡ bỏ `pusher-js` và thay bằng hook vừa tạo. Khi bấm vào 1 đoạn hội thoại, báo cho Node.js biết để `join` vào phòng tương ứng.

## Verification Plan
1. **Hoàn thành Giai đoạn 1**: Chạy thành công ứng dụng nháp trong thư mục sandbox. Trình duyệt gửi và nhận được tin nhắn console.
2. **Hoàn thành Giai đoạn 2**: Đăng nhập WeConnect trên 2 tab bằng 2 tài khoản khác nhau. Nhắn tin và thấy tin nhắn hiện ngay lập tức mà không có lỗi CORS, đồng thời log của Node.js ghi nhận được kết nối và log của Python ghi nhận được việc đẩy dữ liệu nội bộ thành công.
