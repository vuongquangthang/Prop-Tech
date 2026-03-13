# Hướng dẫn chạy dự án Prop-Tech (chi tiết cho người mới)

Tài liệu này được viết để người nhận file zip có thể làm theo và chạy được ngay.

## 1) Tổng quan nhanh

Dự án gồm 3 phần:
- Backend: ASP.NET Core 9, chạy cổng 5052 (HTTP), 5053 (HTTPS)
- Frontend: Vite + React, mặc định cổng 3000 (local), 3001 (docker)
- Mobile: Expo React Native

Database dùng SQL Server.

## 2) Yêu cầu cài đặt trước

Cần cài:
- Git (không bắt buộc nếu đã có file zip)
- .NET SDK 9.0
- Node.js 20 LTS (khuyến nghị)
- npm (đi kèm Node)
- Docker Desktop (để chạy SQL Server nhanh và chạy full stack bằng compose)

Kiểm tra nhanh trong PowerShell:

```powershell
dotnet --version
node -v
npm -v
docker --version
docker compose version
```

## 3) Bắt buộc sửa API URL cho máy mới

### 3.0 Tra địa chỉ IP của máy tính

Bước này cần làm TRƯỚC khi chạy backend. Mục tiêu là tìm địa chỉ IP LAN của máy để frontend và mobile biết gọi API về đâu.

Mở CMD (nhấn Windows + R, gõ `cmd`, Enter), rồi chạy:

```cmd
ipconfig
```

Tìm dòng **IPv4 Address** trong mục tên card mạng bạn đang dùng (Ethernet hoặc Wi-Fi).

Ví dụ kết quả:

```
Wireless LAN adapter Wi-Fi:
   IPv4 Address. . . . . . . . : 192.168.1.76
   Subnet Mask . . . . . . . . : 255.255.255.0
   Default Gateway . . . . . . : 192.168.1.1
```

Ghi lại địa chỉ đó, ví dụ `192.168.1.76`. Dùng địa chỉ này cho cả 2 bước tiếp theo.

### 3.1 Frontend

Mở file:
- `frontend/.env.development`

Sửa dòng duy nhất trong file thành IP vừa tra được:

```env
VITE_API_BASE_URL=http://192.168.1.76:5052
```

Nếu chạy frontend và backend cùng một máy thì có thể để:

```env
VITE_API_BASE_URL=http://localhost:5052
```

### 3.2 Mobile

Mở file:
- `mobile/src/services/api.service.ts`

Tìm dòng đầu tiên chứa `API_BASE_URL` và sửa thành IP vừa tra được:

```ts
export const API_BASE_URL = 'http://192.168.1.76:5052';
```

Lưu ý quan trọng:
- Không dùng `localhost` trên điện thoại thật, vì `localhost` của điện thoại không phải máy tính.
- Điện thoại và máy tính phải cùng mạng Wi-Fi.
- Sau khi sửa, cần build lại app bằng cách dừng `npm start` rồi chạy lại.

## 4) Cách để chạy được ngay (dễ nhất)

Khuyến nghị cho người mới: chạy SQL Server bằng Docker, còn backend + frontend + mobile chạy local.

### B1. Mở project

```powershell
cd D:\Prop_Tech\Prop-Tech
```

### B2. Chạy SQL Server container

```powershell
docker compose up -d sqlserver
```

Chờ 15-30 giây để DB khởi động.

### B3. Chạy Backend

```powershell
cd backend
dotnet restore
dotnet run
```

Nếu thành công, backend sẵn sàng tại:
- http://localhost:5052

Lưu ý:
- Swagger chỉ bật trong Development, nên local có swagger.
- Vì backend đang listen 0.0.0.0:5052, thiết bị khác cũng có thể gọi nếu cùng mạng LAN.

### B4. Chạy Frontend

Mở terminal mới:

```powershell
cd D:\Prop_Tech\Prop-Tech\frontend
npm install
npm run dev
```

Mở trình duyệt:
- http://localhost:3000

### B5. Chạy Mobile (Expo)

Mở terminal mới:

```powershell
cd D:\Prop_Tech\Prop-Tech\mobile
npm install
npm start
```

Dùng Expo Go quét QR hoặc nhấn phím a/w để mở Android/Web.

## 5) Chạy Ngrok (để mobile truy cập từ mạng ngoài hoặc qua domain cố định)

Ngrok tạo một đường hầm công khai trỏ vào backend local, giúp điện thoại kết nối được dù khác mạng.

### 5.1 Cài Ngrok

Tải về tại: https://ngrok.com/download

Giải nén vào thư mục, ví dụ: `D:\Prop_Tech\Ngrok\`

### 5.2 Đăng nhập Ngrok (chỉ cần làm 1 lần)

Đăng ký tài khoản miễn phí tại ngrok.com, vào mục **Your Authtoken** rồi chạy:

```cmd
ngrok config add-authtoken <token_của_bạn>
```

### 5.3 Chạy tunnel trỏ vào backend

Mở CMD tại thư mục Ngrok:

```cmd
cd /d D:\Prop_Tech\Ngrok
ngrok http 5052
```

Nếu có domain cố định (ngrok free tier cho 1 static domain), dùng:

```cmd
ngrok http --domain=<domain-của-bạn>.ngrok-free.app 5052
```

Ngrok sẽ hiện ra màn hình dạng:

```
Forwarding   https://abc123.ngrok-free.app -> http://localhost:5052
```

### 5.4 Cập nhật URL ngrok vào 2 file

Sau khi Ngrok chạy, lấy địa chỉ `https://...ngrok-free.app` và cập nhật vào:

**File 1:** `frontend/.env.development`

```env
VITE_API_BASE_URL=https://abc123.ngrok-free.app
```

**File 2:** `mobile/src/services/api.service.ts`

```ts
export const API_BASE_URL = 'https://abc123.ngrok-free.app';
```

Sau đó restart frontend (`npm run dev`) và restart Expo (`npm start`) để nạp URL mới.

Lưu ý:
- Domain ngrok miễn phí đổi mỗi lần khởi động lại nếu không có static domain. Hãy cập nhật lại URL sau mỗi lần bật ngrok mới.
- Backend phải đang chạy trước khi mở ngrok.

---

## 6) Upload ảnh sẽ lưu ở đâu

Khi chạy local (Development), ảnh upload lưu tại:
- D:\Prop_Tech\uploads

Cấu hình nằm trong:
- backend/appsettings.Development.json

Khi chạy bằng Docker backend, ảnh lưu trong volume Docker map vào /app/uploads.

## 7) Cách chạy full bằng Docker Compose

Nếu muốn chạy full backend + frontend + sqlserver bằng Docker:

```powershell
cd D:\Prop_Tech\Prop-Tech
docker compose up -d --build
```

URL:
- Frontend: http://localhost:3001
- Backend: http://localhost:8080

Lưu ý quan trọng:
- Backend trong docker đang set ASPNETCORE_ENVIRONMENT=Production.
- Swagger local code chỉ bật cho Development, vì vậy trong docker có thể KHÔNG có /swagger.

Dùng lệnh xem log:

```powershell
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f sqlserver
```

Dừng toàn bộ:

```powershell
docker compose down
```

## 8) Kiểm tra sau khi chạy (checklist 2 phút)

- Backend lên: mở http://localhost:5052
- Frontend lên: mở http://localhost:3000
- Frontend gọi API không lỗi CORS
- Đăng nhập thử trên web thành công
- Mobile đăng nhập được (sau khi sửa API_BASE_URL)
- Upload ảnh thành công và file xuất hiện trong D:\Prop_Tech\uploads

## 9) Lỗi thường gặp và cách sửa nhanh

### Lỗi 1: Port đã bị chiếm

- Frontend port 3000 bị chiếm: đổi process hoặc chạy lại npm run dev
- Backend port 5052 bị chiếm: tắt dotnet cũ

Lệnh tìm và tắt process theo port:

```powershell
Get-NetTCPConnection -LocalPort 5052 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }
Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }
```

### Lỗi 2: Backend không kết nối được SQL Server

Kiểm tra container DB:

```powershell
docker compose ps
```

Nếu sqlserver chưa lên, chạy lại:

```powershell
docker compose up -d sqlserver
```

Kiểm tra connection string trong backend/appsettings.Development.json phải là localhost,1433 với user sa.

### Lỗi 3: Mobile không gọi được API

Nguyên nhân thường gặp:
- API_BASE_URL đang để IP cũ
- Điện thoại và máy tính khác mạng
- Firewall chặn cổng 5052

Cách sửa:
- Đổi API_BASE_URL trong mobile/src/services/api.service.ts sang IP LAN đúng của máy backend
- Mở firewall cho cổng 5052 nếu cần

### Lỗi 4: npm install lỗi

Chạy:

```powershell
npm cache verify
```

Sau đó xóa node_modules và cài lại:

```powershell
cd frontend
Remove-Item -Recurse -Force node_modules
npm install
```

Làm tương tự với mobile nếu cần.

## 10) Lệnh chạy nhanh theo thứ tự (copy/paste)

**Bước 0 — Tra IP:**

```cmd
ipconfig
```

Ghi lại IPv4 Address (ví dụ `192.168.1.76`). Cập nhật vào:
- `frontend/.env.development` → `VITE_API_BASE_URL=http://192.168.1.76:5052`
- `mobile/src/services/api.service.ts` → `API_BASE_URL = 'http://192.168.1.76:5052'`

---

Terminal 1 — SQL Server:

```powershell
cd D:\Prop_Tech\Prop-Tech
docker compose up -d sqlserver
```

Terminal 2 — Backend:

```powershell
cd D:\Prop_Tech\Prop-Tech\backend
dotnet restore
dotnet run
```

Terminal 3 — Ngrok (nếu cần dùng trên điện thoại qua domain cố định):

```cmd
cd /d D:\Prop_Tech\Ngrok
ngrok http --domain=<domain-của-bạn>.ngrok-free.app 5052
```

Sau đó cập nhật URL ngrok vào 2 file `.env.development` và `api.service.ts`.

Terminal 4 — Frontend:

```powershell
cd D:\Prop_Tech\Prop-Tech\frontend
npm install
npm run dev
```

Terminal 5 — Mobile:

```powershell
cd D:\Prop_Tech\Prop-Tech\mobile
npm install
npm start
```
