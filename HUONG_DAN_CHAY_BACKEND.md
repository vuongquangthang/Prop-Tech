# Hướng dẫn chạy backend Prop-Tech

Backend Prop-Tech là ASP.NET Core API nằm ở:

```powershell
D:\Web_TroUyTin\Prop-Tech\Prop-Tech\backend
```

Port local mặc định:

```text
http://localhost:5052
```

Frontend Prop-Tech cũng đang mặc định gọi backend qua `http://localhost:5052`.

## 1. Chuẩn bị

Cần cài:

- .NET SDK 9
- Docker Desktop hoặc SQL Server local

Kiểm tra .NET:

```powershell
dotnet --version
```

## 2. Chạy SQL Server

Cách nhanh nhất là dùng service `sqlserver` trong `docker-compose.yml` của Prop-Tech:

```powershell
cd D:\Web_TroUyTin\Prop-Tech\Prop-Tech
docker compose up -d sqlserver
docker ps --filter "name=apartment_sqlserver"
```

Thông tin kết nối mặc định trong `backend\appsettings.Development.json`:

```text
Server:   localhost,1433
Database: apartment_management_dev
User:     sa
Password: YourStrong@Passw0rd
```

Backend có `context.Database.EnsureCreated()` và seed dữ liệu demo khi start, nên database dev thường sẽ được tạo tự động.

## 3. Chạy backend bằng dotnet

Mở PowerShell mới:

```powershell
cd D:\Web_TroUyTin\Prop-Tech\Prop-Tech\backend
dotnet restore
dotnet run --launch-profile http
```

Khi chạy profile `http`, backend dùng `ASPNETCORE_ENVIRONMENT=Development` và đọc cấu hình từ `appsettings.Development.json`.

Nếu máy báo lỗi HTTPS certificate do `Program.cs` có listen thêm `https://0.0.0.0:5053`, chạy:

```powershell
dotnet dev-certs https --trust
dotnet run --launch-profile http
```

## 4. Kiểm tra backend

Mở Swagger:

```text
http://localhost:5052/swagger
```

Hoặc kiểm tra API public:

```powershell
Invoke-RestMethod http://localhost:5052/api/public/rooms
```

Các URL chính:

```text
Swagger:       http://localhost:5052/swagger
Public rooms:  http://localhost:5052/api/public/rooms
Search rooms:  http://localhost:5052/api/public/rooms/search
SignalR hub:   http://localhost:5052/hubs/notifications
```

## 5. Chạy frontend hoặc mobile trỏ về backend

Frontend Prop-Tech mặc định dùng:

```text
VITE_API_BASE_URL=http://localhost:5052
```

Mobile không nên dùng `localhost` khi chạy trên điện thoại thật. Dùng IP LAN của máy đang chạy backend:

```powershell
$env:EXPO_PUBLIC_API_BASE_URL="http://<IP-LAN-CUA-MAY>:5052"
```

Ví dụ:

```powershell
$env:EXPO_PUBLIC_API_BASE_URL="http://192.168.1.10:5052"
```

## 6. Lưu ý khi dùng Docker Compose full

Hiện tại có điểm chưa đồng bộ:

- `backend\Program.cs` ép backend nghe `http://0.0.0.0:5052`.
- `backend\Dockerfile` expose `8080`.
- `docker-compose.yml` map backend `8080:8080`.
- `frontend\nginx.conf` proxy tới `backend:8080`.

Vì vậy nếu chạy toàn bộ bằng:

```powershell
docker compose up --build
```

backend có thể không truy cập được qua port `8080`. Luồng ổn định hiện tại là:

```powershell
docker compose up -d sqlserver
cd D:\Web_TroUyTin\Prop-Tech\Prop-Tech\backend
dotnet run --launch-profile http
```

Nếu muốn chạy full Docker, cần đồng bộ lại port trong `Program.cs`, `Dockerfile`, `docker-compose.yml` và `frontend\nginx.conf`.

## 7. Lỗi thường gặp

Nếu backend không kết nối được database:

- Kiểm tra container SQL Server: `docker ps --filter "name=apartment_sqlserver"`
- Kiểm tra port `1433`: `Get-NetTCPConnection -LocalPort 1433 -ErrorAction SilentlyContinue`
- Kiểm tra password trong `appsettings.Development.json` là `YourStrong@Passw0rd`.

Nếu port `5052` bị chiếm:

```powershell
Get-NetTCPConnection -LocalPort 5052 -ErrorAction SilentlyContinue
```

Nếu Swagger không mở:

- Đảm bảo chạy bằng `dotnet run --launch-profile http`.
- Kiểm tra console có dòng app đang listen trên `http://0.0.0.0:5052`.

