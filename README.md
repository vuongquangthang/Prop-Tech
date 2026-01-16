# Prop-Tech - Apartment Management System

Hệ thống quản lý chung cư toàn diện với ASP.NET Core backend và React frontend.

## 🚀 Quick Start với Docker

### Prerequisites
- Docker Desktop
- 4GB RAM trở lên

### Chạy toàn bộ hệ thống (1 lệnh)

**Windows (PowerShell):**
```powershell
.\start-docker.ps1
```

**Linux/Mac:**
```bash
chmod +x start-docker.sh
./start-docker.sh
```

Hoặc thủ công:
```bash
docker-compose up -d --build
```

### Truy cập ứng dụng

- 🌐 **Frontend**: http://localhost:3001
- 🔧 **Backend API**: http://localhost:8080
- 📚 **Swagger UI**: http://localhost:8080/swagger
- 💾 **SQL Server**: localhost:1433 (sa/YourStrong@Passw0rd)

### Chạy Database Migrations

```bash
cd backend
dotnet ef migrations add InitialCreate
dotnet ef database update
```

## 📋 Công nghệ sử dụng

### Backend
- **Framework**: ASP.NET Core 9.0
- **Database**: SQL Server 2022
- **ORM**: Entity Framework Core 9.0
- **Authentication**: JWT Bearer Token
- **Password Hashing**: BCrypt
- **API Docs**: Swagger/OpenAPI

### Frontend
- **Framework**: React 19
- **Build Tool**: Vite
- **Server**: Nginx (trong production container)

### DevOps
- **Containerization**: Docker & Docker Compose
- **Database Container**: SQL Server 2022 Express
- **Reverse Proxy**: Nginx

## 🏗️ Kiến trúc hệ thống

```
┌─────────────────────────────────────────┐
│           Frontend (React)              │
│         Port: 3001 (Nginx)              │
└───────────────┬─────────────────────────┘
                │ HTTP/REST API
                ▼
┌─────────────────────────────────────────┐
│      Backend (ASP.NET Core 9.0)         │
│            Port: 8080                   │
│  ┌──────────────────────────────────┐   │
│  │  Controllers (REST Endpoints)    │   │
│  └──────────┬───────────────────────┘   │
│             ▼                            │
│  ┌──────────────────────────────────┐   │
│  │  Services (Business Logic)       │   │
│  └──────────┬───────────────────────┘   │
│             ▼                            │
│  ┌──────────────────────────────────┐   │
│  │  Repositories (Data Access)      │   │
│  └──────────┬───────────────────────┘   │
└─────────────┼───────────────────────────┘
              ▼
┌─────────────────────────────────────────┐
│      SQL Server 2022 Express            │
│            Port: 1433                   │
└─────────────────────────────────────────┘
```

## 📁 Cấu trúc dự án

```
Prop-Tech/
├── backend/                 # ASP.NET Core API
│   ├── Controllers/        # API Controllers
│   ├── Services/          # Business Logic Layer
│   ├── Repositories/      # Data Access Layer
│   ├── Models/           # Entity Models
│   ├── DTOs/             # Data Transfer Objects
│   ├── Data/             # DbContext
│   ├── Dockerfile        # Backend container config
│   └── README.md         # Backend documentation
├── frontend/              # React Application
│   ├── src/
│   ├── Dockerfile        # Frontend container config
│   ├── nginx.conf        # Nginx configuration
│   └── README.md
├── docker-compose.yml    # Multi-container orchestration
├── DOCKER.md            # Docker deployment guide
├── start-docker.ps1     # Quick start script (Windows)
└── start-docker.sh      # Quick start script (Linux/Mac)
```

## ✨ Tính năng chính

### Quản lý người dùng
- ✅ Đăng ký/Đăng nhập với JWT
- ✅ Phân quyền vai trò (MANAGER/RESIDENT)
- ✅ Quản lý trạng thái tài khoản
- ✅ Đổi mật khẩu, reset mật khẩu

### Quản lý tòa nhà
- ✅ CRUD tòa nhà
- ✅ Quản lý tầng
- ✅ Quản lý phòng
- ✅ Trạng thái phòng (VACANT/OCCUPIED/INACTIVE)

### Quản lý cư dân
- ✅ Thêm/xóa/sửa cư dân
- ✅ Lịch sử cư trú
- ✅ Liên kết phòng - cư dân

### Quản lý hóa đơn
- ✅ Tạo hóa đơn tự động
- ✅ Theo dõi trạng thái thanh toán
- ✅ Lịch sử hóa đơn

### Quản lý thanh toán
- ✅ Ghi nhận thanh toán
- ✅ Mã giao dịch unique
- ✅ Cập nhật trạng thái hóa đơn

### Quản lý khiếu nại
- ✅ Gửi khiếu nại
- ✅ Phân loại (Điện/Nước/Hóa đơn/Khác)
- ✅ Theo dõi xử lý

## 🔐 Security Features

- JWT Authentication & Authorization
- Role-based Access Control (RBAC)
- BCrypt Password Hashing
- HTTPS/TLS Support
- CORS Configuration
- SQL Injection Prevention (EF Core)

## 📖 Documentation

- [Backend API Documentation](backend/README.md)
- [Docker Deployment Guide](DOCKER.md)
- [Frontend Documentation](frontend/README.md)

## 🛠️ Development

### Setup môi trường local (không dùng Docker)

#### Backend
```bash
cd backend
dotnet restore
dotnet ef migrations add InitialCreate
dotnet ef database update
dotnet run
```

#### Frontend
```bash
cd frontend
npm install
npm run dev
```

### API Endpoints

Xem đầy đủ trong [backend/README.md](backend/README.md) hoặc truy cập Swagger UI.

### Testing

```bash
# Backend tests (khi có)
cd backend
dotnet test

# Frontend tests
cd frontend
npm test
```

## 🐳 Docker Commands

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down

# Rebuild a specific service
docker-compose up -d --build backend

# View running containers
docker-compose ps

# Execute command in container
docker exec -it apartment_backend bash
```

## 📊 Database Schema

### Core Tables
- **Users** - Tài khoản người dùng
- **Buildings** - Tòa nhà
- **Floors** - Tầng
- **Rooms** - Phòng
- **Residents** - Cư dân
- **Invoices** - Hóa đơn
- **Payments** - Thanh toán
- **Complaints** - Khiếu nại

Xem chi tiết relationships trong [backend/README.md](backend/README.md)

## 🔧 Configuration

### Environment Variables

#### Backend (.env hoặc docker-compose.yml)
```env
ASPNETCORE_ENVIRONMENT=Production
ConnectionStrings__DefaultConnection=Server=sqlserver;Database=apartment_management;...
Jwt__Key=YourSecretKey
Jwt__Issuer=ApartmentManagementAPI
Jwt__Audience=ApartmentManagementClient
```

#### Frontend
```env
VITE_API_BASE_URL=http://localhost:8080
```

## 🚨 Troubleshooting

### Docker containers không start
```bash
# Kiểm tra logs
docker-compose logs

# Restart containers
docker-compose restart

# Rebuild từ đầu
docker-compose down -v
docker-compose up -d --build
```

### SQL Server connection issues
- Kiểm tra SQL Server đã healthy: `docker-compose ps`
- Kiểm tra connection string
- Đảm bảo đủ RAM (tối thiểu 2GB cho SQL Server)

### Port conflicts
Thay đổi ports trong `docker-compose.yml`:
```yaml
ports:
  - "8081:8080"  # Backend
  - "3002:3001"  # Frontend
```

## 📝 License

MIT License

## 👥 Contributors

- Backend API - ASP.NET Core
- Frontend - React + Vite
- DevOps - Docker

## 📞 Support

Nếu gặp vấn đề:
1. Kiểm tra [DOCKER.md](DOCKER.md) cho Docker issues
2. Kiểm tra [backend/README.md](backend/README.md) cho API issues
3. Xem logs: `docker-compose logs -f`
