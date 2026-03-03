# Lịch Sử Sửa Lỗi - Login Authentication

## Vấn Đề Ban Đầu

Người dùng không thể đăng nhập với bất kỳ tài khoản nào đã seed vào database.

**Triệu chứng:**
- Tất cả tài khoản (Admin, QuanLy, KeToan, CuDan) đều trả về lỗi: "Số điện thoại hoặc mật khẩu không đúng"
- Mật khẩu được sử dụng: `123456`  
- Số điện thoại đã thử: `0909000001`, `0901234501`, v.v.

## Phân Tích Nguyên Nhân

### 1. Kiểm tra Hash trong Database
```sql
SELECT USER_ID, LEN(MAT_KHAU_HASH), MAT_KHAU_HASH FROM [USER] WHERE USER_ID = 1
-- Kết quả: Hash length = 60, format = $2a$11$...
```
Hash có độ dài đúng (60 ký tự) và format BCrypt hợp lệ.

### 2. Tạo Tool Test BCrypt  
Tạo C# console app để verify hash:
```csharp
string password = "123456";
string existingHash = "$2a$11$bNl/4eHqDxH9RHlLEJQz0OMxfF7vZQJOhjGCOqLp5xLDz3wZ1rKMC";
bool isValid = BCrypt.Net.BCrypt.Verify(password, existingHash);
// Kết quả: FALSE ❌
```

### 3. Root Cause - Hash Không Hợp Lệ
Hash trong `seed_full_data.sql` ban đầu **KHÔNG MATCH** với password "123456".

Hash có thể:
1. Được generate cho một password khác
2. Được copy từ nguồn không rõ
3. Bị corruption trong quá trình tạo

## Giải Pháp  

### 1. Generate Hash Mới Hợp Lệ
Sử dụng BCrypt.Net library để tạo hash đúng:
```csharp
string correctHash = BCrypt.Net.BCrypt.HashPassword("123456", 11);
// Kết quả: $2a$11$QantTJk/Hk.eCmSN0R0.8ueKXdWWb440e1Y/O.ukgxmyUuGVMroJe
```

### 2. Update Database
File: `backend/fix_password_hashes.sql`
```sql
DECLARE @CorrectHash NVARCHAR(500) = '$2a$11$QantTJk/Hk.eCmSN0R0.8ueKXdWWb440e1Y/O.ukgxmyUuGVMroJe';
UPDATE [USER] SET MAT_KHAU_HASH = @CorrectHash;
```

**Lưu ý:** Không dùng PowerShell command line vì `$` sẽ bị interpret như variable!

### 3. Update Seed Script
File: `backend/seed_full_data.sql` (line 236)
```sql
-- OLD (WRONG):
DECLARE @PasswordHash NVARCHAR(500) = '$2a$11$bNl/4eHqDxH9RHlLEJQz0OMxfF7vZQJOhjGCOqLp5xLDz3wZ1rKMC';

-- NEW (CORRECT):
DECLARE @PasswordHash NVARCHAR(500) = '$2a$11$QantTJk/Hk.eCmSN0R0.8ueKXdWWb440e1Y/O.ukgxmyUuGVMroJe';
```

## Kết Quả Sau Khi Fix

✅ **Login thành công** với tất cả tài khoản:

### Admin Account
```
Phone: 0909000001
Password: 123456
Role: Admin
Status: ✓ LOGIN SUCCESS
```

### Resident Account  
```
Phone: 0901234501
Password: 123456
Role: CuDan
Name: Nguyễn Văn An
Status: ✓ LOGIN SUCCESS
```

## Thông Tin Kỹ Thuật

### BCrypt Hash Format
```
$2a$11$QantTJk/Hk.eCmSN0R0.8ueKXdWWb440e1Y/O.ukgxmyUuGVMroJe
│ │  │ └────────────────────────────────────────┬──────────────────┘
│ │  │                                          └─ Hash (31 chars)
│ │  └─────────────────────────────────┬────────── Salt (22 chars)
│ └──────────────────────────────────── Cost Factor (11)
└────────────────────────────────────── Version (2a)
```

- **Total Length:** 60 characters
- **Algorithm:** BCrypt
- **Cost Factor:** 11 (2^11 = 2048 iterations)
- **Library:** BCrypt.Net-Next v4.0.3

### Authentication Flow
```
1. User enters: phone + password
2. AuthService queries USER by phone
3. BCrypt.Verify(plainPassword, storedHash)
   └─ Returns: true ✓ → Generate JWT
4. Return: accessToken + refreshToken
```

## Files Đã Sửa

1. **backend/seed_full_data.sql** (line 236)
   - Updated password hash declaration

2. **backend/fix_password_hashes.sql** (NEW)
   - SQL script to fix existing database

3. **backend/Controllers/AuthController.cs**
   - Removed temporary test endpoint

## Tài Khoản Có Thể Đăng Nhập (Tất cả password: `123456`)

### Staff Accounts
- **Admin:** `0909000001`
- **Quản Lý:** `0909000002`  
- **Kế Toán:** `0909000003`

### Resident Accounts (Cư Dân)
- **A101:** `0901234501` - Nguyễn Văn An
- **A201:** `0901234502` - Trần Thị Bình
- **A301:** `0901234503` - Lê Văn Cường
- **A401:** `0901234504` - Phạm Thị Dung
- **B101:** `0901234505` - Hoàng Văn Em
- **B201:** `0901234506` - Vũ Thị Phương
- **B301:** `0901234507` - Đặng Văn Giang
- **B401:** `0901234508` - Bùi Thị Hoa
- **C101:** `0901234509` - Mai Văn Kiên
- **C201:** `0901234510` - Ngô Thị Lan
- **C301:** `0901234511` - Phan Văn Minh
- **C401:** `0901234512` - Lý Thị Nga

---

**Ngày sửa:** 2026-03-03  
**Thời gian khắc phục:** ~30 phút  
**Status:** ✅ RESOLVED
