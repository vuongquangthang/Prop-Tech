# 🚀 Quick Start Scripts

Các script PowerShell để quản lý Prop-Tech system dễ dàng.

## 📁 Scripts có sẵn:

### 1. `start-all.ps1` - Khởi động toàn bộ hệ thống

**Sử dụng:**
```powershell
.\start-all.ps1
```

**Chức năng:**
- ✅ Tắt tất cả processes cũ (Node.js, Backend)
- ✅ Start Backend (.NET) trên port 5052
- ✅ Start Frontend (Vite) trên port 3000
- ✅ Kiểm tra status tự động
- ✅ Hiển thị tài khoản demo

---

### 2. `restart-frontend.ps1` - Khởi động lại Frontend

**Sử dụng:**
```powershell
.\restart-frontend.ps1
```

**Chức năng:**
- ✅ Tắt tất cả Node.js processes
- ✅ Start Frontend trên port 3000 (luôn là 3000, không nhảy port)

---

## 🔧 Troubleshooting

### Vấn đề: Port bị chiếm bởi process khác

**Giải pháp 1 - Kill tất cả Node processes:**
```powershell
Get-Process | Where-Object {$_.ProcessName -eq "node"} | Stop-Process -Force
```

**Giải pháp 2 - Tìm process đang dùng port 3000:**
```powershell
netstat -ano | findstr :3000
# Lấy PID ở cột cuối, sau đó:
Stop-Process -Id <PID> -Force
```

**Giải pháp 3 - Dùng script:**
```powershell
.\restart-frontend.ps1
```

---

### Vấn đề: Backend không start

**Kiểm tra:**
```powershell
cd backend
dotnet build
# Nếu có lỗi, sửa rồi chạy:
dotnet run
```

---

### Vấn đề: Frontend lỗi compile

**Xóa cache và node_modules:**
```powershell
cd frontend
Remove-Item -Recurse -Force node_modules\.vite
npm install
npm run dev
```

---

## 📝 Manual Commands

### Start Backend:
```powershell
cd backend
dotnet run
```

### Start Frontend:
```powershell
cd frontend
npm run dev
```

### Build Backend:
```powershell
cd backend
dotnet build
```

### Build Frontend:
```powershell
cd frontend
npm run build
```

---

## 🌐 URLs

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:5052 |
| Swagger | http://localhost:5052/swagger |
| SignalR Hub | http://localhost:5052/hubs/notifications |

---

## 👥 Demo Accounts

| Role | Phone | Password |
|------|-------|----------|
| 👑 Admin | 0123456789 | Admin@123 |
| 👤 Manager | 0987654321 | Manager@123 |
| 🏠 Resident | 0111222333 | Resident@123 |
| 💰 Accountant | 0444555666 | Accountant@123 |
| 🔧 Staff | 0777888999 | Staff@123 |

---

## 💡 Tips

1. **Luôn dùng `.\start-all.ps1`** khi bắt đầu làm việc
2. **Dùng `.\restart-frontend.ps1`** khi chỉ cần restart frontend
3. **Kiểm tra port** bằng: `netstat -ano | findstr :3000`
4. **Xem backend logs** trong terminal backend để debug lỗi API

---

## 🆘 Common Issues

### Issue: "Port 3000 is in use, trying another one..."

❌ **Nguyên nhân:** Có Node.js process cũ vẫn đang chạy

✅ **Giải pháp:**
```powershell
.\restart-frontend.ps1
```

### Issue: "Failed to load resource: 500"

❌ **Nguyên nhân:** Backend chưa chạy hoặc API endpoint sai

✅ **Giải pháp:**
1. Kiểm tra backend: http://localhost:5052/swagger
2. Xem backend terminal có lỗi gì
3. Restart backend nếu cần

### Issue: "Cannot connect to database"

❌ **Nguyên nhân:** Connection string sai hoặc database chưa tạo

✅ **Giải pháp:**
```powershell
cd backend
dotnet ef database update
```

---

**Happy Coding! 🚀**
