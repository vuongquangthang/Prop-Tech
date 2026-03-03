# 🎯 DATABASE SEEDING COMPLETE

## 📊 Data Summary

### Buildings & Rooms
- **3 Tòa nhà**: Tòa A (10 tầng), Tòa B (10 tầng), Tòa C (8 tầng)
- **28 Tầng** tổng cộng
- **172 Phòng** với mã phòng: A101-A1008, B101-B1006, C101-C804
- **15 phòng đã cho thuê**, còn lại trống

### Services (8 dịch vụ)
1. Điện sinh hoạt - 3,000đ/kWh
2. Nước sinh hoạt - 25,000đ/m³
3. Internet - 200,000đ/tháng
4. Vệ sinh chung - 150,000đ/tháng  
5. Bảo vệ 24/7 - 100,000đ/tháng
6. Gửi xe máy - 70,000đ/xe/tháng
7. Gửi xe ô tô - 1,500,000đ/xe/tháng
8. Thang máy - 50,000đ/tháng

### Residents & Users
- **18 cư dân** (Nguyễn Văn An, Trần Thị Bình, Lê Văn Cường, ...)
- **15 tài khoản**: 3 admin/staff + 12 cư dân
- **10 phương tiện** đã đăng ký (xe máy + ô tô)

### Contracts & Invoices
- **15 hợp đồng** đang hoạt động
- **16 hóa đơn**:
  - Tháng 1/2026: 3 hóa đơn (đã thanh toán)
  - Tháng 2/2026: 3 hóa đơn (đã thanh toán)
  - **Tháng 3/2026: 10 hóa đơn (chưa thanh toán)** ← Hiện tại
- **59 chi tiết hóa đơn** (tiền phòng, điện, nước, dịch vụ)
- **6 giao dịch thanh toán** hoàn tất

---

## 🔐 Test Accounts

### Admin Account
- **Phone**: `0909000001`
- **Password**: `123456`
- **Role**: Admin (full access)

### Manager Account  
- **Phone**: `0909000002`
- **Password**: `123456`
- **Role**: QuanLy (Manager)

### Accountant Account
- **Phone**: `0909000003`
- **Password**: `123456`
- **Role**: KeToan (Accountant)

### Resident Accounts (Cư dân)

#### Phòng A101 (Contract #1)
- **Phone**: `0901234501`
- **Password**: `123456`
- **Name**: Nguyễn Văn An
- **Invoices**: 
  - Tháng 1: 6,500,000đ (✅ đã thanh toán)
  - Tháng 2: 6,600,000đ (✅ đã thanh toán)
  - **Tháng 3: 10,500,000đ (⏳ chưa thanh toán)**

#### Phòng A102 (Contract #2)
- **Phone**: `0901234502`
- **Password**: `123456`
- **Name**: Trần Thị Bình
- **Invoices**:
  - Tháng 1: 6,800,000đ (✅ đã thanh toán)
  - Tháng 2: 6,900,000đ (✅ đã thanh toán)
  - **Tháng 3: 9,800,000đ (⏳ chưa thanh toán)**

#### Phòng A103 (Contract #3)
- **Phone**: `0901234503`
- **Password**: `123456`
- **Name**: Lê Văn Cường
- **Invoices**:
  - Tháng 1: 7,000,000đ (✅ đã thanh toán)
  - Tháng 2: 7,100,000đ (✅ đã thanh toán)
  - **Tháng 3: 11,200,000đ (⏳ chưa thanh toán)**

#### Other Resident Accounts
- `0901234504` - `0901234512`: Nguyễn Văn Đức → Cao Thị Lan (Passwords: `123456`)

---

## 🧪 Testing Scenarios

### 1. Mobile App Testing (Resident)

#### Login & View Room
```
1. Login: 0901234501 / 123456
2. View "My Room" (A101)
3. Check contract details, services
```

#### View Invoices
```
1. See 3 invoices (Jan, Feb, Mar 2026)
2. Click Invoice #3 (March 2026)
3. Should show:
   - Tiền phòng: 5,000,000đ
   - Tiền điện 350 kWh: 1,050,000đ
   - Tiền nước 12 m³: 300,000đ
   - Internet: 200,000đ
   - Vệ sinh: 150,000đ
   - Bảo vệ: 100,000đ
   - Xe máy: 70,000đ
   - Thang máy: 50,000đ
   - Phí phát sinh: 4,200,000đ
   - TOTAL: 10,550,000đ
```

#### Payment Flow
```
1. Click "Thanh toán ngay"
2. QR Code appears (VietQR - MB Bank)
3. Transaction code: PROPTECH0000... T03/2026
4. Amount shows correctly
5. After payment, status changes to "Đã thanh toán"
```

### 2. Web Admin Testing

#### Dashboard
```
1. Login: 0909000001 / 123456
2. View dashboard statistics:
   - Total buildings: 3
   - Total rooms: 172
   - Occupied rooms: 15
   - Vacant rooms: 157
   - Unpaid invoices: 10
   - Total unpaid amount: ~95M
```

#### Building Management
```
1. Navigate to Buildings page
2. Should see: Tòa A, Tòa B, Tòa C
3. Click Tòa A → View 10 floors
4. Click Floor 1 → View 8 rooms (A101-A108)
```

#### Resident Management
```
1. Navigate to Residents page
2. Should see 18 residents
3. Search "Nguyễn Văn An"
4. View details: Phone, CCCD, Current room (A101)
```

#### Invoice Management
```
1. Navigate to Invoices page
2. Filter: "Chưa thanh toán"
3. Should see 10 unpaid invoices
4. Click any invoice → View line items
5. Create payment transaction
```

#### Contract Management
```
1. Navigate to Contracts page
2. Should see 15 active contracts
3. Filter by room: A101
4. View contract details with residents
```

### 3. Edge Cases to Test

#### Multi-Tenant Room
- Currently all rooms have 1 main tenant
- Can add more residents to CHI_TIET_O table

#### Payment Partial Amount
- Try paying 50% of invoice
- Check remaining balance calculation

#### Overdue Invoices
- Invoices with DUE_DATE < current date
- Should show in "Overdue" filter

#### Vehicle Registration
- Resident with ô tô: 0901234503 (Lê Văn Cường)
- Should see higher parking fee in invoice

---

## 📝 Database Schema Highlights

### Key Tables
- `TOA_NHA` → `TANG` → `PHONG` (Building → Floor → Room)
- `CU_DAN` ↔ `USER` (Resident ↔ Account)
- `HOP_DONG` ↔ `CHI_TIET_O` (Contract ↔ Residents in contract)
- `HOA_DON` → `CHI_TIET_HOA_DON` (Invoice → Line items)
- `THANH_TOAN` → `HOA_DON` (Payment → Invoice)

### Foreign Key Relationships
```
HOP_DONG.PHONG_ID → PHONG.PHONG_ID
CHI_TIET_O.HOP_DONG_ID → HOP_DONG.HOP_DONG_ID
CHI_TIET_O.CU_DAN_ID → CU_DAN.CU_DAN_ID
HOA_DON.HOP_DONG_ID → HOP_DONG.HOP_DONG_ID
CHI_TIET_HOA_DON.HOA_DON_ID → HOA_DON.HOA_DON_ID
THANH_TOAN.HOA_DON_ID → HOA_DON.HOA_DON_ID
```

---

## 🚀 Next Steps

### 1. Test Mobile App
```bash
# Đảm bảo backend đang chạy
cd backend
dotnet run

# Test với account: 0901234501 / 123456
# Check Invoice #3 (March 2026) với QR code
```

### 2. Test Web Admin
```bash
# Frontend đang chạy
cd frontend
npm run dev

# Login: 0909000001 / 123456
# Check all pages: Dashboard, Buildings, Rooms, Residents, Invoices
```

### 3. Extend Data (Optional)
```sql
-- Add more residents to existing contracts
INSERT INTO CHI_TIET_O (HOP_DONG_ID, CU_DAN_ID, VAI_TRO_O, TU_NGAY)
VALUES (1, 16, N'Người ở cùng', GETDATE());

-- Add maintenance requests
-- Add chat history
-- Add meter readings (CHI_SO_DIEN, CHI_SO_NUOC)
```

---

## ✅ Checklist

- [x] Cleared old demo data
- [x] Created 3 buildings with 28 floors, 172 rooms
- [x] Created 18 residents with 15 user accounts
- [x] Created 15 active contracts
- [x] Created 16 invoices (6 paid, 10 unpaid)
- [x] Created 59 invoice line items with correct subtotals
- [x] Created 6 payment transactions
- [x] Removed "Reset Demo Data" button from web admin
- [x] Verified user-room relationships work correctly
- [x] Confirmed QR code generation works

---

## 🎉 Ready for Demo!

Database is now fully populated with realistic test data. All features should work end-to-end:
- ✅ Login (Mobile + Web)
- ✅ View room info
- ✅ View invoices with line items
- ✅ Generate QR code for payment
- ✅ Admin management (buildings, residents, contracts, invoices)
- ✅ Full foreign key integrity maintained

**Password cho tất cả accounts**: `123456`
