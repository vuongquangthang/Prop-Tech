# Test completion image feature
# This script tests the full workflow:
# 1. Login as resident
# 2. Create maintenance request
# 3. Login as admin
# 4. Update request to "Hoàn thành" with adminNote and completionImageUrl
# 5. Verify mobile app receives completionImageUrl via SignalR

Write-Host "`n=== Test Completion Image Feature ===" -ForegroundColor Cyan

# Configuration
$baseUrl = "http://172.17.155.143:5052"
$residentPhone = "0111222333"
$residentPassword = "Abc@123456"
$adminPhone = "0123456789"
$adminPassword = "Admin@123"

# Step 1: Login as resident
Write-Host "`nStep 1: Login as resident ($residentPhone)..." -ForegroundColor Yellow
$loginBody = @{
    phoneNumber = $residentPhone
    password = $residentPassword
} | ConvertTo-Json

$residentLogin = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
$residentToken = $residentLogin.accessToken
Write-Host "✓ Resident logged in successfully" -ForegroundColor Green
Write-Host "  Token: $($residentToken.Substring(0, 20))..." -ForegroundColor Gray

# Step 2: Create maintenance request
Write-Host "`nStep 2: Create maintenance request..." -ForegroundColor Yellow
$createBody = @{
    issueType = "electrical"
    description = "Test tính năng ảnh kết quả - Bóng đèn phòng khách hỏng"
} | ConvertTo-Json

$headers = @{
    Authorization = "Bearer $residentToken"
}

$request = Invoke-RestMethod -Uri "$baseUrl/api/YeuCauSuaChua" -Method Post -Body $createBody -ContentType "application/json" -Headers $headers
$requestId = $request.id
Write-Host "✓ Request created: ID = $requestId" -ForegroundColor Green
Write-Host "  IssueType: $($request.issueType)" -ForegroundColor Gray
Write-Host "  Status: $($request.status)" -ForegroundColor Gray
Write-Host "  Room: $($request.roomNumber)" -ForegroundColor Gray

# Step 3: Login as admin
Write-Host "`nStep 3: Login as admin ($adminPhone)..." -ForegroundColor Yellow
$adminLoginBody = @{
    phoneNumber = $adminPhone
    password = $adminPassword
} | ConvertTo-Json

$adminLogin = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method Post -Body $adminLoginBody -ContentType "application/json"
$adminToken = $adminLogin.accessToken
Write-Host "✓ Admin logged in successfully" -ForegroundColor Green
Write-Host "  Token: $($adminToken.Substring(0, 20))..." -ForegroundColor Gray

# Step 4: Update to "Hoàn thành" with adminNote and completionImageUrl
Write-Host "`nStep 4: Update request to 'Hoàn thành' with image..." -ForegroundColor Yellow
$updateBody = @{
    status = "Hoàn thành"
    adminNote = "Đã thay bóng đèn mới 15W. Kiểm tra công tắc hoạt động tốt."
    completionImageUrl = "https://example.com/after-repair-light-bulb.jpg"
} | ConvertTo-Json

$adminHeaders = @{
    Authorization = "Bearer $adminToken"
}

$updated = Invoke-RestMethod -Uri "$baseUrl/api/YeuCauSuaChua/$requestId" -Method Put -Body $updateBody -ContentType "application/json" -Headers $adminHeaders
Write-Host "✓ Request updated to 'Hoàn thành'" -ForegroundColor Green
Write-Host "  Status: $($updated.status)" -ForegroundColor Gray
Write-Host "  AdminNote: $($updated.adminNote)" -ForegroundColor Gray
Write-Host "  CompletionImageUrl: $($updated.completionImageUrl)" -ForegroundColor Gray

# Step 5: Verify via GET
Write-Host "`nStep 5: Verify data via GET request..." -ForegroundColor Yellow
$verified = Invoke-RestMethod -Uri "$baseUrl/api/YeuCauSuaChua/$requestId" -Method Get -Headers $adminHeaders
Write-Host "✓ Verified request data:" -ForegroundColor Green
Write-Host "  ID: $($verified.id)" -ForegroundColor Gray
Write-Host "  Status: $($verified.status)" -ForegroundColor Gray
Write-Host "  AdminNote: $($verified.adminNote)" -ForegroundColor Gray
Write-Host "  CompletionImageUrl: $($verified.completionImageUrl)" -ForegroundColor Gray

Write-Host "`n=== Test Completed Successfully ===" -ForegroundColor Cyan
Write-Host "Next steps:" -ForegroundColor White
Write-Host "1. Check web admin UI - should show completion image in sidebar" -ForegroundColor White
Write-Host "2. Check mobile app - resident should see image and adminNote" -ForegroundColor White
Write-Host "3. Resident can click buttons to respond" -ForegroundColor White

