# Class Diagram - WeConnect (Tách theo Domain)

Bản tách các sơ đồ lớp theo từng domain nghiệp vụ, phục vụ thiết kế module hóa và đọc hiểu chi tiết.

> **Xem bản tổng quan:** [CLASS_DIAGRAM.md](CLASS_DIAGRAM.md)

---

## Domain 1 — Tài khoản & Xác thực
> SRS ID: 3, 4, 5, 14

**Phạm vi:** Đăng ký, đăng nhập, quên mật khẩu, xác thực OTP, đổi ngôn ngữ.

```mermaid
classDiagram
    direction TB

    class User {
        +Long userId
        +String email
        +String phoneNumber
        +String passwordHash
        +String fullName
        +Date dateOfBirth
        +Gender gender
        +JapaneseLevel japaneseLevel
        +Language preferredLanguage
        +Role role
        +Boolean isVerified
        +Date createdAt
        +register() void
        +login() Token
        +forgotPassword() void
        +switchLanguage(lang) void
    }

    class OTP {
        +Long otpId
        +String identifier
        +String code
        +OTPPurpose purpose
        +Date expireAt
        +Boolean used
        +verify(input) Boolean
    }

    class Role {
        <<enumeration>>
        FRIEND_SEEKER
        EVENT_ORGANIZER
    }

    class OTPPurpose {
        <<enumeration>>
        REGISTER
        FORGOT_PASSWORD
    }

    class JapaneseLevel {
        <<enumeration>>
        N5
        N4
        N3
        N2
        N1
    }

    class Gender {
        <<enumeration>>
        MALE
        FEMALE
        OTHER
    }

    class Language {
        <<enumeration>>
        VI
        JA
    }

    User --> Role
    User --> JapaneseLevel
    User --> Gender
    User --> Language
    User "1" --> "*" OTP
    OTP --> OTPPurpose
```

**Điểm chú ý:**
- `OTP` là entity độc lập với vòng đời riêng (tạo → xác minh → hết hạn/đã dùng).
- `User.preferredLanguage` được lưu để giữ ngôn ngữ qua các phiên (ID 14).
- `Role` phân loại người dùng: tìm bạn hoặc tổ chức sự kiện.

---

## Domain 2 — Hồ sơ cá nhân & Tìm kiếm
> SRS ID: 6, 15, 16

**Phạm vi:** Cập nhật hồ sơ, quản lý sở thích, tìm kiếm & lọc người dùng, gợi ý kết bạn.

```mermaid
classDiagram
    direction TB

    class User {
        +Long userId
        +String fullName
        +String avatarUrl
        +String coverUrl
        +String bio
        +String location
        +updateProfile() void
        +search(keyword) List~User~
        +applyFilter(criteria) List~User~
        +getSuggestions() List~User~
    }

    class Hobby {
        +Integer hobbyId
        +String name
        +String category
    }

    User "*" -- "*" Hobby : interested in
```

**Điểm chú ý:**
- Quan hệ `User ↔ Hobby` là Many-to-Many, dùng làm tiêu chí lọc và gợi ý bạn (ID 15, 16).
- `getSuggestions()` tổng hợp từ sở thích, trình độ tiếng Nhật, và vị trí địa lý.

---

## Domain 3 — Mạng xã hội (Kết bạn)
> SRS ID: 9, 10, 11, 12

**Phạm vi:** Gửi/nhận/chấp nhận/từ chối lời mời kết bạn, hủy kết bạn, xem danh sách bạn bè.

```mermaid
classDiagram
    direction LR

    class User {
        +Long userId
        +String fullName
        +String avatarUrl
    }

    class FriendRequest {
        +Long requestId
        +RequestStatus status
        +Date createdAt
        +accept() Friendship
        +reject() void
        +cancel() void
    }

    class Friendship {
        +Long friendshipId
        +Date createdAt
        +unfriend() void
    }

    class RequestStatus {
        <<enumeration>>
        PENDING
        ACCEPTED
        REJECTED
        CANCELLED
    }

    User "1" --> "*" FriendRequest : sender / receiver
    FriendRequest --> RequestStatus
    FriendRequest ..> Friendship : accept()
    User "1" --> "*" Friendship
```

**Điểm chú ý:**
- `FriendRequest` lưu cả sender và receiver (phân biệt qua FK trong DB).
- `Friendship` là điều kiện tiên quyết để bắt đầu chat (Domain 4).
- Trạng thái `CANCELLED` cho phép người gửi hủy lời mời trước khi được chấp nhận.

---

## Domain 4 — Giao tiếp (Chat & Gọi điện)
> SRS ID: 13

**Phạm vi:** Nhắn tin văn bản/hình ảnh, dịch tin nhắn, gọi audio/video.

```mermaid
classDiagram
    direction LR

    class User {
        +Long userId
        +String fullName
    }

    class Conversation {
        +Long conversationId
        +Date lastMessageAt
        +sendMessage(content) Message
        +loadHistory() List~Message~
    }

    class Message {
        +Long messageId
        +String content
        +MessageType type
        +String translatedContent
        +Date createdAt
        +translate() String
    }

    class Call {
        +Long callId
        +CallType type
        +CallStatus status
        +Date startTime
        +Date endTime
        +start() void
        +end() void
    }

    class MessageType {
        <<enumeration>>
        TEXT
        IMAGE
    }

    class CallType {
        <<enumeration>>
        AUDIO
        VIDEO
    }

    class CallStatus {
        <<enumeration>>
        RINGING
        ONGOING
        ENDED
        MISSED
    }

    User "1" --> "*" Conversation
    Conversation "1" *-- "*" Message : composition
    User "1" --> "*" Message : sends
    Message --> MessageType
    User "1" --> "*" Call : caller / receiver
    Call --> CallType
    Call --> CallStatus
```

**Điểm chú ý:**
- `Conversation` hiện là 1-1 (SRS ID 13), có thể mở rộng sang nhóm bằng cách tách `ConversationParticipant`.
- `Message.translatedContent` cache kết quả dịch, tránh gọi lại translation API (ID 8, 13).
- `Call` độc lập với `Conversation`: gọi không cần qua cửa sổ chat.

---

## Domain 5 — Sự kiện
> SRS ID: 7, 17

**Phạm vi:** Tạo/sửa/xóa sự kiện, đăng ký tham dự, phản hồi & thống kê sự kiện.

```mermaid
classDiagram
    direction LR

    class User {
        +Long userId
        +String fullName
    }

    class Event {
        +Long eventId
        +String title
        +String category
        +String description
        +Date startTime
        +Date endTime
        +String location
        +Integer capacity
        +String imageUrl
        +EventStatus status
        +Date createdAt
        +create() void
        +update() void
        +delete() void
        +isFull() Boolean
        +getStatistics() EventStatistics
    }

    class EventRegistration {
        +Long registrationId
        +Date registeredAt
        +cancel() void
    }

    class EventFeedback {
        +Long feedbackId
        +Integer rating
        +String comment
        +Date createdAt
    }

    class EventStatistics {
        <<value object>>
        +Integer totalRegistrations
        +Float registrationRate
        +Float averageRating
        +Integer feedbackCount
    }

    class EventStatus {
        <<enumeration>>
        UPCOMING
        ONGOING
        FINISHED
        CANCELLED
    }

    User "1" --> "*" Event : organizes
    Event --> EventStatus
    Event "1" *-- "*" EventRegistration : composition
    User "1" --> "*" EventRegistration
    Event "1" *-- "*" EventFeedback : composition
    User "1" --> "*" EventFeedback
    Event ..> EventStatistics : computes
```

**Điểm chú ý:**
- `EventStatistics` là value object / DTO, không lưu DB, tính toán theo yêu cầu (ID 7).
- `isFull()` kiểm tra `capacity` trước khi cho đăng ký (ID 17).
- Chỉ `EVENT_ORGANIZER` mới có thể tạo/sửa/xóa sự kiện.

---

## Domain 6 — Trò chơi
> SRS ID: 17

**Phạm vi:** Tạo phòng, tham gia ngẫu nhiên, nhập mã phòng, chat trong phòng.

```mermaid
classDiagram
    direction LR

    class User {
        +Long userId
        +String fullName
    }

    class GameRoom {
        +Long roomId
        +String code
        +RoomType type
        +Integer maxPlayers
        +RoomStatus status
        +Date createdAt
        +join(user) void
        +leave(user) void
        +isFull() Boolean
    }

    class GameParticipant {
        +Long participantId
        +Date joinedAt
    }

    class GameMessage {
        +Long messageId
        +String content
        +Date createdAt
    }

    class RoomType {
        <<enumeration>>
        PUBLIC
        PRIVATE
        RANDOM
    }

    class RoomStatus {
        <<enumeration>>
        WAITING
        PLAYING
        CLOSED
    }

    User "1" --> "*" GameRoom : hosts
    GameRoom --> RoomType
    GameRoom --> RoomStatus
    GameRoom "1" *-- "*" GameParticipant : composition
    User "1" --> "*" GameParticipant
    GameRoom "1" *-- "*" GameMessage : composition
    User "1" --> "*" GameMessage
```

**Điểm chú ý:**
- `GameRoom.code` là unique, hỗ trợ chức năng "Nhập mã phòng" (ID 17).
- `RoomType.RANDOM`: hệ thống tự ghép người chơi ngẫu nhiên.
- `RoomType.PRIVATE`: chỉ người có mã mới tham gia được.

---

## Tóm tắt phụ thuộc giữa các domain

```mermaid
graph TD
    A["Domain 1\nTài khoản & Xác thực"] --> B["Domain 2\nHồ sơ cá nhân"]
    A --> C["Domain 3\nMạng xã hội"]
    C --> D["Domain 4\nGiao tiếp"]
    B --> C
    A --> E["Domain 5\nSự kiện"]
    A --> F["Domain 6\nTrò chơi"]
```

| Domain | Phụ thuộc vào |
|--------|---------------|
| Hồ sơ cá nhân | Tài khoản & Xác thực |
| Mạng xã hội | Tài khoản + Hồ sơ |
| Giao tiếp | Mạng xã hội (yêu cầu Friendship) |
| Sự kiện | Tài khoản (yêu cầu Role = EVENT_ORGANIZER) |
| Trò chơi | Tài khoản |
