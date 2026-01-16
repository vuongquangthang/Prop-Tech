# Hướng Dẫn Test Building API

> ⚠️ **IMPORTANT:** Building API endpoints use `/buildings` (NOT `/api/buildings`)  
> BuildingController has `[Route("")]` - empty route prefix

## ✅ Test Results Summary (Completed: 2026-01-16)

| Test | Status | Result |
|------|--------|--------|
| CREATE Building | ✅ Pass | 200 OK, fields: buildingCode, buildingName |
| GET all Buildings | ✅ Pass | 200 OK, Array response, 4 buildings |
| GET Building by ID | ✅ Pass | 200 OK for existing, 404 for non-existent |
| UPDATE Building | ✅ Pass | 200 OK, Name/Address updated, Code unchanged |
| Duplicate Code | ✅ Pass | 500 error when duplicate BuildingCode |
| Missing Fields | ✅ Pass | 400 Bad Request for missing BuildingName |
| RESIDENT Auth | ✅ Pass | 403 Forbidden for non-MANAGER role |
| DELETE Building | ❌ Not Implemented | 405 Method Not Allowed |

---

## 1. Chuẩn Bị

### Start Server
```powershell
cd d:\Prop_Tech\Prop-Tech\backend
dotnet run --urls "http://localhost:5052"
```

### Kiểm tra Swagger UI
Mở trình duyệt: http://localhost:5052/swagger

---

## 2. Đăng Ký User Manager

### Request
```powershell
$registerBody = @{
    PhoneNumber = "0999888777"
    Password = "Manager@123"
    FullName = "Building Manager"
    Role = "MANAGER"
} | ConvertTo-Json

$registerResponse = Invoke-RestMethod `
    -Uri "http://localhost:5052/api/auth/register" `
    -Method POST `
    -Body $registerBody `
    -ContentType "application/json"

# Lưu token và headers
$global:token = $registerResponse.accessToken
$global:headers = @{"Authorization" = "Bearer $global:token"}
Write-Output "Token: $token"
```

### Response Mẫu
```json
{
  "accessToken": "eyJhbGci...",
  "refreshToken": "GxD1u+BI...",
  "tokenType": "Bearer",
  "expiresIn": 3600,
  "user": {
    "id": 5,
    "phoneNumber": "0999888777",
    "role": "MANAGER",
    "status": "active",
    "fullName": "Building Manager"
  }
}
```

---

## 3. Test Building CRUD Operations

### 3.1. CREATE Building

#### Request
```powershell
$headers = @{
    "Authorization" = "Bearer $global:token"
}

$buildingBody = @{
    BuildingCode = "A"
    BuildingName = "Tòa A"
    Address = "123 Đường ABC, Quận 1, TP.HCM"
} | ConvertTo-Json

$building = Invoke-RestMethod `
    -Uri "http://localhost:5052/buildings" `
    -Method POST `
    -Body $buildingBody `
    -ContentType "application/json" `
    -Headers $headers

$building | ConvertTo-Json -Depth 3
```

#### Response Mẫu
```json
{
  "id": 1,
  "buildingCode": "A",
  "buildingName": "Tòa A",
  "address": "123 Đường ABC, Quận 1, TP.HCM",
  "createdAt": "2026-01-16T13:45:00Z"
}
```

### 3.2. GET All Buildings

#### Request
```powershell
$buildings = Invoke-RestMethod `
    -Uri "http://localhost:5052/buildings" `
    -Method GET `
    -Headers $headers

$buildings | ConvertTo-Json -Depth 3
```

#### Response Mẫu
```json
[
  {
    "id": 1,
    "buildingCode": "A",
    "buildingName": "Tòa A",
    "address": "123 Đường ABC, Quận 1, TP.HCM",
    "createdAt": "2026-01-16T13:45:00Z"
  }
]
```

### 3.3. GET Building By ID

#### Request
```powershell
$buildingId = 1

$building = Invoke-RestMethod `
    -Uri "http://localhost:5052/buildings/$buildingId" `
    -Method GET `
    -Headers $headers

$building | ConvertTo-Json -Depth 3
```

### 3.4. UPDATE Building

#### Request
```powershell
$buildingId = 1

$updateBody = @{
    BuildingName = "Tòa A - Đã Sửa"
    Address = "456 Đường XYZ, Quận 2, TP.HCM"
} | ConvertTo-Json

$updatedBuilding = Invoke-RestMethod `
    -Uri "http://localhost:5052/buildings/$buildingId" `
    -Method PUT `
    -Body $updateBody `
    -ContentType "application/json" `
    -Headers $headers

$updatedBuilding | ConvertTo-Json -Depth 3
```

#### Response Mẫu
```json
{
  "id": 1,
  "buildingCode": "A",
  "buildingName": "Tòa A - Đã Sửa",
  "address": "456 Đường XYZ, Quận 2, TP.HCM",
  "createdAt": "2026-01-16T13:45:00Z"
}
```

### 3.5. DELETE Building

> ❌ **NOT IMPLEMENTED:** DELETE endpoint không tồn tại trong BuildingController  
> Calling DELETE /buildings/{id} returns `405 Method Not Allowed`

#### Request (Would be)
```powershell
$buildingId = 1

Invoke-RestMethod `
    -Uri "http://localhost:5052/buildings/$buildingId" `
    -Method DELETE `
    -Headers $headers

Write-Output "Building deleted successfully"
```

**Current Status:** Feature not implemented. Need to add DELETE endpoint to BuildingController.

---

## 4. Test Multiple Buildings

### Tạo nhiều Buildings
```powershell
$buildingsToCreate = @(
    @{ BuildingCode = "A"; BuildingName = "Tòa A"; Address = "123 ABC" },
    @{ BuildingCode = "B"; BuildingName = "Tòa B"; Address = "456 DEF" },
    @{ BuildingCode = "C"; BuildingName = "Tòa C"; Address = "789 GHI" }
)

foreach ($building in $buildingsToCreate) {
    $body = $building | ConvertTo-Json
    
    try {
        $result = Invoke-RestMethod `
            -Uri "http://localhost:5052/buildings" `
            -Method POST `
            -Body $body `
            -ContentType "application/json" `
            -Headers $headers
        
        Write-Output "✓ Created: $($result.buildingName)"
    }
    catch {
        Write-Output "✗ Failed: $($building.BuildingName) - $($_.Exception.Message)"
    }
}
```

---

## 5. Error Cases

### 5.1. Duplicate Building Code
```powershell
# Tạo building code đã tồn tại
$duplicateBody = @{
    BuildingCode = "A"
    BuildingName = "Tòa A Duplicate"
    Address = "999 Test"
} | ConvertTo-Json

try {
    Invoke-RestMethod `
        -Uri "http://localhost:5052/buildings" `
        -Method POST `
        -Body $duplicateBody `
        -ContentType "application/json" `
        -Headers $headers
}
catch {
    Write-Output "Expected Error: $($_.ErrorDetails.Message)"
}
```

**Expected Response:** 400 Bad Request
```json
{
  "message": "Mã tòa nhà 'A' đã tồn tại"
}
```

### 5.2. Missing Required Fields
```powershell
$invalidBody = @{
    BuildingCode = "D"
} | ConvertTo-Json

try {
    Invoke-RestMethod `
        -Uri "http://localhost:5052/buildings" `
        -Method POST `
        -Body $invalidBody `
        -ContentType "application/json" `
        -Headers $headers
}
catch {
    Write-Output "Expected Error: $($_.ErrorDetails.Message)"
}
```

**Expected Response:** 400 Bad Request
```json
{
  "errors": {
    "BuildingName": ["The BuildingName field is required."]
  }
}
```

### 5.3. Unauthorized Access (RESIDENT Role)
```powershell
# Đăng ký user với role RESIDENT
$residentBody = @{
    PhoneNumber = "0888777666"
    Password = "User@123"
    FullName = "Regular User"
    Role = "RESIDENT"
} | ConvertTo-Json

$residentResponse = Invoke-RestMethod `
    -Uri "http://localhost:5052/api/auth/register" `
    -Method POST `
    -Body $residentBody `
    -ContentType "application/json"

$residentToken = $residentResponse.accessToken

# Thử tạo building với RESIDENT token
$residentHeaders = @{
    "Authorization" = "Bearer $residentToken"
}

$testBody = @{
    BuildingCode = "Z"
    BuildingName = "Test Building"
    Address = "Test Address"
} | ConvertTo-Json

try {
    Invoke-RestMethod `
        -Uri "http://localhost:5052/buildings" `
        -Method POST `
        -Body $testBody `
        -ContentType "application/json" `
        -Headers $residentHeaders
}
catch {
    Write-Output "Expected 403 Forbidden: User role không đủ quyền"
}
```

---

## 6. Complete Test Script

```powershell
# ===========================================
# COMPLETE BUILDING API TEST SCRIPT
# ===========================================

Write-Output "=== 1. Register Manager User ==="
$registerBody = @{
    PhoneNumber = "0999888777"
    Password = "Manager@123"
    FullName = "Building Manager"
    Role = "MANAGER"
} | ConvertTo-Json

try {
    $registerResponse = Invoke-RestMethod `
        -Uri "http://localhost:5052/api/auth/register" `
        -Method POST `
        -Body $registerBody `
        -ContentType "application/json"
    
    $token = $registerResponse.accessToken
    $headers = @{ "Authorization" = "Bearer $token" }
    Write-Output "✓ Manager registered successfully"
}
catch {
    Write-Output "✗ Registration failed (user might exist already)"
    # Nếu user đã tồn tại, cần login
    exit
}

Write-Output "`n=== 2. Create Building A ==="
$buildingA = @{
    BuildingCode = "A"
    BuildingName = "Tòa A"
    Address = "123 Đường ABC, Quận 1"
} | ConvertTo-Json

try {
    $resultA = Invoke-RestMethod `
        -Uri "http://localhost:5052/buildings" `
        -Method POST `
        -Body $buildingA `
        -ContentType "application/json" `
        -Headers $headers
    
    Write-Output "✓ Building created: $($resultA.buildingName) (ID: $($resultA.id))"
    $buildingId = $resultA.id
}
catch {
    Write-Output "✗ Failed to create building A"
}

Write-Output "`n=== 3. Get All Buildings ==="
try {
    $buildings = Invoke-RestMethod `
        -Uri "http://localhost:5052/buildings" `
        -Method GET `
        -Headers $headers
    
    Write-Output "✓ Found $($buildings.Count) building(s)"
    $buildings | ForEach-Object {
        Write-Output "  - $($_.buildingCode): $($_.buildingName)"
    }
}
catch {
    Write-Output "✗ Failed to get buildings"
}

Write-Output "`n=== 4. Get Building By ID ==="
try {
    $building = Invoke-RestMethod `
        -Uri "http://localhost:5052/buildings/$buildingId" `
        -Method GET `
        -Headers $headers
    
    Write-Output "✓ Retrieved: $($building.buildingName)"
    Write-Output "  Code: $($building.buildingCode)"
    Write-Output "  Address: $($building.address)"
}
catch {
    Write-Output "✗ Failed to get building by ID"
}

Write-Output "`n=== 5. Update Building ==="
$updateBody = @{
    BuildingName = "Tòa A - Updated"
    Address = "456 Đường XYZ, Quận 2"
} | ConvertTo-Json

try {
    $updated = Invoke-RestMethod `
        -Uri "http://localhost:5052/buildings/$buildingId" `
        -Method PUT `
        -Body $updateBody `
        -ContentType "application/json" `
        -Headers $headers
    
    Write-Output "✓ Building updated: $($updated.buildingName)"
}
catch {
    Write-Output "✗ Failed to update building"
}

Write-Output "`n=== 6. Test Duplicate Code Error ==="
$duplicateBody = @{
    BuildingCode = "A"
    BuildingName = "Tòa A Duplicate"
    Address = "Test"
} | ConvertTo-Json

try {
    Invoke-RestMethod `
        -Uri "http://localhost:5052/buildings" `
        -Method POST `
        -Body $duplicateBody `
        -ContentType "application/json" `
        -Headers $headers
    
    Write-Output "✗ Should have failed with duplicate code!"
}
catch {
    Write-Output "✓ Correctly rejected duplicate building code"
}

Write-Output "`n=== 7. Delete Building ==="
try {
    Invoke-RestMethod `
        -Uri "http://localhost:5052/buildings/$buildingId" `
        -Method DELETE `
        -Headers $headers
    
    Write-Output "✓ Building deleted successfully"
}
catch {
    Write-Output "✗ Failed to delete building"
}

Write-Output "`n=== TEST COMPLETED ==="
```

---

## 7. Verification Checklist

- [ ] Server đang chạy trên port 5052
- [ ] Swagger UI accessible tại http://localhost:5052/swagger
- [ ] Manager user registered thành công
- [ ] CREATE building với BuildingCode và BuildingName
- [ ] GET all buildings trả về danh sách
- [ ] GET building by ID trả về đúng building
- [ ] UPDATE building thay đổi BuildingName và Address
- [ ] DELETE building xóa thành công
- [ ] Duplicate BuildingCode trả về lỗi 400
- [ ] Missing required fields trả về lỗi 400
- [ ] RESIDENT user không thể tạo building (403 Forbidden)

---

## 8. Common Issues

### Issue: Port 5052 already in use
**Solution:**
```powershell
# Kill existing process
Get-Process -Name backend -ErrorAction SilentlyContinue | Stop-Process -Force

# Wait and restart
Start-Sleep -Seconds 2
cd d:\Prop_Tech\Prop-Tech\backend
dotnet run --urls "http://localhost:5052"
```

### Issue: 401 Unauthorized
**Cause:** Token expired hoặc không hợp lệ

**Solution:** Đăng ký/đăng nhập lại để lấy token mới

### Issue: 403 Forbidden
**Cause:** User không có role MANAGER

**Solution:** Đảm bảo user có `"Role": "MANAGER"` khi đăng ký

### Issue: 400 Bad Request - Field names không match
**Cause:** DTO field names sai (Code/Name thay vì BuildingCode/BuildingName)

**Solution:** Đảm bảo JSON body dùng `BuildingCode` và `BuildingName`

---

## 9. Database Verification

```sql
-- Kiểm tra buildings trong database
SELECT 
    id,
    building_code,
    building_name,
    address,
    created_at,
    updated_at
FROM buildings
ORDER BY created_at DESC;

-- Kiểm tra users
SELECT 
    id,
    phone_number,
    full_name,
    role,
    status
FROM users
ORDER BY created_at DESC;
```

---

## 10. Next Steps

Sau khi test Building API thành công:

1. **Test Floor API** - Tạo floors cho building
2. **Test Room API** - Tạo rooms cho floor
3. **Test Full Flow** - Building → Floor → Room → Resident
4. **Integration Tests** - Viết automated tests
5. **Performance Tests** - Test với nhiều concurrent requests
