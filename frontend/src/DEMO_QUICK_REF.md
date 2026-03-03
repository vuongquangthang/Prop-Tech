---
noteId: "c363a10011e711f1a5c847e79eda9051"
tags: []

---

# 🎯 QUICK DEMO REFERENCE CARD

## 👤 CƯ DÂN DEMO
```
Họ tên: Nguyễn Văn A
SĐT: 0901234567
Căn hộ: A-1205
Tòa: Tòa A
Diện tích: 85 m²
```

## 💰 HÓA ĐƠN HIỆN TẠI
```
Kỳ: 02/2026
Số tiền: 2.450.000đ
Hạn: 30/02/2026
Trạng thái: Chưa thanh toán
```

## 🔄 FLOW DEMO NHANH

### 1️⃣ APP → Báo cáo sự cố (1 phút)
```
1. Click "Báo cáo sự cố"
2. Chọn: Điện ⚡
3. Gõ: "Đèn hành lang tầng 12 không sáng"
4. "Gửi báo cáo"
→ Auto navigate tracking page
```

### 2️⃣ WEB → Xử lý sự cố (1 phút)
```
1. Sidebar: "Quản lý Sự cố"
2. Click sự cố mới nhất
3. Status: "Đang xử lý"
4. Gán: "Nguyễn Văn B"
5. "Lưu thay đổi"
```

### 3️⃣ APP → Check sync (30s)
```
1. Bell icon → Badge tăng
2. Thông báo mới xuất hiện
3. Timeline cập nhật
```

### 4️⃣ APP → Thanh toán (1 phút)
```
1. Dashboard → "Thanh toán ngay"
2. Xem chi tiết
3. "Thanh toán ngay" → QR
4. "🎯 Mô phỏng thanh toán"
5. Success → Auto về Dashboard
```

## ⚠️ TRƯỚC KHI DEMO
```javascript
// Open browser console (F12)
localStorage.clear()
// Refresh page
location.reload()
```

## 🌐 2 TABS CẦN MỞ
```
Tab 1: localhost:5173/resident
Tab 2: localhost:5173/
```

## 🎨 KEY POINTS TO MENTION
```
✅ "Đồng bộ NGAY LẬT TỨC"
✅ "Font Inter nhất quán"
✅ "Design tokens chuẩn"
✅ "Không cần refresh"
✅ "Dữ liệu persistent"
```

## 🚨 NẾU LỖI
```
1. F12 → Console → Check errors
2. localStorage.clear()
3. Refresh both tabs
4. Try again
```

## 📱 APP ROUTES
```
/                            → Platform Selector (TRANG CHỌN)
/resident                    → Home
/resident/incidents          → Incident list
/resident/incidents/create   → Create incident
/resident/incidents/tracking → Track incident
/resident/notifications      → Notifications
/resident/bill-detail        → Bill detail
/resident/payment-qr         → Payment QR
/resident/profile            → Profile
/resident/chat               → AI Chat
```

## 🖥️ WEB ROUTES
```
/                  → Platform Selector (TRANG CHỌN)
/dashboard         → Dashboard
/accounts          → Account management
/incidents         → Incident management
/incidents/:id     → Incident detail
```

## 🚪 CÁCH THOÁT RA VÀ VÀO LẠI

### **Từ App Cư Dân:**
```
Nhấn nút "Thoát" ở bottom navigation (icon LogOut)
→ Hiện confirm dialog
→ OK → Quay về trang chọn platform (/)
```

### **Từ Web Admin:**
```
Nhấn nút "Đăng xuất" ở Topbar (góc phải trên)
→ Hiện confirm dialog
→ OK → Quay về trang chọn platform (/)
```

### **Tại Trang Chọn Platform:**
```
Click "📱 Vào App Cư Dân" → /resident
Click "🖥️ Vào Web Admin" → /dashboard
```

## 💡 MAGIC MOMENTS
```
🎯 Sự cố vừa báo → Xuất hiện ngay web admin
🎯 Admin cập nhật → Thông báo tức thì cho cư dân
🎯 Thanh toán xong → Badge & status thay đổi
🎯 Timeline tự động cập nhật
```

## 📊 DATA FLOW
```
APP (Resident)
    ↓ addIncident()
DataContext
    ↓ localStorage
WEB (Admin)
    ↓ updateStatus()
DataContext
    ↓ addNotification()
APP (Resident) ← Badge update
```

## ⏱️ TIMING
```
Total: 5-7 phút
- Opening: 30s
- App demo: 3 phút
- Web demo: 2 phút
- Sync demo: 1 phút
- Closing: 30s
```

## 🎬 OPENING SCRIPT
> "Xin chào! Hôm nay demo hệ thống quản lý chung cư với đồng bộ real-time giữa app cư dân và web admin!"

## 🎬 CLOSING SCRIPT
> "Tóm lại: Đồng bộ tức thì, design nhất quán, dễ sử dụng cho người già. Cảm ơn!"

---

**REMEMBER:** 
- Nói chậm rõ ràng
- Nhấn mạnh "ĐỒNG BỘ NGAY LẬT TỨC"
- Smile & energy cao!

🚀 GOOD LUCK!