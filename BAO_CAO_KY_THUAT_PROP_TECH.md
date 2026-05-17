---
noteId: "b5b37f803d2511f185b385f5c64ee7eb"
tags: []

---

# Báo cáo kỹ thuật dự án Prop-Tech

## 1. Tổng quan dự án

### 1.1 Mục đích dự án
Prop-Tech là hệ thống quản lý vận hành tòa nhà/chung cư theo mô hình đa nền tảng gồm:
- Web admin cho Ban quản lý
- Mobile app cho cư dân
- Backend API trung tâm

Mục tiêu là số hóa toàn bộ quy trình vận hành: quản lý phòng, cư dân, hợp đồng, chỉ số điện nước, hóa đơn, công nợ, sửa chữa, thanh toán và thông báo realtime.

### 1.2 Bài toán dự án giải quyết
- Dữ liệu vận hành phân tán giữa nhiều bộ phận
- Quy trình thu phí thiếu liên kết từ chỉ số điện nước đến thanh toán
- Chậm phản hồi giữa cư dân và ban quản lý
- Thiếu công cụ tự động trả lời câu hỏi phổ biến

### 1.3 Tính năng chính
- Quản lý hạ tầng: tòa nhà, tầng, phòng, tài sản, dịch vụ
- Quản lý cư dân và hợp đồng thuê
- Ghi chỉ số điện nước theo tháng, phát hiện bất thường
- Tính hóa đơn nháp, duyệt/từ chối hóa đơn
- Quản lý công nợ, gửi nhắc nợ
- Thanh toán qua PayOS/VietQR
- Quản lý yêu cầu sửa chữa có ảnh minh chứng
- Thông báo realtime với SignalR
- Chatbot tích hợp n8n + Knowledge Base
- Audit log cho thao tác thay đổi dữ liệu

---

## 2. Kiến trúc hệ thống

### 2.1 Mô hình kiến trúc
- Tổng thể: Modular Monolith (backend) + 2 client độc lập
- Backend: Controller -> Service -> Repository -> EF Core
- Frontend web: React + Vite + React Router
- Mobile: React Native (Expo) + Zustand + React Navigation
- Realtime: SignalR Hub
- Database: SQL Server

### 2.2 Liên kết giữa các module
Luồng xử lý điển hình:
1. Client gọi API qua lớp service
2. Controller nhận request, authorize và validate đầu vào
3. Service xử lý nghiệp vụ
4. Repository/DbContext thao tác dữ liệu
5. Service phát sự kiện SignalR hoặc tạo thông báo DB nếu cần
6. Controller trả DTO cho client

### 2.3 Sơ đồ luồng dữ liệu (text)
#### Luồng hóa đơn
1. Nhân viên chốt chỉ số điện nước theo tháng
2. Backend lưu chỉ số và đánh dấu bất thường nếu vượt ngưỡng
3. Kế toán chạy tính hóa đơn nháp
4. Hệ thống sinh chi tiết hóa đơn theo công thức hợp đồng
5. Kế toán duyệt hóa đơn
6. Backend gửi thông báo realtime cho cư dân
7. Cư dân thanh toán trên mobile
8. Callback thanh toán cập nhật trạng thái giao dịch và hóa đơn

#### Luồng sửa chữa
1. Cư dân gửi yêu cầu sửa chữa kèm ảnh
2. Ban quản lý cập nhật trạng thái xử lý
3. Khi chuyển sang chờ nghiệm thu, cư dân nhận thông báo
4. Cư dân phản hồi: hài lòng (đóng) hoặc yêu cầu sửa lại

---

## 3. Cấu trúc thư mục

## 3.1 Root
- [Prop-Tech.sln](Prop-Tech.sln): solution .NET cho backend
- [docker-compose.yml](docker-compose.yml): chạy SQL Server + backend + frontend bằng Docker
- [start-all.ps1](start-all.ps1): script local Windows để chạy toàn hệ thống và ngrok

### 3.2 Backend
- [backend/Program.cs](backend/Program.cs): bootstrap ứng dụng, DI, middleware, auth, SignalR, seed dữ liệu
- [backend/Data/ApplicationDbContext.cs](backend/Data/ApplicationDbContext.cs): mô hình dữ liệu, quan hệ, ràng buộc
- [backend/Data/DatabaseSeeder.cs](backend/Data/DatabaseSeeder.cs): seed dữ liệu mẫu
- [backend/Controllers](backend/Controllers): tầng API endpoint
- [backend/Services](backend/Services): logic nghiệp vụ
- [backend/Repositories](backend/Repositories): truy cập dữ liệu
- [backend/Models](backend/Models): entity map bảng DB
- [backend/DTOs](backend/DTOs): request/response contract
- [backend/Hubs](backend/Hubs): SignalR hub
- [backend/Filters](backend/Filters): filter hệ thống (audit log)

### 3.3 Frontend
- [frontend/src/main.tsx](frontend/src/main.tsx): entry point
- [frontend/src/App.tsx](frontend/src/App.tsx): root providers
- [frontend/src/routes.tsx](frontend/src/routes.tsx): định tuyến toàn app
- [frontend/src/contexts](frontend/src/contexts): auth/data/search context
- [frontend/src/services](frontend/src/services): gọi API theo domain
- [frontend/src/lib](frontend/src/lib): API client, config, signalr, role utils
- [frontend/src/pages](frontend/src/pages): màn hình nghiệp vụ
- [frontend/src/components](frontend/src/components): UI components

### 3.4 Mobile
- [mobile/App.tsx](mobile/App.tsx): entry point Expo
- [mobile/src/navigation](mobile/src/navigation): điều hướng Auth/Main
- [mobile/src/store](mobile/src/store): auth state với Zustand
- [mobile/src/services](mobile/src/services): API, signalr, payment, invoice, maintenance
- [mobile/src/screens](mobile/src/screens): các màn hình cư dân

---

## 4. Luồng hoạt động chính

### 4.1 Entry point
- Backend: [backend/Program.cs](backend/Program.cs)
- Frontend: [frontend/src/main.tsx](frontend/src/main.tsx)
- Mobile: [mobile/App.tsx](mobile/App.tsx)

### 4.2 Khi chạy chương trình
1. Backend khởi động, cấu hình JWT/CORS/SignalR/Swagger
2. Backend đảm bảo DB tồn tại, vá cột thiếu, seed dữ liệu
3. Frontend load router + auth context
4. Mobile load user từ SecureStore, quyết định vào AuthStack hay MainTabs
5. Client đã đăng nhập sẽ kết nối SignalR

### 4.3 Các bước xử lý nghiệp vụ phổ biến
1. Đăng nhập lấy access token + refresh token
2. Thao tác nghiệp vụ (hợp đồng, chỉ số, hóa đơn, sự cố)
3. Backend cập nhật DB và trạng thái nghiệp vụ
4. Nếu có event quan trọng, backend push realtime qua hub
5. Client cập nhật UI và trạng thái người dùng

---

## 5. Phân tích code chi tiết

### 5.1 Thành phần quan trọng ở backend

#### a) Khởi tạo hệ thống
- [backend/Program.cs](backend/Program.cs)
- Điểm chính:
  - JWT Bearer authentication
  - SignalR authentication qua access_token query
  - CORS mở rộng
  - Đăng ký DI theo domain
  - EnsureCreated + SQL đảm bảo cột cho DB cũ
  - Expose uploads qua static files

#### b) Xác thực và tài khoản
- [backend/Services/AuthService.cs](backend/Services/AuthService.cs)
- Logic:
  - BCrypt hash/verify mật khẩu
  - Refresh token lưu theo user
  - Hỗ trợ first-login đổi mật khẩu (MustChangePassword)
  - Mapping role tiếng Việt DB sang role tiếng Anh cho frontend

#### c) Quản lý hợp đồng
- [backend/Services/HopDongService.cs](backend/Services/HopDongService.cs)
- Logic:
  - Tạo hợp đồng, validate phòng/cư dân
  - Tự đồng bộ cư dân cư trú (ChiTietO)
  - Đồng bộ dịch vụ dùng theo hợp đồng
  - Rebuild billing formula khi thay đổi dịch vụ

#### d) Quy trình hóa đơn
- [backend/Services/HoaDonService.cs](backend/Services/HoaDonService.cs)
- Logic:
  - Tính hóa đơn theo công thức hoặc fallback
  - Tự tính tiêu thụ điện nước theo chênh lệch chỉ số
  - Bỏ qua phòng có chỉ số bất thường
  - Duyệt hóa đơn và gửi thông báo realtime

#### e) Chốt chỉ số điện nước
- [backend/Services/UtilityReadingService.cs](backend/Services/UtilityReadingService.cs)
- Logic:
  - Record batch theo tháng
  - Validate chỉ số mới >= chỉ số cũ
  - Phát hiện bất thường khi vượt 2x tháng trước

#### f) Sửa chữa và nghiệm thu
- [backend/Services/YeuCauSuaChuaService.cs](backend/Services/YeuCauSuaChuaService.cs)
- Logic:
  - Tạo yêu cầu từ cư dân, tự suy ra phòng nếu cần
  - Quản lý trạng thái xử lý/nghiệm thu
  - Cư dân xác nhận đóng hoặc yêu cầu sửa lại

#### g) Thanh toán
- [backend/Services/PaymentService.cs](backend/Services/PaymentService.cs)
- Logic:
  - Tạo giao dịch PENDING
  - Tạo link thanh toán PayOS
  - Sinh QR VietQR
  - Callback cập nhật transaction và trạng thái hóa đơn

#### h) Chatbot và tri thức
- [backend/Services/ChatService.cs](backend/Services/ChatService.cs)
- Logic:
  - Gọi webhook n8n để lấy câu trả lời
  - Fallback knowledge-gap khi không có câu trả lời tốt
  - Admin có thể convert câu chưa trả lời thành Knowledge Base

#### i) Notification realtime
- [backend/Hubs/NotificationHub.cs](backend/Hubs/NotificationHub.cs)
- [backend/Services/NotificationService.cs](backend/Services/NotificationService.cs)
- Logic:
  - Group theo user_id
  - Lưu thông báo vào DB và push realtime song song

### 5.2 Thành phần quan trọng ở frontend
- [frontend/src/routes.tsx](frontend/src/routes.tsx): định tuyến + bảo vệ route
- [frontend/src/contexts/AuthContext.tsx](frontend/src/contexts/AuthContext.tsx): auth lifecycle
- [frontend/src/lib/api-client.ts](frontend/src/lib/api-client.ts): interceptor refresh token
- [frontend/src/lib/signalr-service.ts](frontend/src/lib/signalr-service.ts): realtime client
- [frontend/src/contexts/DataContext.tsx](frontend/src/contexts/DataContext.tsx): nạp dữ liệu dashboard

### 5.3 Thành phần quan trọng ở mobile
- [mobile/src/navigation/RootNavigator.tsx](mobile/src/navigation/RootNavigator.tsx): điều hướng theo trạng thái auth
- [mobile/src/store/authStore.ts](mobile/src/store/authStore.ts): state auth
- [mobile/src/services/api.service.ts](mobile/src/services/api.service.ts): token/refresh queue
- [mobile/src/services/signalr.service.ts](mobile/src/services/signalr.service.ts): nhận event realtime
- [mobile/src/screens/ReportIssueScreen.tsx](mobile/src/screens/ReportIssueScreen.tsx): convert ảnh sang JPEG trước upload

### 5.4 Các đoạn code dễ nhầm lẫn
- Role mapping DB/frontend không đồng nhất tuyệt đối
- Một số flow hợp đồng cũ còn tồn tại trong service nhưng đã chặn ở controller
- Dữ liệu ảnh sự cố lưu dạng JSON string (mediaUrls), không phải một URL đơn
- DataContext web đang polling dày (1 giây/lần), cần đọc kỹ để tránh hiểu nhầm là chỉ realtime

---

## 6. Công nghệ sử dụng

### 6.1 Ngôn ngữ
- Backend: C#
- Frontend/Mobile: TypeScript

### 6.2 Framework và thư viện
#### Backend
- ASP.NET Core 9
- Entity Framework Core 9
- SQL Server provider
- JWT Bearer
- SignalR
- Swashbuckle
- BCrypt
- PayOS SDK

Tham chiếu: [backend/backend.csproj](backend/backend.csproj)

#### Frontend
- React 18
- Vite
- React Router
- Axios
- SignalR JS
- Radix UI

Tham chiếu: [frontend/package.json](frontend/package.json)

#### Mobile
- Expo SDK 54
- React Native
- React Navigation
- Zustand
- Axios
- Expo Secure Store

Tham chiếu: [mobile/package.json](mobile/package.json)

### 6.3 Build và deploy
- Docker compose: [docker-compose.yml](docker-compose.yml)
- Backend Dockerfile: [backend/Dockerfile](backend/Dockerfile)
- Frontend Dockerfile: [frontend/Dockerfile](frontend/Dockerfile)
- Frontend local port: 3000 tại [frontend/vite.config.ts](frontend/vite.config.ts)

---

## 7. Cách cài đặt và chạy project

### 7.1 Yêu cầu môi trường
- Windows + PowerShell
- .NET SDK 9
- Node.js 20 LTS (khuyến nghị)
- SQL Server local hoặc Docker
- Expo Go (nếu chạy mobile)

### 7.2 Chạy local thủ công
1. Backend
- cd backend
- dotnet restore
- dotnet run

2. Frontend
- cd frontend
- npm install
- npm run dev

3. Mobile
- cd mobile
- npm install
- npm run start

### 7.3 Chạy bằng script
- Chạy [start-all.ps1](start-all.ps1)
- Script sẽ dọn process cũ, chạy backend, frontend, mobile và ngrok

### 7.4 Chạy bằng Docker
- docker compose up --build
- Dùng [docker-compose.yml](docker-compose.yml)

---

## 8. Điểm mạnh và điểm yếu

### 8.1 Điểm mạnh
- Kiến trúc phân lớp rõ, dễ mở rộng
- Nghiệp vụ hóa đơn/điện nước khá hoàn chỉnh
- Có kiểm soát bất thường tiêu thụ
- Realtime tốt nhờ SignalR
- Có audit log tự động
- Có seed dữ liệu demo lớn
- Mobile xử lý refresh token ổn định

### 8.2 Điểm yếu/cần cải thiện
- CORS mở rộng, cần siết cho production
- Program.cs chứa quá nhiều logic startup/migration
- RBAC web chưa khai thác đúng các role ngoài Admin
- Polling web dày gây tốn tài nguyên
- Một số flow cũ chưa đồng bộ giữa backend và mobile
- Secret cấu hình đang để trong appsettings mẫu, nên chuyển sang secret manager/env

---

## 9. Gợi ý cho developer mới

### 9.1 Nên đọc file nào trước
1. [backend/Program.cs](backend/Program.cs)
2. [backend/Data/ApplicationDbContext.cs](backend/Data/ApplicationDbContext.cs)
3. [backend/Services/HoaDonService.cs](backend/Services/HoaDonService.cs)
4. [backend/Services/UtilityReadingService.cs](backend/Services/UtilityReadingService.cs)
5. [backend/Services/HopDongService.cs](backend/Services/HopDongService.cs)
6. [frontend/src/routes.tsx](frontend/src/routes.tsx)
7. [mobile/src/navigation/RootNavigator.tsx](mobile/src/navigation/RootNavigator.tsx)

### 9.2 Nên bắt đầu từ đâu để hiểu nhanh
1. Nắm mô hình dữ liệu: Building -> Floor -> Room -> Contract -> Invoice -> Payment
2. Chạy local và đi theo luồng nghiệp vụ chuẩn
3. Đọc các service quan trọng trước khi đọc toàn bộ UI

### 9.3 Các phần dễ gây nhầm lẫn
- Mapping role tiếng Việt/tiếng Anh
- Tên endpoint auth refresh giữa web/mobile khác nhau
- Flow contract change cũ còn code ở mobile
- mediaUrls là JSON string array

---

## Kết luận
Prop-Tech có nền tảng kỹ thuật tốt cho một hệ thống vận hành tòa nhà end-to-end. Điểm ưu tiên cải tiến nên tập trung vào chuẩn hóa RBAC, tách gọn startup logic, giảm polling không cần thiết và đồng bộ lại các flow nghiệp vụ đã deprecated giữa backend và mobile.