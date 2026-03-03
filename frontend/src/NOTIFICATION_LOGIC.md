---
noteId: "c363a10111e711f1a5c847e79eda9051"
tags: []

---

# 🔔 LOGIC THÔNG BÁO HỆ THỐNG

## 📊 KIẾN TRÚC THÔNG BÁO

### **Notification Structure**
```typescript
{
  id: string;              // Mã thông báo (NOTIF001, NOTIF002...)
  type: 'warning' | 'info' | 'payment' | 'incident' | 'success';
  title: string;           // Tiêu đề ngắn gọn
  message: string;         // Nội dung chi tiết
  time: string;            // Thời gian (VD: "Vừa xong", "2 giờ trước")
  isRead: boolean;         // Đã đọc hay chưa
  relatedId?: string;      // ID liên quan (sự cố, hóa đơn...)
  target: 'resident' | 'admin'; // ⭐ QUAN TRỌNG: Thông báo cho ai?
}
```

---

## 🎯 LOGIC PHÂN BIỆT TARGET

### **Rule 1: CƯ DÂN BÁO CÁO SỰ CỐ**
```
📱 APP CƯ DÂN:
User gửi form báo cáo sự cố
    ↓
DataContext.addIncident()
    ↓
1. Tạo Incident mới
2. Tạo Notification với target='admin' ⭐
3. Tạo Activity log

🖥️ WEB ADMIN:
Badge thông báo +1
Badge cư dân không tăng ❌
```

### **Rule 2: ADMIN CẬP NHẬT SỰ CỐ**
```
🖥️ WEB ADMIN:
Admin cập nhật trạng thái sự cố
    ↓
DataContext.updateIncidentStatus()
    ↓
1. Update Incident status
2. Tạo Notification với target='resident' ⭐
3. Tạo Activity log

📱 APP CƯ DÂN:
Badge thông báo +1
Badge admin không tăng ❌
```

### **Rule 3: CƯ DÂN THANH TOÁN HÓA ĐƠN**
```
📱 APP CƯ DÂN:
User thanh toán QR code thành công
    ↓
DataContext.updateBillStatus()
    ↓
1. Update Bill status = 'paid'
2. Tạo Notification với target='resident' ⭐
3. Tạo Activity log

Badge app +1 (thông báo xác nhận thanh toán)
Badge admin không tăng ❌
```

---

## 🔍 FUNCTIONS TRONG DataContext

### **1. Tạo thông báo cho Target cụ thể**
```typescript
addNotification(notification: {
  type: 'warning' | 'info' | 'payment' | 'incident' | 'success';
  title: string;
  message: string;
  relatedId?: string;
  target: 'resident' | 'admin'; // BẮT BUỘC
})
```

### **2. Lấy số thông báo chưa đọc theo Target**
```typescript
getUnreadNotificationCountByTarget(target: 'resident' | 'admin'): number

// VD:
App Resident: getUnreadNotificationCountByTarget('resident') → 3
Web Admin: getUnreadNotificationCountByTarget('admin') → 1
```

### **3. Lấy danh sách thông báo theo Target**
```typescript
getNotificationsByTarget(target: 'resident' | 'admin'): Notification[]

// VD:
App Resident: chỉ hiển thị notifications có target='resident'
Web Admin: chỉ hiển thị notifications có target='admin'
```

### **4. Đánh dấu đã đọc**
```typescript
markNotificationAsRead(id: string): void
markAllNotificationsAsRead(): void  // Đánh dấu TẤT CẢ thông báo
```

---

## 📱 COMPONENT: App Resident

### **ResidentLayout.tsx**
```typescript
const { getUnreadNotificationCountByTarget } = useData();
const unreadCount = getUnreadNotificationCountByTarget('resident');

// Badge chỉ hiển thị thông báo của resident
<Badge count={unreadCount} />
```

### **NotificationList.tsx**
```typescript
const { getNotificationsByTarget } = useData();
const notifications = getNotificationsByTarget('resident');

// Chỉ render thông báo của resident
notifications.map(notif => <NotificationCard {...notif} />)
```

---

## 🖥️ COMPONENT: Web Admin

### **Topbar.tsx**
```typescript
const { getUnreadNotificationCountByTarget } = useData();
const unreadCount = getUnreadNotificationCountByTarget('admin');

// Badge chỉ hiển thị thông báo của admin
{unreadCount > 0 && <RedDot />}
```

### **NotificationPanel.tsx**
```typescript
const { getNotificationsByTarget } = useData();
const adminNotifications = getNotificationsByTarget('admin');

// Panel popup hiển thị thông báo admin
<Panel>
  {adminNotifications.map(notif => <NotificationItem {...notif} />)}
</Panel>
```

---

## 🔄 FLOW DEMO THỰC TẾ

### **Scenario 1: Cư dân báo cáo sự cố**

**Before:**
```
App Badge: 2 (resident notifications)
Web Badge: 1 (admin notifications)
```

**Action: Resident gửi sự cố mới**
```
📱 App: Click "Gửi báo cáo"
→ addIncident() 
→ Tạo notification target='admin'
```

**After:**
```
App Badge: 2 (không đổi) ✅
Web Badge: 2 (+1) ✅
```

---

### **Scenario 2: Admin xử lý sự cố**

**Before:**
```
App Badge: 2 (resident notifications)
Web Badge: 2 (admin notifications)
```

**Action: Admin cập nhật trạng thái**
```
🖥️ Web: Click "Lưu thay đổi"
→ updateIncidentStatus()
→ Tạo notification target='resident'
```

**After:**
```
App Badge: 3 (+1) ✅
Web Badge: 2 (không đổi) ✅
```

---

### **Scenario 3: Resident thanh toán**

**Before:**
```
App Badge: 3 (resident notifications)
Web Badge: 2 (admin notifications)
```

**Action: Resident thanh toán thành công**
```
📱 App: Mô phỏng thanh toán QR
→ updateBillStatus('paid')
→ Tạo notification target='resident'
```

**After:**
```
App Badge: 4 (+1) ✅
Web Badge: 2 (không đổi) ✅
```

---

## ✅ CHECKLIST KHI IMPLEMENT

### **Khi tạo Notification**
```
□ Có field "target" chưa?
□ target đúng với người nhận không?
  - Cư dân gửi → target='admin'
  - Admin gửi → target='resident'
  - System tự động → target='resident' (thường)
□ Message rõ ràng, dễ hiểu?
□ Type phù hợp với nội dung?
```

### **Khi hiển thị Badge**
```
□ Dùng getUnreadNotificationCountByTarget() đúng target?
□ Badge update real-time khi có notification mới?
□ Badge giảm khi user đọc notification?
```

### **Khi hiển thị List**
```
□ Dùng getNotificationsByTarget() đúng target?
□ Filter đúng resident vs admin?
□ Sắp xếp mới nhất lên đầu?
□ Phân biệt rõ read/unread?
```

---

## 🎨 UI/UX GUIDELINES

### **App Resident**
```
✅ Badge màu đỏ (#D32F2F) với số
✅ Notification list: Full screen
✅ Icon phân loại: warning, payment, success...
✅ Border color khác nhau cho read/unread
✅ Click để đánh dấu đã đọc
```

### **Web Admin**
```
✅ Dot đỏ nhỏ góc Bell icon
✅ Notification panel: Popup 420px
✅ Icon + màu sắc nhất quán với app
✅ Click notification → Navigate to related page
✅ Nút "Mark all as read"
```

---

## 🚨 COMMON MISTAKES TO AVOID

### **❌ Sai:**
```typescript
// Không có target → Tất cả users đều nhận
addNotification({ 
  title: 'Sự cố mới', 
  message: '...',
  // missing target ❌
});

// Dùng sai target
// Cư dân báo cáo → tạo notification cho resident ❌
addIncident() {
  addNotification({ target: 'resident' }); // SAI!
}
```

### **✅ Đúng:**
```typescript
// Có target rõ ràng
addNotification({ 
  title: 'Sự cố mới', 
  message: '...',
  target: 'admin' // ✅
});

// Target đúng logic
// Cư dân báo cáo → tạo notification cho admin ✅
addIncident() {
  addNotification({ target: 'admin' }); // ĐÚNG!
}
```

---

## 📊 DATA FLOW DIAGRAM

```
┌─────────────────────────────────────────────────────┐
│                   localStorage                       │
│  {                                                   │
│    notifications: [                                  │
│      { id: 'N1', target: 'resident', isRead: false },│
│      { id: 'N2', target: 'admin', isRead: false },  │
│      { id: 'N3', target: 'resident', isRead: true }, │
│    ]                                                 │
│  }                                                   │
└─────────────────────────────────────────────────────┘
                          │
                          │
        ┌─────────────────┴─────────────────┐
        │                                     │
        ▼                                     ▼
┌────────────────┐                  ┌────────────────┐
│  APP RESIDENT  │                  │   WEB ADMIN    │
│                │                  │                │
│ getBy('resident') → 2 notifications│ getBy('admin') → 1 notification│
│ Badge: 2       │                  │ Badge: 1       │
└────────────────┘                  └────────────────┘
```

---

## 💡 TIPS FOR DEMO

1. **Clear localStorage trước khi demo** để reset về data mẫu
2. **Open 2 tabs song song** để show real-time sync
3. **Nhấn mạnh badge thay đổi** khi chuyển tab
4. **Point vào icon Bell** để audience dễ theo dõi
5. **Nói rõ "Thông báo cho Admin" vs "Thông báo cho Cư dân"**

---

🎯 **KEY TAKEAWAY:** 
Target field là trung tâm của logic thông báo. 
Luôn đảm bảo `target='admin'` hoặc `target='resident'` 
được set đúng khi tạo notification!
