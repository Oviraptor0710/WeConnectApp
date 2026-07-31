# Use Case Diagram - WeConnect

Biểu đồ tổng hợp từ tài liệu SRS WeConnect (các yêu cầu chức năng ID 3–7, 9–17), được tách thành **5 biểu đồ con** theo nhóm chức năng.

---

## 1. Xác thực & Tài khoản (SRS ID: 3, 4, 5, 6, 14)

```mermaid
flowchart LR
  classDef actor fill:#1e40af,stroke:#1e3a8a,color:#fff,font-weight:bold
  classDef ext   fill:#475569,stroke:#1e293b,color:#f8fafc,font-style:italic
  classDef uc    fill:#fff,stroke:#94a3b8,color:#1e293b

  subgraph L[" "]
    direction TB
    USER["Nguoi muon ket ban (Role 1)"]
    ORGANIZER["Nguoi to chuc su kien (Role 2)"]
    SYS_OTP["He thong OTP ben thu 3"]
  end

  subgraph WC["Xac thuc & Tai khoan"]
    style WC fill:#fefce8,stroke:#ca8a04,color:#713f12
    UC_REG(Dang ky tai khoan)
    UC_LOGIN(Dang nhap)
    UC_FORGOT(Quen mat khau)
    UC_OTP(Xac thuc OTP)
    UC_PROFILE(Quan ly ho so ca nhan)
    UC_LANG(Chuyen doi ngon ngu)
  end

  USER      --> UC_REG & UC_LOGIN & UC_FORGOT & UC_PROFILE & UC_LANG
  ORGANIZER --> UC_REG & UC_LOGIN & UC_FORGOT & UC_PROFILE & UC_LANG

  UC_REG    -. "include" .-> UC_OTP
  UC_FORGOT -. "include" .-> UC_OTP
  SYS_OTP   --> UC_OTP

  style L fill:transparent,stroke:transparent
  class USER,ORGANIZER actor
  class SYS_OTP ext
  class UC_REG,UC_LOGIN,UC_FORGOT,UC_OTP,UC_PROFILE,UC_LANG uc
```

---

## 2. Kết bạn & Tìm kiếm (SRS ID: 9, 10, 11, 12, 15, 16)

```mermaid
flowchart LR
  classDef actor fill:#1e40af,stroke:#1e3a8a,color:#fff,font-weight:bold
  classDef uc    fill:#fff,stroke:#94a3b8,color:#1e293b

  subgraph L[" "]
    direction TB
    USER["Nguoi muon ket ban (Role 1)"]
  end

  subgraph WC["Ket ban & Tim kiem"]
    style WC fill:#f0fdf4,stroke:#16a34a,color:#14532d
    UC_HOME(Xem trang chu)
    UC_SEARCH(Tim kiem nguoi dung)
    UC_FILTER(Loc ket qua tim kiem)
    UC_SUGGEST(Nhan goi y ket ban)
    UC_FRIEND_REQ(Gui loi moi ket ban)
    UC_INVITE(Quan ly loi moi ket ban)
    UC_FRIEND_MGT(Quan ly ban be)
  end

  USER --> UC_HOME & UC_SEARCH & UC_SUGGEST
  USER --> UC_FRIEND_REQ & UC_INVITE & UC_FRIEND_MGT

  UC_HOME   -. "include" .-> UC_SUGGEST
  UC_FILTER -. "extend"  .-> UC_SEARCH

  style L fill:transparent,stroke:transparent
  class USER actor
  class UC_HOME,UC_SEARCH,UC_FILTER,UC_SUGGEST,UC_FRIEND_REQ,UC_INVITE,UC_FRIEND_MGT uc
```

---

## 3. Giao tiếp (SRS ID: 13)

```mermaid
flowchart LR
  classDef actor fill:#1e40af,stroke:#1e3a8a,color:#fff,font-weight:bold
  classDef ext   fill:#475569,stroke:#1e293b,color:#f8fafc,font-style:italic
  classDef uc    fill:#fff,stroke:#94a3b8,color:#1e293b

  subgraph L[" "]
    direction TB
    USER["Nguoi muon ket ban (Role 1)"]
    SYS_TRANS["Dich vu dich thuat ben thu 3"]
  end

  subgraph WC["Giao tiep"]
    style WC fill:#fdf4ff,stroke:#9333ea,color:#4a044e
    UC_CHAT(Nhan tin realtime)
    UC_CALL(Goi audio va video)
    UC_TRANSLATE(Dich tin nhan Nhat-Viet)
  end

  USER --> UC_CHAT & UC_CALL
  UC_TRANSLATE -. "extend"  .-> UC_CHAT
  SYS_TRANS    --> UC_TRANSLATE

  style L fill:transparent,stroke:transparent
  class USER actor
  class SYS_TRANS ext
  class UC_CHAT,UC_CALL,UC_TRANSLATE uc
```

> **Precondition**: `Nhan tin realtime` yeu cau hai ben phai la ban be (SRS ID 13).

---

## 4. Sự kiện & Game (SRS ID: 17)

```mermaid
flowchart LR
  classDef actor fill:#1e40af,stroke:#1e3a8a,color:#fff,font-weight:bold
  classDef uc    fill:#fff,stroke:#94a3b8,color:#1e293b

  subgraph L[" "]
    direction TB
    USER["Nguoi muon ket ban (Role 1)"]
  end

  subgraph WC["Su kien & Game"]
    style WC fill:#fff7ed,stroke:#ea580c,color:#7c2d12
    UC_EVENT_JOIN(Dang ky tham gia su kien)
    UC_GAME(Tham gia game room)
    UC_GAME_CREATE(Tao phong game)
    UC_GAME_RANDOM(Tham gia ngau nhien)
    UC_GAME_CODE(Nhap ma phong)
    UC_GAME_CHAT(Chat realtime trong phong game)
  end

  USER --> UC_EVENT_JOIN & UC_GAME

  UC_GAME        -. "include" .-> UC_GAME_CHAT
  UC_GAME_CREATE -. "extend"  .-> UC_GAME
  UC_GAME_RANDOM -. "extend"  .-> UC_GAME
  UC_GAME_CODE   -. "extend"  .-> UC_GAME

  style L fill:transparent,stroke:transparent
  class USER actor
  class UC_EVENT_JOIN,UC_GAME,UC_GAME_CREATE,UC_GAME_RANDOM,UC_GAME_CODE,UC_GAME_CHAT uc
```

---

## 5. Quản lý Sự kiện (SRS ID: 7)

```mermaid
flowchart LR
  classDef actor fill:#1e40af,stroke:#1e3a8a,color:#fff,font-weight:bold
  classDef uc    fill:#fff,stroke:#94a3b8,color:#1e293b

  subgraph R[" "]
    direction TB
    ORGANIZER["Nguoi to chuc su kien (Role 2)"]
  end

  subgraph WC["Quan ly Su kien"]
    style WC fill:#fef2f2,stroke:#dc2626,color:#7f1d1d
    UC_EVENT_CRUD(Tao - Sua - Xoa su kien)
    UC_EVENT_STATS(Xem thong ke su kien)
  end

  ORGANIZER --> UC_EVENT_CRUD & UC_EVENT_STATS

  style R fill:transparent,stroke:transparent
  class ORGANIZER actor
  class UC_EVENT_CRUD,UC_EVENT_STATS uc
```

---

## Ghi chú chung

- **Actors**:
  - `Nguoi muon ket ban` (Role 1): ket ban, nhan tin, goi dien, dang ky su kien, choi game.
  - `Nguoi to chuc su kien` (Role 2): quan ly & thong ke su kien. Ca hai role deu dung chung cac UC xac thuc & tai khoan.
  - `He thong OTP` / `Dich vu dich thuat`: he thong ngoai cung cap dich vu (tich hop API ben thu 3).

- **Nhom UC (mau sac)**:

  | Mau | Nhom | SRS ID |
  |-----|------|--------|
  | Vang | Xac thuc & Tai khoan | 3, 4, 5, 6, 14 |
  | Xanh la | Ket ban & Tim kiem | 9, 10, 11, 12, 15, 16 |
  | Tim | Giao tiep | 13 |
  | Cam | Su kien & Game | 17 |
  | Do | Quan ly su kien | 7 |

- **Quan he include** (bat buoc thuc hien):
  - `Dang ky` va `Quen mat khau` bat buoc qua `Xac thuc OTP`.
  - `Xem trang chu` luon hien thi `Nhan goi y ket ban`.
  - `Tham gia game room` luon co `Chat realtime trong phong`.

- **Quan he extend** (tuy chon, co dieu kien):
  - `Loc ket qua` extends `Tim kiem`: chi khi nguoi dung ap dung bo loc.
  - `Dich tin nhan` extends `Nhan tin`: chi khi nhan nut dich (SRS ID 13).
  - `Tao phong`, `Tham gia ngau nhien`, `Nhap ma phong` la 3 cach mo rong cua `Tham gia game room`.

- **Ngoai pham vi**: UC ha tang ky thuat (ID 1 - CSDL, ID 2 - Moi truong, ID 8 - API, ID 18 - WebSocket) khong xuat hien vi khong phai tuong tac actor-he thong.
