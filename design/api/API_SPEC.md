# API Specification - WeConnect

Đặc tả API cho hệ thống WeConnect, được thiết kế từ tài liệu SRS (yêu cầu chức năng ID 3–7, 9–18) và sơ đồ ERD/Class.

API gồm 2 lớp giao thức:
- **REST API** (HTTPS / JSON): cho các thao tác CRUD, query, command đơn lẻ.
- **WebSocket API** (WSS): cho các luồng realtime — chat, signaling cuộc gọi, game room (SRS ID 13, 17, 18).

---

## 1. Quy ước chung (Conventions)

### 1.1 Base URL

| Môi trường | URL |
|------------|-----|
| Production | `https://api.weconnect.app/api/v1` |
| Staging | `https://staging-api.weconnect.app/api/v1` |
| Local | `http://localhost:3000/api/v1` |

WebSocket: thay `https`/`http` bằng `wss`/`ws`, đường dẫn `/ws`.

### 1.2 Authentication

- **Schema**: `Authorization: Bearer <access_token>` (JWT).
- **Token life-cycle**:
  - `access_token`: 15 phút, dùng cho mọi request đã xác thực.
  - `refresh_token`: 30 ngày, lưu HTTP-only cookie hoặc secure storage; dùng để lấy access_token mới qua `POST /auth/refresh`.
- **WebSocket auth**: gửi `?token=<access_token>` ở query string khi connect, hoặc header `Authorization`.

### 1.3 Định dạng Request / Response

- Content-Type: `application/json; charset=utf-8` (trừ upload là `multipart/form-data`).
- Date: ISO 8601 UTC (`2026-05-09T10:30:00Z`).
- Naming: `snake_case` cho field JSON.

### 1.4 Phân trang (Pagination)

Hai chiến lược:

| Loại | Dùng cho | Query |
|------|----------|-------|
| **Page-based** | Danh sách sự kiện, user, friend list | `?page=1&page_size=20` |
| **Cursor-based** | Lịch sử chat, feed | `?cursor=<id>&limit=30&direction=before` |

Response wrapper:

```json
{
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "page_size": 20,
    "total": 145,
    "total_pages": 8
  }
}
```

### 1.5 Định dạng lỗi (Error format)

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Email khong hop le",
    "details": {
      "field": "email",
      "rule": "format"
    }
  }
}
```

Mã lỗi chuẩn: xem [Phụ lục A](#phụ-lục-a-danh-sách-mã-lỗi).

### 1.6 Mã HTTP

| Mã | Ý nghĩa |
|----|---------|
| 200 | OK |
| 201 | Created |
| 204 | No Content |
| 400 | Bad Request (sai định dạng) |
| 401 | Unauthorized (chưa đăng nhập / token hỏng) |
| 403 | Forbidden (không đủ quyền — sai role) |
| 404 | Not Found |
| 409 | Conflict (đã tồn tại / trùng) |
| 422 | Unprocessable Entity (validation failed) |
| 429 | Too Many Requests (rate limit) |
| 500 | Internal Server Error |

### 1.7 Rate Limiting

- Mặc định 60 req/phút/IP với endpoint public (`/auth/*`).
- 600 req/phút/user với endpoint đã xác thực.
- OTP gửi: tối đa 5 lần/giờ/identifier (chống spam SMS).
- Header trả về: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`.

---

## 2. Authentication APIs (SRS ID 3, 4, 5, 8)

### 2.1 Đăng ký tài khoản — `POST /auth/register`

**SRS**: ID 3. Đăng ký bằng email hoặc số điện thoại; bắt buộc OTP.

**Request**:
```json
{
  "identifier": "user@example.com",
  "identifier_type": "EMAIL",
  "password": "MyP@ssw0rd",
  "full_name": "Nguyen Van A",
  "date_of_birth": "2000-01-15",
  "gender": "MALE"
}
```
- `identifier_type`: `EMAIL` | `PHONE`.

**Response 201**:
```json
{
  "data": {
    "user_id": 1024,
    "identifier": "user@example.com",
    "otp_required": true,
    "otp_session_id": "otp_abc123"
  }
}
```
> Sau khi đăng ký, FE phải gọi `/auth/otp/verify` để hoàn tất.

**Lỗi thường gặp**: `409 USER_ALREADY_EXISTS`, `422 VALIDATION_ERROR`.

---

### 2.2 Gửi OTP — `POST /auth/otp/send`

**SRS**: ID 8. Tích hợp Twilio/SendGrid.

**Request**:
```json
{
  "identifier": "user@example.com",
  "purpose": "REGISTER"
}
```
- `purpose`: `REGISTER` | `FORGOT_PASSWORD`.

**Response 200**:
```json
{
  "data": {
    "otp_session_id": "otp_abc123",
    "expires_in": 300
  }
}
```

---

### 2.3 Xác thực OTP — `POST /auth/otp/verify`

**Request**:
```json
{
  "otp_session_id": "otp_abc123",
  "code": "123456"
}
```

**Response 200** (cho REGISTER): trả về token để auto-login.
```json
{
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIs...",
    "refresh_token": "rfr_xxx...",
    "expires_in": 900,
    "user": { "user_id": 1024, "full_name": "..." }
  }
}
```

**Response 200** (cho FORGOT_PASSWORD): trả về token tạm để đặt lại mật khẩu.
```json
{
  "data": { "reset_token": "rst_xxx...", "expires_in": 600 }
}
```

**Lỗi**: `400 INVALID_OTP`, `400 OTP_EXPIRED`.

---

### 2.4 Đăng nhập — `POST /auth/login`

**SRS**: ID 4.

**Request**:
```json
{
  "identifier": "user@example.com",
  "password": "MyP@ssw0rd"
}
```

**Response 200**:
```json
{
  "data": {
    "access_token": "eyJhbGc...",
    "refresh_token": "rfr_xxx",
    "expires_in": 900,
    "user": {
      "user_id": 1024,
      "email": "user@example.com",
      "full_name": "Nguyen Van A",
      "role": "FRIEND_SEEKER",
      "preferred_language": "VI"
    }
  }
}
```

**Lỗi**: `401 INVALID_CREDENTIALS`.

---

### 2.5 Quên mật khẩu — `POST /auth/forgot-password`

**SRS**: ID 5. Gửi OTP về identifier.

**Request**: `{ "identifier": "user@example.com" }`
**Response 200**: `{ "data": { "otp_session_id": "..." } }` → tiếp tục `/auth/otp/verify` với purpose `FORGOT_PASSWORD`.

---

### 2.6 Đặt lại mật khẩu — `POST /auth/reset-password`

**Request**:
```json
{
  "reset_token": "rst_xxx",
  "new_password": "NewP@ssw0rd"
}
```
**Response 204**.

---

### 2.7 Refresh token — `POST /auth/refresh`

**Request**: `{ "refresh_token": "rfr_xxx" }`
**Response 200**: trả về `access_token` mới.

---

### 2.8 Đăng xuất — `POST /auth/logout`

Auth required. Vô hiệu hoá `refresh_token` hiện tại. **Response 204**.

---

## 3. User & Profile APIs (SRS ID 6, 9, 14, 15, 16)

### 3.1 Lấy hồ sơ của tôi — `GET /users/me`

**Response 200**:
```json
{
  "data": {
    "user_id": 1024,
    "email": "user@example.com",
    "phone_number": "+84901234567",
    "full_name": "Nguyen Van A",
    "date_of_birth": "2000-01-15",
    "gender": "MALE",
    "avatar_url": "https://cdn.../avatar.jpg",
    "cover_url": "https://cdn.../cover.jpg",
    "bio": "Toi la sinh vien...",
    "location": "Ha Noi",
    "japanese_level": "N3",
    "preferred_language": "VI",
    "role": "FRIEND_SEEKER",
    "hobbies": [
      { "hobby_id": 5, "name": "Anime", "category": "ENTERTAINMENT" }
    ]
  }
}
```

---

### 3.2 Cập nhật hồ sơ — `PUT /users/me`

**SRS**: ID 6.

**Request** (partial update — chỉ field nào thay đổi):
```json
{
  "full_name": "Nguyen Van B",
  "bio": "Yeu thich Nhat Ban",
  "location": "Ha Noi",
  "japanese_level": "N2",
  "gender": "MALE",
  "date_of_birth": "2000-01-15"
}
```

**Response 200**: trả về user object đã cập nhật.

**Validation**: `bio` ≤ 500 ký tự, `full_name` 1–50, các field bắt buộc không cho rỗng (theo SRS ID 6).

---

### 3.3 Cập nhật avatar / ảnh bìa

`PUT /users/me/avatar` và `PUT /users/me/cover`.

**Request**: `multipart/form-data` với field `file`.
- Định dạng: `jpg`, `png`, `webp`.
- Kích thước tối đa: avatar 5MB, cover 10MB.

**Response 200**: `{ "data": { "avatar_url": "https://cdn..." } }`.

**Lỗi**: `400 INVALID_FILE_FORMAT`, `413 PAYLOAD_TOO_LARGE`.

---

### 3.4 Quản lý sở thích

| Method | Path | Mô tả |
|--------|------|-------|
| GET | `/hobbies` | Danh sách sở thích có sẵn |
| GET | `/users/me/hobbies` | Sở thích của tôi |
| PUT | `/users/me/hobbies` | Cập nhật danh sách sở thích |

**PUT request**:
```json
{ "hobby_ids": [1, 3, 5, 8] }
```

---

### 3.5 Chuyển đổi ngôn ngữ — `PUT /users/me/language`

**SRS**: ID 14.

**Request**: `{ "language": "JA" }` (`VI` hoặc `JA`).
**Response 204**.

---

### 3.6 Tìm kiếm người dùng — `GET /users/search`

**SRS**: ID 9, 16.

**Query params**:
| Param | Type | Mô tả |
|-------|------|-------|
| `q` | string | Từ khoá tên (real-time search) |
| `gender` | string | `MALE` \| `FEMALE` \| `OTHER` |
| `min_age` / `max_age` | int | Khoảng tuổi |
| `japanese_level` | string | `N5`–`N1` |
| `hobbies` | int[] | Danh sách hobby_id (CSV) |
| `location` | string | Địa điểm |
| `page` / `page_size` | int | Phân trang |

**Response 200**:
```json
{
  "data": [
    {
      "user_id": 2048,
      "full_name": "Yamada Taro",
      "avatar_url": "...",
      "japanese_level": "N1",
      "location": "Ha Noi",
      "hobbies": ["Anime", "Travel"],
      "friendship_status": "NONE"
    }
  ],
  "pagination": { ... }
}
```
> `friendship_status`: `NONE` | `REQUEST_SENT` | `REQUEST_RECEIVED` | `FRIEND`. Để FE biết hiển thị nút "Thêm bạn" / "Huỷ lời mời" / "Bạn bè" (SRS ID 10).

---

### 3.7 Gợi ý kết bạn — `GET /users/suggestions`

**SRS**: ID 15. Lọc dựa trên sở thích, trình độ tiếng Nhật, mục tiêu chung.

**Query**: `?limit=10`

**Response 200**: tương tự `search`. Nếu hồ sơ chưa đủ thông tin, trả về:
```json
{
  "data": [],
  "warning": {
    "code": "PROFILE_INCOMPLETE",
    "missing_fields": ["japanese_level", "hobbies"]
  }
}
```

---

### 3.8 Xem hồ sơ user khác — `GET /users/:user_id`

**Response 200**: thông tin public + `friendship_status`. Không trả về `email`, `phone_number`, `date_of_birth` chính xác (chỉ trả về tuổi).

---

## 4. Friend Management APIs (SRS ID 10, 11, 12)

### 4.1 Gửi lời mời kết bạn — `POST /friend-requests`

**SRS**: ID 10.

**Request**: `{ "receiver_id": 2048 }`

**Response 201**:
```json
{
  "data": {
    "request_id": 555,
    "sender_id": 1024,
    "receiver_id": 2048,
    "status": "PENDING",
    "created_at": "2026-05-09T10:30:00Z"
  }
}
```

**Lỗi**: `409 ALREADY_FRIENDS`, `409 REQUEST_ALREADY_EXISTS`.

---

### 4.2 Huỷ lời mời đã gửi — `DELETE /friend-requests/:request_id`

**SRS**: ID 10. ("Huỷ lời mời" trên UI).

**Response 204**.

---

### 4.3 Danh sách lời mời

| Method | Path | Mô tả |
|--------|------|-------|
| GET | `/friend-requests/received` | Lời mời đến (SRS ID 11) |
| GET | `/friend-requests/sent` | Lời mời đã gửi |

**Query**: `?status=PENDING&page=1`

---

### 4.4 Xác nhận / Từ chối lời mời

| Method | Path | Hành động |
|--------|------|-----------|
| POST | `/friend-requests/:id/accept` | Xác nhận → tạo Friendship |
| POST | `/friend-requests/:id/reject` | Từ chối / Xoá |

**Response 200**:
```json
{ "data": { "status": "ACCEPTED", "friendship_id": 9001 } }
```

---

### 4.5 Danh sách bạn bè — `GET /friends`

**SRS**: ID 12.

**Query**: `?q=ten&page=1`

**Response 200**: danh sách user là bạn bè.

---

### 4.6 Huỷ kết bạn — `DELETE /friends/:user_id`

**Response 204**.

---

## 5. Messaging APIs (SRS ID 13)

> **Lưu ý realtime**: gửi/nhận tin nhắn realtime đi qua WebSocket (xem mục [7](#7-websocket-events)). REST chỉ dùng để load lịch sử và thao tác phụ trợ (dịch, đánh dấu đã đọc, upload ảnh).

### 5.1 Danh sách hội thoại — `GET /conversations`

**Query**: `?page=1`

**Response 200**:
```json
{
  "data": [
    {
      "conversation_id": 7001,
      "participant": { "user_id": 2048, "full_name": "...", "avatar_url": "..." },
      "last_message": {
        "content": "Konnichiwa!",
        "type": "TEXT",
        "created_at": "...",
        "sender_id": 2048
      },
      "unread_count": 3
    }
  ]
}
```

---

### 5.2 Lịch sử tin nhắn — `GET /conversations/:id/messages`

**Query (cursor-based)**:
- `cursor=<message_id>` — tin nhắn cũ hơn cursor.
- `limit=30`.
- `direction=before|after`.

**Response 200**:
```json
{
  "data": [
    {
      "message_id": 88001,
      "sender_id": 2048,
      "content": "Konnichiwa!",
      "type": "TEXT",
      "translated_content": null,
      "is_read": true,
      "created_at": "2026-05-09T10:00:00Z"
    }
  ],
  "next_cursor": "88001"
}
```

---

### 5.3 Gửi tin nhắn (REST fallback) — `POST /conversations/:id/messages`

> Khuyến nghị dùng WebSocket. REST có sẵn để dùng khi mất kết nối WS.

**Request**:
```json
{
  "content": "Konnichiwa",
  "type": "TEXT"
}
```
Hoặc với ảnh:
```json
{
  "content": "https://cdn.../image.jpg",
  "type": "IMAGE"
}
```

**Response 201**: message object.

**Lỗi**: `403 NOT_FRIENDS` (precondition SRS ID 13).

---

### 5.4 Dịch tin nhắn — `POST /messages/:id/translate`

**SRS**: ID 13. Tích hợp Google Translate (ID 8).

**Request**: `{ "target_language": "VI" }` (`VI` | `JA`).

**Response 200**:
```json
{
  "data": {
    "message_id": 88001,
    "original_content": "Konnichiwa",
    "translated_content": "Xin chao",
    "target_language": "VI"
  }
}
```
> Server cache `translated_content` vào DB → lần sau gọi lại không gọi external API.

---

### 5.5 Đánh dấu đã đọc — `POST /conversations/:id/read`

**Request**: `{ "last_read_message_id": 88001 }`
**Response 204**.

---

## 6. Call APIs (SRS ID 13)

> Cuộc gọi audio/video dùng WebRTC. WebSocket làm signaling channel. REST chỉ tạo "call session" và xem lịch sử.

### 6.1 Khởi tạo cuộc gọi — `POST /calls`

**Request**:
```json
{
  "receiver_id": 2048,
  "type": "VIDEO"
}
```

**Response 201**:
```json
{
  "data": {
    "call_id": 4001,
    "status": "RINGING",
    "type": "VIDEO",
    "ice_servers": [
      { "urls": "stun:stun.l.google.com:19302" },
      { "urls": "turn:turn.weconnect.app:3478", "username": "...", "credential": "..." }
    ]
  }
}
```

> Sau đó FE chuyển sang WebSocket signaling: `call:invite`, `call:accept`, `call:signal`...

---

### 6.2 Kết thúc cuộc gọi — `PATCH /calls/:id`

**Request**: `{ "status": "ENDED" }`
**Response 200**: call object.

---

### 6.3 Lịch sử cuộc gọi — `GET /calls`

**Query**: `?page=1&with_user_id=2048`

---

### 6.4 Lấy LiveKit Access Token — `POST /video/token`

**Auth required.** Dùng để frontend kết nối trực tiếp vào LiveKit room sau khi có token.

**Request**:
```json
{
  "room_name": "call-1024-2048"
}
```

| Field | Type | Bắt buộc | Mô tả |
|-------|------|-----------|-------|
| `room_name` | string (1–255) | ✓ | Tên phòng LiveKit cần tham gia |

**Response 200**:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

> Token này được ký bằng `LIVEKIT_API_KEY` / `LIVEKIT_API_SECRET`, mang `identity = user_id` và grant `room_join=true` cho `room_name` đã chỉ định. FE truyền token này vào LiveKit SDK (`Room.connect(url, token)`).

**Lỗi**:
| Mã | Code | Nguyên nhân |
|----|------|-------------|
| 401 | `UNAUTHORIZED` | Không có hoặc token JWT hết hạn |
| 500 | `LIVEKIT_NOT_CONFIGURED` | Thiếu biến môi trường `LIVEKIT_*` |
| 500 | `TOKEN_GENERATION_FAILED` | Lỗi nội bộ khi ký token |

---


## 7. Event APIs (SRS ID 7, 17)

### 7.1 Danh sách sự kiện công khai — `GET /events`

**Cho mọi user (Role 1).** SRS ID 17.

**Query**:
| Param | Mô tả |
|-------|-------|
| `q` | Từ khoá tên |
| `from_date` / `to_date` | Khoảng thời gian |
| `status` | `UPCOMING` \| `ONGOING` \| `FINISHED` |
| `page` / `page_size` | Phân trang |

**Response 200**:
```json
{
  "data": [
    {
      "event_id": 3001,
      "title": "Buoi giao luu Nhat-Viet",
      "category": "Giáo dục",
      "description": "...",
      "start_time": "2026-05-15T18:00:00Z",
      "end_time": "2026-05-15T21:00:00Z",
      "location": "Quan cafe X",
      "capacity": 30,
      "registered_count": 28,
      "is_full": false,
      "image_url": "...",
      "is_registered": false,
      "organizer": { "user_id": 999, "full_name": "..." }
    }
  ]
}
```

---

### 7.2 Chi tiết sự kiện — `GET /events/:id`

**Response 200**: event object đầy đủ + danh sách feedback gần nhất.

---

### 7.3 Đăng ký tham gia — `POST /events/:id/register`

**SRS**: ID 17.

**Response 201**: `{ "data": { "registration_id": 7777, "registered_at": "..." } }`

**Lỗi**: `409 EVENT_FULL` (sự kiện hết chỗ).

---

### 7.4 Huỷ đăng ký — `DELETE /events/:id/register`

**Response 204**.

---

### 7.5 Phản hồi sự kiện

| Method | Path |
|--------|------|
| GET | `/events/:id/feedback` |
| POST | `/events/:id/feedback` |

**POST request**:
```json
{ "rating": 5, "comment": "Su kien rat hay!" }
```

**Validation**: `rating` ∈ [1, 5]. Chỉ user đã `REGISTERED` mới được feedback.

---

### 7.6 Quản lý sự kiện (Organizer only)

> Yêu cầu `role = EVENT_ORGANIZER`. SRS ID 7.

| Method | Path | Mô tả |
|--------|------|-------|
| GET | `/events/managed` | Sự kiện do tôi tổ chức |
| POST | `/events` | Tạo sự kiện mới |
| PUT | `/events/:id` | Cập nhật |
| DELETE | `/events/:id` | Xoá (cần xác nhận trên FE — SRS ID 7) |

**POST request**:
```json
{
  "title": "Buoi hoi thao",
  "category": "Kinh doanh",
  "description": "...",
  "start_time": "2026-06-01T18:00:00Z",
  "end_time": "2026-06-01T21:00:00Z",
  "location": "Cafe ABC",
  "capacity": 50,
  "image_url": "https://cdn..."
}
```

**Validation**: thiếu field bắt buộc → `422 VALIDATION_ERROR`.

---

### 7.7 Thống kê sự kiện (Organizer only)

| Method | Path | Mô tả |
|--------|------|-------|
| GET | `/events/:id/statistics` | Thống kê chi tiết một sự kiện (SRS ID 7, ID.18) |
| GET | `/events/statistics/overview` | Thống kê tổng quan các sự kiện (SRS ID.15) |

**GET `/events/:id/statistics` Response 200**:
```json
{
  "data": {
    "event_id": 3001,
    "total_registrations": 28,
    "capacity": 30,
    "registration_rate": 0.93,
    "average_rating": 4.6,
    "feedback_count": 22,
    "rating_distribution": { "1": 0, "2": 0, "3": 1, "4": 5, "5": 16 },
    "recent_feedback": [ ... ]
  }
}
```

**GET `/events/statistics/overview` Response 200**:
```json
{
  "data": {
    "total_events": 12,
    "upcoming_events": 3,
    "finished_events": 9,
    "total_registrations": 245,
    "average_satisfaction": 4.4
  }
}
```

---

## 8. Game Room APIs (SRS ID 17)

### 8.1 Danh sách phòng — `GET /games/rooms`

**Query**: `?status=WAITING&page=1`

**Response 200**:
```json
{
  "data": [
    {
      "room_id": 9001,
      "code": "ABCD12",
      "host": { "user_id": 1024, "full_name": "..." },
      "type": "PUBLIC",
      "status": "WAITING",
      "current_players": 2,
      "max_players": 6
    }
  ]
}
```

---

### 8.2 Tạo phòng — `POST /games/rooms`

**Request**:
```json
{
  "type": "PUBLIC",
  "max_players": 6
}
```
**Response 201**: room object với `code` được sinh tự động.

---

### 8.3 Tham gia ngẫu nhiên — `POST /games/rooms/random`

**SRS**: ID 17. Tự động tìm phòng `WAITING` còn chỗ.

**Response 200**: room object đã join.

**Lỗi**: `404 NO_ROOM_AVAILABLE`.

---

### 8.4 Tham gia bằng mã — `POST /games/rooms/join`

**Request**: `{ "code": "ABCD12" }`
**Response 200**: room object.

**Lỗi**: `404 INVALID_ROOM_CODE` (SRS ID 17: "Nhập sai mã phòng game phải báo lỗi").

---

### 8.5 Rời phòng — `POST /games/rooms/:id/leave`

**Response 204**.

---

### 8.6 Lịch sử chat phòng game — `GET /games/rooms/:id/messages`

**Query**: cursor-based như mục 5.2.

> Tin nhắn realtime trong phòng đi qua WebSocket (mục 7.4).

---

## 9. Upload APIs

### 9.1 Upload file — `POST /uploads`

Endpoint chung cho avatar, cover, ảnh chat, ảnh sự kiện.

**Request**: `multipart/form-data`
- `file`: binary
- `purpose`: `AVATAR` | `COVER` | `MESSAGE` | `EVENT`

**Response 201**:
```json
{
  "data": {
    "url": "https://cdn.weconnect.app/uploads/abc123.jpg",
    "size": 102400,
    "mime_type": "image/jpeg"
  }
}
```

**Validation**:
| Purpose | Max size | Allowed types |
|---------|----------|---------------|
| AVATAR | 5MB | jpg, png, webp |
| COVER | 10MB | jpg, png, webp |
| MESSAGE | 20MB | jpg, png, webp, gif |
| EVENT | 10MB | jpg, png, webp |

---

## 10. WebSocket Events (SRS ID 13, 17, 18)

### 10.1 Connection

```
wss://api.weconnect.app/ws?token=<access_token>
```

- Auto-reconnect với exponential backoff: 1s → 2s → 4s → 8s → 16s → 30s (SRS ID 18).
- Heartbeat: server gửi `ping` mỗi 30s, client trả `pong`.

### 10.2 Định dạng message

```json
{
  "id": "client_generated_uuid",
  "type": "<event_type>",
  "data": { ... },
  "timestamp": "2026-05-09T10:30:00Z"
}
```

Server `ack`:
```json
{ "id": "client_generated_uuid", "type": "ack", "data": { ... } }
```

### 10.3 Chat events

| Event | Direction | Payload |
|-------|-----------|---------|
| `chat:send` | C → S | `{ conversation_id, content, type, client_msg_id }` |
| `chat:new` | S → C | full message object |
| `chat:typing` | C → S, S → C | `{ conversation_id, is_typing }` |
| `chat:read` | C → S, S → C | `{ conversation_id, last_read_message_id }` |
| `chat:translated` | S → C | `{ message_id, translated_content, target_language }` (sau khi user gọi REST `/messages/:id/translate`) |

**Precondition**: chỉ broadcast `chat:new` khi sender và receiver là bạn bè (SRS ID 13).

---

### 10.4 Game room events

| Event | Direction | Payload |
|-------|-----------|---------|
| `game:join` | S → C | `{ room_id, user }` (broadcast cho mọi người trong phòng) |
| `game:leave` | S → C | `{ room_id, user_id }` |
| `game:state` | S → C | `{ room_id, state }` (cập nhật trạng thái phòng) |
| `game:chat:send` | C → S | `{ room_id, content }` |
| `game:chat:new` | S → C | full game message object |

---

### 10.5 Call signaling events

| Event | Direction | Payload | Mô tả |
|-------|-----------|---------|-------|
| `call:invite` | S → C | `{ call_id, caller, type }` | Server thông báo có cuộc gọi đến |
| `call:accept` | C → S, S → C | `{ call_id }` | Người nhận chấp nhận |
| `call:reject` | C → S, S → C | `{ call_id, reason }` | Từ chối |
| `call:signal` | C ↔ S ↔ C | `{ call_id, signal }` | WebRTC SDP/ICE relay |
| `call:end` | C → S, S → C | `{ call_id }` | Kết thúc |

---

### 10.6 System events

| Event | Direction | Mô tả |
|-------|-----------|-------|
| `connected` | S → C | Xác nhận auth thành công, trả `user_id` |
| `error` | S → C | `{ code, message }` |
| `notification` | S → C | Thông báo (lời mời kết bạn mới, sự kiện, ...) |

---

## 11. Phụ lục A: Danh sách mã lỗi

| Code | HTTP | Mô tả |
|------|------|-------|
| `VALIDATION_ERROR` | 422 | Sai validation |
| `INVALID_CREDENTIALS` | 401 | Sai email/password |
| `TOKEN_EXPIRED` | 401 | Access token hết hạn |
| `TOKEN_INVALID` | 401 | Token không hợp lệ |
| `FORBIDDEN_ROLE` | 403 | Không đủ quyền (sai role) |
| `NOT_FRIENDS` | 403 | Hai user chưa là bạn (chat precondition) |
| `USER_ALREADY_EXISTS` | 409 | Email/phone đã đăng ký |
| `REQUEST_ALREADY_EXISTS` | 409 | Đã gửi lời mời, đang chờ |
| `ALREADY_FRIENDS` | 409 | Đã là bạn |
| `EVENT_FULL` | 409 | Sự kiện hết chỗ |
| `INVALID_OTP` | 400 | OTP sai |
| `OTP_EXPIRED` | 400 | OTP hết hạn |
| `INVALID_ROOM_CODE` | 404 | Mã phòng game không tồn tại |
| `NO_ROOM_AVAILABLE` | 404 | Không có phòng game phù hợp |
| `PROFILE_INCOMPLETE` | 400 | Hồ sơ chưa đủ để dùng tính năng (gợi ý) |
| `INVALID_FILE_FORMAT` | 400 | File upload sai định dạng |
| `PAYLOAD_TOO_LARGE` | 413 | File quá lớn |
| `RATE_LIMIT_EXCEEDED` | 429 | Vượt giới hạn request |
| `INTERNAL_ERROR` | 500 | Lỗi server |

---

## 12. Phụ lục B: Mapping API ↔ SRS

| SRS ID | Tính năng | Endpoints chính |
|--------|-----------|-----------------|
| 3 | Đăng ký tài khoản | `POST /auth/register`, `POST /auth/otp/*` |
| 4 | Đăng nhập | `POST /auth/login`, `POST /auth/refresh` |
| 5 | Quên mật khẩu | `POST /auth/forgot-password`, `POST /auth/reset-password` |
| 6 | Quản lý hồ sơ | `GET/PUT /users/me`, `PUT /users/me/avatar`, `PUT /users/me/hobbies` |
| 7 | Quản lý & thống kê sự kiện | `POST/PUT/DELETE /events`, `GET /events/:id/statistics`, `GET /events/statistics/overview` |
| 8 | Tích hợp OTP & dịch thuật | `POST /auth/otp/*`, `POST /messages/:id/translate` |
| 9 | Tìm kiếm người dùng | `GET /users/search` |
| 10 | Gửi lời mời kết bạn | `POST /friend-requests`, `DELETE /friend-requests/:id` |
| 11 | Quản lý lời mời | `GET /friend-requests/received`, `POST /friend-requests/:id/accept|reject` |
| 12 | Quản lý bạn bè | `GET /friends`, `DELETE /friends/:user_id` |
| 13 | Nhắn tin / Gọi / Dịch | WS `chat:*`, `call:*`, REST `POST /messages/:id/translate`, `POST /calls` |
| 14 | Chuyển đổi ngôn ngữ | `PUT /users/me/language` |
| 15 | Gợi ý kết bạn | `GET /users/suggestions` |
| 16 | Lọc kết quả tìm kiếm | `GET /users/search` (với filter params) |
| 17 | Sự kiện & Game | `GET /events`, `POST /events/:id/register`, `POST /games/rooms`, WS `game:*` |
| 18 | WebSocket | Phần [§10](#10-websocket-events-srs-id-13-17-18) |
