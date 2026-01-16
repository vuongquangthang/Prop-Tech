# Docker Deployment Guide

Hướng dẫn triển khai hệ thống quản lý chung cư với Docker.

## Kiến trúc

```
┌─────────────────┐
│   Frontend      │  Port 3001 (React + Nginx)
│   (Container)   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Backend       │  Port 8080 (ASP.NET Core)
│   (Container)   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  SQL Server     │  Port 1433
│   (Container)   │
└─────────────────┘
```

## Yêu cầu

- Docker Desktop 4.0+
- Docker Compose 2.0+
- 4GB RAM trở lên

## Cấu trúc Docker Files

```
Prop-Tech/
├── docker-compose.yml          # Orchestration cho toàn bộ dự án
├── .dockerignore              # Ignore files cho root
├── backend/
│   ├── Dockerfile             # Backend container
│   └── .dockerignore          # Ignore files cho backend
└── frontend/
    ├── Dockerfile             # Frontend container
    ├── nginx.conf             # Nginx configuration
    └── .dockerignore          # Ignore files cho frontend
```

## Các Services

### 1. SQL Server
- **Image**: `mcr.microsoft.com/mssql/server:2022-latest`
- **Port**: 1433
- **Database**: apartment_management
- **Credentials**:
  - Username: `sa`
  - Password: `YourStrong@Passw0rd`

### 2. Backend API
- **Base Image**: `mcr.microsoft.com/dotnet/aspnet:9.0`
- **Port**: 8080
- **Technology**: ASP.NET Core 9.0
- **Database**: SQL Server

### 3. Frontend
- **Base Image**: `nginx:alpine`
- **Port**: 3001
- **Technology**: React + Vite
- **Web Server**: Nginx

## Hướng dẫn sử dụng

### 1. Build và Start toàn bộ hệ thống

```bash
# Từ thư mục root (Prop-Tech)
docker-compose up -d --build
```

Lệnh này sẽ:
- Build images cho backend và frontend
- Pull SQL Server image
- Start tất cả containers
- Tạo network và volumes

### 2. Kiểm tra trạng thái containers

```bash
docker-compose ps
```

Output mong muốn:
```
NAME                    STATUS              PORTS
apartment_backend       Up                  0.0.0.0:8080->8080/tcp
apartment_frontend      Up                  0.0.0.0:3001->3001/tcp
apartment_sqlserver     Up (healthy)        0.0.0.0:1433->1433/tcp
```

### 3. Chạy Database Migrations

Sau khi SQL Server đã sẵn sàng (healthy), chạy migrations:

```bash
# Vào backend container
docker exec -it apartment_backend bash

# Chạy migrations (nếu có EF Core tools)
dotnet ef database update
```

Hoặc chạy từ máy host:

```bash
cd backend
dotnet ef database update
```

### 4. Xem logs

```bash
# Tất cả services
docker-compose logs -f

# Backend only
docker-compose logs -f backend

# Frontend only
docker-compose logs -f frontend

# SQL Server only
docker-compose logs -f sqlserver
```

### 5. Stop hệ thống

```bash
# Stop nhưng giữ volumes
docker-compose down

# Stop và xóa volumes (xóa database)
docker-compose down -v
```

### 6. Restart một service cụ thể

```bash
docker-compose restart backend
docker-compose restart frontend
docker-compose restart sqlserver
```

### 7. Rebuild một service

```bash
# Rebuild backend
docker-compose up -d --build backend

# Rebuild frontend
docker-compose up -d --build frontend
```

## Truy cập ứng dụng

- **Frontend**: http://localhost:3001
- **Backend API**: http://localhost:8080
- **Swagger UI**: http://localhost:8080/swagger
- **SQL Server**: localhost:1433

## Environment Variables

### Backend
Trong `docker-compose.yml`, bạn có thể thay đổi:

```yaml
environment:
  - ConnectionStrings__DefaultConnection=...
  - Jwt__Key=...
  - Jwt__Issuer=...
  - Jwt__Audience=...
```

### SQL Server
```yaml
environment:
  - SA_PASSWORD=YourStrong@Passw0rd  # Thay đổi password
  - MSSQL_PID=Express               # Express/Developer/Standard
```

## Database Management

### Kết nối SQL Server từ host

Sử dụng SQL Server Management Studio (SSMS) hoặc Azure Data Studio:

```
Server: localhost,1433
Authentication: SQL Server Authentication
Username: sa
Password: YourStrong@Passw0rd
```

### Backup Database

```bash
docker exec apartment_sqlserver /opt/mssql-tools18/bin/sqlcmd \
  -S localhost -U sa -P YourStrong@Passw0rd \
  -Q "BACKUP DATABASE apartment_management TO DISK='/var/opt/mssql/backup/apartment_management.bak'"
```

### Restore Database

```bash
docker exec apartment_sqlserver /opt/mssql-tools18/bin/sqlcmd \
  -S localhost -U sa -P YourStrong@Passw0rd \
  -Q "RESTORE DATABASE apartment_management FROM DISK='/var/opt/mssql/backup/apartment_management.bak'"
```

## Troubleshooting

### SQL Server không start

```bash
# Kiểm tra logs
docker logs apartment_sqlserver

# Có thể do RAM không đủ, tăng memory limit:
# Thêm vào service sqlserver trong docker-compose.yml:
deploy:
  resources:
    limits:
      memory: 2G
```

### Backend không connect được SQL Server

```bash
# Kiểm tra SQL Server đã healthy chưa
docker inspect apartment_sqlserver | grep -i health

# Test connection từ backend container
docker exec apartment_backend ping sqlserver
```

### Frontend không gọi được Backend API

Kiểm tra nginx configuration trong `frontend/nginx.conf`:
```nginx
location /api {
    proxy_pass http://backend:8080;
}
```

### Port conflicts

Nếu port đã được sử dụng, thay đổi trong `docker-compose.yml`:

```yaml
ports:
  - "8081:8080"  # Thay 8080 bên trái thành port khác
```

## Performance Optimization

### Build cache

Docker sẽ cache các layers. Để tối ưu:

```dockerfile
# Trong Dockerfile, copy package files trước
COPY package.json package-lock.json ./
RUN npm install
# Sau đó mới copy source code
COPY . .
```

### Multi-stage builds

Cả backend và frontend đều sử dụng multi-stage builds để giảm image size:

- **Backend**: SDK image → Runtime image
- **Frontend**: Node image → Nginx alpine image

### Volumes cho development

Để hot-reload khi develop:

```yaml
# Thêm vào docker-compose.override.yml
version: '3.8'
services:
  backend:
    volumes:
      - ./backend:/app
  frontend:
    volumes:
      - ./frontend/src:/app/src
```

## Production Deployment

### 1. Sử dụng secrets cho passwords

```yaml
secrets:
  db_password:
    file: ./secrets/db_password.txt

services:
  sqlserver:
    secrets:
      - db_password
    environment:
      - SA_PASSWORD_FILE=/run/secrets/db_password
```

### 2. Health checks

Đã được cấu hình cho SQL Server. Thêm cho backend:

```yaml
backend:
  healthcheck:
    test: ["CMD", "curl", "-f", "http://localhost:8080/health"]
    interval: 30s
    timeout: 3s
    retries: 3
```

### 3. Resource limits

```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 512M
```

### 4. Logging

```yaml
services:
  backend:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

## Useful Commands

```bash
# Remove all stopped containers
docker container prune

# Remove unused images
docker image prune -a

# Remove unused volumes
docker volume prune

# View resource usage
docker stats

# Execute SQL query
docker exec apartment_sqlserver /opt/mssql-tools18/bin/sqlcmd \
  -S localhost -U sa -P YourStrong@Passw0rd \
  -Q "SELECT * FROM Users"

# Export database
docker exec apartment_sqlserver /opt/mssql-tools18/bin/sqlcmd \
  -S localhost -U sa -P YourStrong@Passw0rd \
  -Q "BACKUP DATABASE apartment_management TO DISK='/tmp/backup.bak'"
docker cp apartment_sqlserver:/tmp/backup.bak ./backup.bak
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Build and Push
on: [push]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Build images
        run: docker-compose build
      - name: Push to registry
        run: |
          docker tag apartment_backend:latest myregistry/backend:latest
          docker push myregistry/backend:latest
```

## Security Best Practices

1. ✅ Thay đổi SA_PASSWORD trong production
2. ✅ Sử dụng secrets thay vì environment variables
3. ✅ Enable TLS/SSL cho SQL Server
4. ✅ Sử dụng non-root users trong containers
5. ✅ Scan images với tools như Trivy
6. ✅ Keep base images updated

## Support

Nếu gặp vấn đề, kiểm tra:
1. Docker Desktop đang chạy
2. Port không bị conflict
3. Đủ disk space và RAM
4. Logs của từng container
