# WeConnect

## 1. Yêu cầu

- Docker & Docker Compose
- Node.js 18+ và [pnpm](https://pnpm.io/) (để chạy frontend)

## 2. Chạy Backend & Database (Docker)

Mở terminal tại thư mục gốc của dự án và chạy:

```bash
docker compose up --build -d
```

Sau khi container khởi động:

- **Backend (API Docs)**: [http://localhost:8001/docs](http://localhost:8001/docs)
- **Database (MySQL)**: `localhost:3308`

## 3. Chạy Frontend

Frontend chạy riêng bằng Vite (dev server tại cổng 8081, tự proxy API sang backend `:8001`):

```bash
cd frontend
pnpm install
pnpm dev
```

- **Frontend**: [http://localhost:8081](http://localhost:8081)

## 4. Tài khoản mẫu

Tất cả tài khoản dùng mật khẩu chung: **`Password@123`**

| Email                         | Vai trò   | Trạng thái        | Ghi chú             |
| -------------------------------| -----------| -------------------| ---------------------|
| `nguyen.tuan@gmail.com`       | USER      | Đã xác thực       | Học N3              |
| `tran.linh@gmail.com`         | USER      | Đã xác thực       | Học N4              |
| `pham.anh@gmail.com`          | USER      | Đã xác thực       | Level N2            |
| `le.mai@gmail.com`            | USER      | **Chưa xác thực** | Dùng để test OTP    |
| `hoang.duc@gmail.com`         | USER      | Đã xác thực       | Level N1            |
| `organizer.han@weconnect.vn`  | ORGANIZER | Đã xác thực       | Tổ chức sự kiện HN  |
| `organizer.minh@weconnect.vn` | ORGANIZER | Đã xác thực       | Tổ chức sự kiện HCM |
