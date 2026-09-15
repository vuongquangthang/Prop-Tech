# Prop-Tech / LIVO Hub

Hệ thống quản lý nhà trọ/căn hộ gồm web admin, app cư dân/app quản lý và backend API. Dự án tập trung vào các nghiệp vụ vận hành bất động sản cho thuê: hạ tầng tòa nhà, phòng, cư dân, hợp đồng, hóa đơn, công nợ, sự cố, bài đăng tìm người ở cùng và trợ lý AI.

## Thành phần chính

- `backend/`: ASP.NET Core 9 Web API, Entity Framework Core, SignalR, JWT, PostgreSQL/SQL Server/SQLite.
- `frontend/`: React + Vite web admin.
- `mobile/`: Expo React Native app cho cư dân và quản lý.
- `docs/`, `reports/`: tài liệu và báo cáo kiểm thử.
- `docker-compose.yml`: cấu hình chạy backend/frontend bằng Docker.

## Chức năng nổi bật

- Quản lý hạ tầng: tòa nhà, tầng, phòng, dịch vụ, tài sản/tiện nghi.
- Quản lý cư dân và hợp đồng: tạo/sửa/tất toán hợp đồng, đổi cư dân đại diện, lịch sử chỉnh sửa.
- Hóa đơn & tài chính: nhập chỉ số điện/nước, tính hóa đơn, gửi hóa đơn, gạch nợ, nhắc nợ.
- App cư dân: xem hợp đồng/phòng/hóa đơn, thanh toán QR, báo cáo sự cố, thông báo, tin nhắn, bài đăng tìm người ở cùng.
- Vận hành sự cố: tiếp nhận, xử lý, chờ nghiệm thu, sửa lại, hoàn thành.
- Báo cáo thống kê: lấp đầy phòng, doanh thu, hợp đồng, sự cố, điện nước.
- Tích hợp: SignalR notification, PayOS/VietQR, bản đồ Goong, chatbot/n8n, đồng bộ bài đăng với hệ thống tìm trọ.

## Yêu cầu môi trường

- Node.js `>=20 <22`
- npm
- .NET SDK 9
- PostgreSQL hoặc SQL Server
- Expo CLI nếu chạy mobile trên thiết bị/emulator
- Docker Desktop nếu chạy bằng Docker

## Cấu trúc thư mục

```text
Prop-Tech/
├── backend/        # ASP.NET Core API
├── frontend/       # Web admin React/Vite
├── mobile/         # Expo React Native app
├── docs/           # Tài liệu
├── reports/        # Báo cáo
└── docker-compose.yml
```

## Cấu hình môi trường

### Backend

Backend đọc cấu hình từ `backend/appsettings.json`, `backend/appsettings.Development.json` và biến môi trường.

Cấu hình quan trọng:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Port=5432;Database=postgres;Username=postgres;Password=postgres"
  },
  "Database": {
    "Provider": "Postgres",
    "Schema": "proptech"
  },
  "Jwt": {
    "Key": "YourSuperSecretKeyThatIsAtLeast32CharactersLongForHS256Algorithm",
    "Issuer": "ApartmentManagementAPI",
    "Audience": "ApartmentManagementClient"
  },
  "PayOS": {
    "ClientId": "",
    "ApiKey": "",
    "ChecksumKey": "",
    "IsTestMode": false
  }
}
```

Không commit secret thật như PayOS key, R2 key, Goong key hoặc connection string production.

### Frontend

Tạo/cập nhật `frontend/.env.development`:

```env
VITE_API_BASE_URL=http://localhost:5052
VITE_TROUYTIN_API_BASE_URL=http://localhost:8090
VITE_TROUYTIN_WEB_BASE_URL=http://localhost:3000
VITE_DASHBOARD_DEMO=false
```

Nếu chạy trên điện thoại thật, đổi API base URL sang IP LAN của máy chạy backend, ví dụ:

```env
VITE_API_BASE_URL=http://192.168.1.10:5052
```

### Mobile

App mobile dùng `EXPO_PUBLIC_API_BASE_URL` nếu có, nếu không sẽ fallback theo cấu hình trong `mobile/src/services/api.service.ts`.

Ví dụ tạo `mobile/.env`:

```env
EXPO_PUBLIC_API_BASE_URL=http://192.168.1.10:5052
```

Với thiết bị thật, `localhost` là chính thiết bị, không phải máy tính. Hãy dùng IP LAN của máy chạy backend.

## Chạy local

### 1. Backend

```bash
cd backend
dotnet restore
dotnet ef database update
dotnet run
```

API mặc định thường chạy tại:

```text
http://localhost:5052
```

Nếu build khi backend đang chạy bị lỗi file locked, dừng process backend trước hoặc build ra output tạm:

```bash
dotnet build -o ../tmp/backend-build-check
```

### 2. Frontend web admin

```bash
cd frontend
npm install
npm run dev
```

Web mặc định:

```text
http://localhost:3000
```

Build production:

```bash
npm run build
```

Test:

```bash
npm test
```

### 3. Mobile app

```bash
cd mobile
npm install
npm start
```

Chạy theo nền tảng:

```bash
npm run android
npm run ios
npm run web
```

## Chạy bằng Docker

Chuẩn bị biến môi trường `PROPTECH_DATABASE_URL` trước khi chạy:

```bash
docker compose up --build
```

Port mặc định:

- Backend container: `http://localhost:8080`
- Frontend container: `http://localhost:3001`

## Quy trình nghiệp vụ chính

### Hạ tầng

1. Tạo tòa nhà.
2. Tạo tầng trong tòa.
3. Thiết lập dịch vụ/tài sản theo tòa.
4. Tạo phòng thuộc tầng.
5. Gán dịch vụ/tài sản cho phòng.

### Hợp đồng

1. Chọn phòng.
2. Chọn/thêm cư dân đại diện và người ở cùng.
3. Nhập thời hạn, tiền thuê, tiền cọc.
4. Chọn dịch vụ áp dụng.
5. Tạo hợp đồng.

### Hóa đơn điện nước

1. Chọn tháng/năm.
2. Nhập/chốt chỉ số điện nước cho phòng có dịch vụ điện/nước.
3. Bấm `Tính hóa đơn`.
4. Hóa đơn ở trạng thái `Chờ gửi`.
5. Kiểm tra chi tiết.
6. Bấm `Gửi hóa đơn` để cư dân nhận thông báo và xem trên app.

Quy tắc khóa kỳ:

- Hóa đơn đã gửi thì chỉ số kỳ đó không được sửa.
- Nếu đã gửi hóa đơn kỳ sau, hệ thống không cho nhập/sửa chỉ số hoặc tính hóa đơn ngược kỳ trước cho cùng hợp đồng.
- Hóa đơn đã xuất giữ snapshot đơn giá tại thời điểm xuất.

### Sự cố

1. Cư dân gửi sự cố kèm mô tả/ảnh.
2. Quản lý chuyển trạng thái: chờ xử lý → đang xử lý → chờ nghiệm thu.
3. Cư dân nghiệm thu:
   - Hài lòng: hoàn thành.
   - Không hài lòng: chuyển `Sửa lại`.

