# Kiến trúc realtime hiện tại của WeConnect

## Phạm vi

- Spring Boot sở hữu toàn bộ business API, xác thực, phân quyền và dữ liệu nghiệp vụ.
- Node.js `ws-server` là realtime gateway dùng Socket.IO cho chat, cuộc gọi và game.
- Frontend chỉ dùng `socket.io-client`; hệ thống không sử dụng Pusher.
- Nginx là public gateway chung cho HTTP API, static/upload resource và Socket.IO.

## Luồng realtime

1. Spring hoàn tất và commit thay đổi nghiệp vụ.
2. `RealtimeEventListener` chuyển sự kiện sang `WsBroadcastClient`.
3. Spring gọi `POST /internal/broadcast` của `ws-server` bằng shared internal secret.
4. `ws-server` phát sự kiện tới private user room đã được xác thực bằng JWT.
5. Frontend nhận sự kiện qua cùng public origin của Nginx.

Node.js hiện được chủ động giữ lại. Việc chuyển sang Spring WebSocket/STOMP sẽ được
đánh giá riêng khi đội ngũ sẵn sàng thay đổi giao thức và frontend client.

## Kiểm tra thủ công

1. Khởi động stack qua Docker Compose.
2. Đăng nhập hai tài khoản ở hai cửa sổ trình duyệt.
3. Kiểm tra tin nhắn, typing/read receipt và bản dịch xuất hiện realtime.
4. Kiểm tra thông báo cuộc gọi đến, từ chối và kết thúc cuộc gọi.
5. Kiểm tra sự kiện join/leave/ready/score của game chỉ đến đúng người tham gia.
