# 🧪 TEST ACCOUNTS - QUY TRÌNH DEMO

## 📱 Tài khoản cư dân (Mobile App)

### Cư dân 1 - Phòng 101
- **Số điện thoại**: `0111222333`
- **Mật khẩu**: `123456`
- **Họ tên**: Nguyễn Văn A
- **Phòng**: 101 (Tầng 1)
- **Giá thuê**: 8,000,000đ/tháng

### Cư dân 2 - Phòng 201
- **Số điện thoại**: `0222333444`
- **Mật khẩu**: `123456`
- **Họ tên**: Trần Thị B
- **Phòng**: 201 (Tầng 2)
- **Giá thuê**: 7,500,000đ/tháng

### Cư dân 3 - Phòng 301
- **Số điện thoại**: `0333444555`
- **Mật khẩu**: `123456`
- **Họ tên**: Lê Văn C
- **Phòng**: 301 (Tầng 3)
- **Giá thuê**: 9,000,000đ/tháng

---

## 💻 Tài khoản quản lý (Web Admin)

### Admin
- **Số điện thoại**: `0123456789`
- **Mật khẩu**: `Admin@123`
- **Role**: Admin
- **Quyền**: Quản lý toàn bộ hệ thống

### Manager (Dự phòng)
- **Số điện thoại**: `0987654321`
- **Mật khẩu**: `Manager@123`
- **Role**: QuanLy
- **Quyền**: Xử lý sự cố, cập nhật trạng thái

---

## 🔄 QUY TRÌNH TEST REALTIME

### ✅ Bước 1: Setup môi trường
1. **Backend**: Đã chạy ở port 5052 ✅
2. **Web Admin**: Mở trình duyệt, đăng nhập với admin `0123456789 / Admin@123`
3. **Mobile App**: Chuẩn bị 3 máy/tài khoản riêng biệt

### ✅ Bước 2: Test gửi sự cố từ cư dân
**Trên mobile (lần lượt 3 cư dân):**
1. Login với `0111222333 / 123456` (Cư dân 1)
2. Vào màn hình "Báo cáo sự cố"
3. Chọn loại sự cố: Điện, Nước, Thang máy, v.v.
4. Nhập mô tả: "Thang máy tầng 1 không hoạt động"
5. Tap "Gửi yêu cầu" ✅

**Trên web admin (desktop):**
- ✅ Nhận thông báo realtime về sự cố mới
- ✅ Event: `NewMaintenanceRequest`
- ✅ Data: roomCode, issueType, status, createdAt

### ✅ Bước 3: Admin cập nhật trạng thái
**Trên web admin:**
1. Vào danh sách sự cố
2. Chọn sự cố vừa nhận
3. Cập nhật trạng thái: "Chờ xử lý" → "Đang xử lý"
4. Thêm ghi chú: "KTV Hùng đang kiểm tra"
5. Lưu ✅

**Trên mobile (cư dân):**
- ✅ Status tự động cập nhật thành "Đang xử lý"
- ✅ Event: `MaintenanceRequestUpdated`
- ✅ Timeline cập nhật với ghi chú mới

### ✅ Bước 4: Admin báo hoàn thành
**Trên web admin:**
1. Cập nhật trạng thái: "Đang xử lý" → "Hoàn thành"
2. Ghi chú: "Đã sửa xong, thang máy hoạt động bình thường"
3. Lưu ✅

**Trên mobile (cư dân):**
- ✅ Status: "Hoàn thành" (màu xanh lá)
- ✅ Hiện 2 nút: "Yêu cầu sửa lại" | "Hài lòng"

### ✅ Bước 5A: Cư dân hài lòng
**Trên mobile:**
1. Tap "Hài lòng"
2. Xác nhận dialog ✅

**Kết quả:**
- Status → "Đã đóng"
- Không thể sửa lại nữa
- Admin nhận notification: `MaintenanceRequestClosed`

### ✅ Bước 5B: Cư dân không hài lòng
**Trên mobile:**
1. Tap "Yêu cầu sửa lại"
2. Xác nhận dialog ✅

**Kết quả:**
- Status → "Yêu cầu sửa lại" (màu đỏ)
- Admin nhận notification: `MaintenanceRequestUpdated`
- Admin phải xử lý lại từ đầu

---

## 🎯 CHECKLIST TEST HOÀN CHỈNH

### Frontend (Mobile)
- [ ] Login thành công với 3 tài khoản cư dân
- [ ] Gửi sự cố từ 3 phòng khác nhau
- [ ] Xem danh sách sự cố với status badge đúng màu
- [ ] Vào chi tiết sự cố, hiển thị thông tin đúng
- [ ] Timeline cập nhật theo trạng thái
- [ ] Ghi chú admin hiển thị đúng
- [ ] 2 nút "Hài lòng" / "Yêu cầu sửa lại" chỉ hiện khi status = "Hoàn thành"
- [ ] Tap "Hài lòng" → status = "Đã đóng"
- [ ] Tap "Yêu cầu sửa lại" → status = "Yêu cầu sửa lại"

### Backend (API)
- [ ] SignalR Hub kết nối thành công
- [ ] Event `NewMaintenanceRequest` gửi khi tạo mới
- [ ] Event `MaintenanceRequestUpdated` gửi khi update
- [ ] Event `MaintenanceRequestClosed` gửi khi đóng
- [ ] Auto-detect roomId từ contract của user
- [ ] Status "Yêu cầu sửa lại" được xử lý đúng

### Web Admin
- [ ] Login với admin account
- [ ] Nhận thông báo realtime khi có sự cố mới
- [ ] Danh sách sự cố cập nhật realtime
- [ ] Cập nhật trạng thái, mobile nhận update ngay
- [ ] Nhận thông báo khi cư dân yêu cầu sửa lại

---

## 🚀 LƯU Ý QUAN TRỌNG

### Database
- Seed tự động khi restart backend (lần đầu tiên)
- ⚠️ **Nhớ xóa `context.Database.EnsureDeleted()` sau khi seed xong**
- Location: `backend/Program.cs` dòng 210-212

### SignalR
- Connection URL: `http://localhost:5052/notificationHub`
- Cần JWT token trong header: `Authorization: Bearer <token>`
- Keepalive: 15s, Timeout: 60s

### Status Flow
```
Chờ xử lý → Đang xử lý → Hoàn thành → [Hài lòng] → Đã đóng
                              ↓
                        [Yêu cầu sửa lại] → Quay lại xử lý
```

### Màu status badge
- 🟡 **Chờ xử lý**: #FEF3C7 (vàng)
- 🔵 **Đang xử lý**: #DBEAFE (xanh dương)
- 🟢 **Hoàn thành**: #D1FAE5 (xanh lá)
- 🔴 **Yêu cầu sửa lại**: #FEE2E2 (đỏ)
- ⚫ **Đã đóng**: #F3F4F6 (xám)

---

## 🐛 TROUBLESHOOTING

### Mobile không nhận realtime update
```typescript
// Check SignalR connection status
console.log(signalRService.connectionState);
// Reconnect if needed
await signalRService.start();
```

### Web admin không nhận notification
```javascript
// Check browser console for SignalR logs
// Verify JWT token not expired
// Reload page to reconnect
```

### Backend không seed data
```bash
# Check console logs
# Verify database connection
# Manually delete database in Docker:
docker-compose down
docker volume rm prop-tech_sqldata
docker-compose up -d
cd backend
dotnet run
```

---

**✅ Hệ thống sẵn sàng test!**  
Hãy test từng bước theo quy trình trên để verify realtime workflow.