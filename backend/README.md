# Apartment Management System API

Hệ thống quản lý chung cư được xây dựng với ASP.NET Core 9.0, Entity Framework Core, PostgreSQL và JWT Authentication.

## Tính năng chính

- ✅ Quản lý tài khoản người dùng (MANAGER/RESIDENT)
- ✅ Quản lý tòa nhà, tầng, và phòng
- ✅ Quản lý cư dân và tình trạng cư trú
- ✅ Tạo và quản lý hóa đơn
- ✅ Xử lý thanh toán
- ✅ Quản lý khiếu nại của cư dân
- ✅ JWT Authentication & Authorization
- ✅ Role-based Access Control

## Công nghệ sử dụng

- **Backend**: ASP.NET Core 9.0
- **ORM**: Entity Framework Core 9.0
- **Database**: PostgreSQL
- **Authentication**: JWT Bearer Token
- **Password Hashing**: BCrypt
- **API Documentation**: Swagger/OpenAPI

## Cấu trúc dự án

```
backend/
├── Controllers/         # API Controllers
├── Services/           # Business Logic
├── Repositories/       # Data Access Layer
├── Models/            # Entity Models
├── DTOs/              # Data Transfer Objects
├── Data/              # DbContext
└── Program.cs         # Application Entry Point
```

## Cài đặt

### Yêu cầu

- .NET 9.0 SDK
- SQL Server 2019+ (hoặc SQL Server Express/LocalDB)
- Visual Studio 2022 hoặc VS Code
- Docker Desktop (optional, cho containerized deployment)

### Bước 1: Cài đặt dependencies

```bash
cd backend
dotnet restore
```

### Bước 2: Cấu hình Database

Chỉnh sửa `appsettings.json` hoặc `appsettings.Development.json`:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost,1433;Database=apartment_management;User Id=sa;Password=YourStrong@Passw0rd;TrustServerCertificate=True;MultipleActiveResultSets=true"
  },
  "Jwt": {
    "Key": "YourSuperSecretKeyThatIsAtLeast32CharactersLongForHS256Algorithm",
    "Issuer": "ApartmentManagementAPI",
    "Audience": "ApartmentManagementClient",
    "ExpiryHours": "24"
  }
}
```

### Bước 3: Tạo Migration và Database

```bash
# Cài đặt EF Core CLI tools (nếu chưa có)
dotnet tool install --global dotnet-ef

# Tạo migration đầu tiên
dotnet ef migrations add InitialCreate

# Cập nhật database
dotnet ef database update
```

### Bước 4: Chạy ứng dụng

```bash
dotnet run
```

API sẽ chạy tại: `https://localhost:5001` hoặc `http://localhost:5000`

Swagger UI: `https://localhost:5001/swagger`

## Docker Deployment

### Quick Start với Docker Compose

Từ thư mục root của dự án:

```bash
# Build và start tất cả services (backend + frontend + SQL Server)
docker-compose up -d --build

# Kiểm tra containers
docker-compose ps

# Xem logs
docker-compose logs -f

# Stop services
docker-compose down
```

Sau khi containers chạy:
- Frontend: http://localhost:3001
- Backend API: http://localhost:8080
- Swagger: http://localhost:8080/swagger

Xem chi tiết trong [DOCKER.md](../DOCKER.md)

### Build Backend Docker Image

```bash
cd backend
docker build -t apartment-backend .
docker run -p 8080:8080 apartment-backend
```

## API Endpoints

### Authentication

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/auth/login` | Đăng nhập | None |
| POST | `/auth/change-password` | Đổi mật khẩu | Required |
| POST | `/auth/logout` | Đăng xuất | Required |

### User Management (Admin only)

| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| POST | `/admin/users` | Tạo tài khoản | MANAGER |
| GET | `/admin/users/{id}` | Xem thông tin user | MANAGER |
| PATCH | `/admin/users/{id}/status` | Khóa/mở tài khoản | MANAGER |
| POST | `/admin/users/{id}/reset-password` | Reset mật khẩu | MANAGER |

### Building/Floor/Room Management

| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| GET | `/buildings` | Danh sách tòa nhà | MANAGER |
| POST | `/buildings` | Tạo tòa nhà | MANAGER |
| GET | `/buildings/{id}/floors` | Danh sách tầng | MANAGER |
| POST | `/floors` | Tạo tầng | MANAGER |
| GET | `/floors/{id}/rooms` | Danh sách phòng | MANAGER |
| POST | `/rooms` | Tạo phòng | MANAGER |
| GET | `/rooms/{id}` | Chi tiết phòng | MANAGER |
| PATCH | `/rooms/{id}` | Cập nhật phòng | MANAGER |

### Resident Management

| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| POST | `/residents` | Thêm cư dân | MANAGER |
| GET | `/residents/{id}` | Thông tin cư dân | MANAGER |
| PATCH | `/residents/{id}` | Cập nhật cư dân | MANAGER |
| GET | `/residents/{id}/invoices` | Hóa đơn của cư dân | MANAGER |

### Invoice Management

| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| POST | `/invoices` | Tạo hóa đơn | MANAGER |
| GET | `/invoices/{id}` | Chi tiết hóa đơn | MANAGER |
| PATCH | `/invoices/{id}/status` | Cập nhật trạng thái | MANAGER |
| GET | `/invoices/{id}/payments` | Thanh toán của hóa đơn | MANAGER |

### Payment Management

| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| POST | `/payments` | Tạo thanh toán | MANAGER |
| GET | `/payments/{id}` | Chi tiết thanh toán | MANAGER |

### Complaint Management

| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| POST | `/complaints` | Gửi khiếu nại | All |
| GET | `/complaints/{id}` | Chi tiết khiếu nại | All |
| PATCH | `/complaints/{id}/status` | Cập nhật trạng thái | MANAGER |

## Models & Relationships

### User
- One-to-One với Resident
- Roles: MANAGER, RESIDENT
- Status: ACTIVE, LOCKED

### Building -> Floor -> Room
- One-to-Many cascade relationships
- Room có WaterBillingMethod: PER_PERSON, METER
- Room Status: VACANT, OCCUPIED, INACTIVE

### Resident
- Many-to-One với User và Room
- One-to-Many với Invoice và Complaint

### Invoice
- Many-to-One với Resident và Room
- One-to-Many với Payment
- Status: DRAFT, CONFIRMED, PAID

### Payment
- Many-to-One với Invoice
- Status: SUCCESS, FAILED, PENDING

### Complaint
- Many-to-One với Resident
- Category: ELECTRICITY, WATER, BILLING, OTHERS
- Status: NEW, RECEIVED, IN_PROGRESS, RESOLVED

## Security Features

- JWT Bearer Token Authentication
- Role-based Authorization (MANAGER, RESIDENT)
- BCrypt Password Hashing
- CORS Configuration
- HTTPS Redirection

## Testing với Swagger

1. Mở `https://localhost:5001/swagger`
2. Tạo user MANAGER bằng endpoint `/admin/users` (lần đầu cần seed data)
3. Login tại `/auth/login` để nhận JWT token
4. Click "Authorize" và nhập: `Bearer {your_token}`
5. Test các endpoints khác

## Database Migrations

```bash
# Tạo migration mới
dotnet ef migrations add MigrationName

# Cập nhật databaseSQL Server
- Kiểm tra SQL Server đang chạy
- Kiểm tra connection string trong appsettings.json
- Kiểm tra username/password
- Đảm bảo SQL Server Authentication được enable
- Kiểm tra firewall cho port 1433
dotnet ef database update PreviousMigrationName

# Xóa migration chưa apply
dotnet ef migrations remove
```

## Seeding Data (Optional)

Có thể thêm seed data trong `ApplicationDbContext`:

```csharp
protected override void OnModelCreating(ModelBuilder modelBuilder)
{
    base.OnModelCreating(modelBuilder);
    
    // Seed default admin user
    modelBuilder.Entity<User>().HasData(
        new User
        {
            Id = 1,
            Phone = "0123456789",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("admin123"),
            Role = UserRole.MANAGER,
            Status = UserStatus.ACTIVE
        }
    );
}
```

## Troubleshooting

### Lỗi connection PostgreSQL
- Kiểm tra PostgreSQL đang chạy: `pg_ctl status`
- Kiểm tra connection string trong appsettings.json
- Kiểm tra username/password

### Lỗi JWT Authentication
- Đảm bảo JWT Key đủ dài (>= 32 characters)
- Kiểm tra token format: `Bearer {token}`
- Kiểm tra token chưa hết hạn

### Lỗi Migration
- Xóa folder Migrations và tạo lại từ đầu
- Xóa database và tạo lại: `dotnet ef database drop`

## License

MIT License
