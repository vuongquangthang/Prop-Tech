# Hướng Dẫn Khắc Phục Lỗi Frontend

## Lỗi: "runtime: failed to create new OS thread"

### Nguyên nhân:
Windows không thể tạo thêm thread cho esbuild (Vite sử dụng esbuild để build). Lỗi này xảy ra khi:
- Quá nhiều process/thread đang chạy
- Thiếu tài nguyên hệ thống (RAM, handles)
- Antivirus/Windows Defender đang block

### Giải pháp:

#### 1. Thử lại với script đã cải thiện:
```powershell
.\start-all.ps1
```

Script mới đã được cải thiện:
- Dọn dẹp kỹ hơn tất cả node processes
- Giải phóng bộ nhớ trước khi start
- Delay giữa các service

#### 2. Nếu vẫn lỗi, chạy từng service riêng:

**Bước 1 - Start Backend:**
```powershell
.\start-backend-only.ps1
```
Chờ backend sẵn sàng (http://localhost:5052/swagger)

**Bước 2 - Start Frontend (terminal mới):**
```powershell
.\start-frontend-only.ps1
```

**Bước 3 - Start Mobile (terminal mới):**
```powershell
cd mobile
npm start
```

#### 3. Giảm tài nguyên hệ thống:

**Đóng các ứng dụng không cần thiết:**
- Chrome tabs
- Visual Studio Code (giữ lại 1 instance)
- Docker Desktop (nếu không dùng)
- Slack, Teams
- Background apps

**Kiểm tra Task Manager:**
```
Ctrl + Shift + Esc → Performance
```
Nếu RAM > 90%, cần đóng thêm apps

#### 4. Tăng giới hạn Windows:

**Tăng Virtual Memory:**
```
Settings → System → About → Advanced system settings 
→ Advanced → Performance Settings → Advanced 
→ Virtual memory → Change → Custom size:
  Initial: 8000 MB
  Maximum: 16000 MB
```

**Disable Windows Defender tạm thời:**
```
Windows Security → Virus & threat protection 
→ Manage settings → Real-time protection: OFF
```
Nhớ bật lại sau khi dev xong!

#### 5. Sử dụng WSL2 (khuyến nghị):

```bash
# Install WSL2
wsl --install

# Clone project vào WSL
cd ~
git clone <repo-url>

# Run từ WSL
cd Prop-Tech
./start-all.sh
```

WSL2 không bị giới hạn thread như Windows native.

#### 6. Alternative: Dùng npm thay vì pnpm/yarn

Nếu đang dùng pnpm hoặc yarn, thử đổi sang npm:
```powershell
cd frontend
rm -rf node_modules
rm pnpm-lock.yaml  # hoặc yarn.lock
npm install
npm run dev
```

#### 7. Rollback Vite version (last resort):

```powershell
cd frontend
npm install vite@4.5.0 --save-dev
npm run dev
```

### Kiểm tra xem đã fix chưa:

```powershell
# Sau khi start frontend, check:
curl http://localhost:3000
# Nếu có response → OK!
```

### Debug thêm:

**Xem số thread đang dùng:**
```powershell
(Get-Process).Threads.Count | Measure-Object -Sum
# Nếu > 5000 threads → quá nhiều, cần restart máy
```

**Restart Windows (nếu cần):**
Đôi khi Windows handle leak, restart là cách duy nhất.

### Contact & Support:

Nếu vẫn gặp vấn đề sau khi thử tất cả các cách trên, báo team với thông tin:
- Windows version: `winver`
- RAM available: Task Manager → Performance
- Node version: `node --version`
- Error log đầy đủ

---

**LƯU Ý:** Script start-all.ps1 đã được cập nhật để handle vấn đề này tốt hơn. Thử chạy lại trước!
