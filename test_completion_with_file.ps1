# Test completion image upload workflow
$baseUrl = "http://172.17.155.143:5052"
$imagePath = "test_completion.jpg"

Write-Host ""
Write-Host "=== TEST: COMPLETION IMAGE UPLOAD WORKFLOW ===" -ForegroundColor Cyan

# Step 1: Admin login
Write-Host ""
Write-Host "[1] Admin login..." -ForegroundColor Yellow
$adminLogin = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method Post -ContentType "application/json" -Body (@{
    phoneNumber = "0123456789"
    password = "Admin@123"
} | ConvertTo-Json)

$adminToken = $adminLogin.accessToken
$headers = @{ "Authorization" = "Bearer $adminToken" }

Write-Host "✓ Admin logged in" -ForegroundColor Green

# Step 2: Get pending requests
Write-Host ""
Write-Host "[2] Getting pending maintenance requests..." -ForegroundColor Yellow
$requests = Invoke-RestMethod -Uri "$baseUrl/api/YeuCauSuaChua" -Headers $headers

if ($requests.Count -eq 0) {
    Write-Host "✗ No pending requests. Create one first from mobile app." -ForegroundColor Red
    exit 1
}

$pendingRequest = $requests | Where-Object { $_.status -eq "Đang xử lý" } | Select-Object -First 1

if (!$pendingRequest) {
    Write-Host "✗ No 'Đang xử lý' request found. Update one to 'Đang xử lý' first." -ForegroundColor Red
    exit 1
}

Write-Host "✓ Found request ID: $($pendingRequest.id) - Room: $($pendingRequest.roomNumber)" -ForegroundColor Green

# Step 3: Upload completion image
Write-Host ""
Write-Host "[3] Uploading completion image..." -ForegroundColor Yellow

# Create multipart form data
$boundary = [System.Guid]::NewGuid().ToString()
$fileBytes = [System.IO.File]::ReadAllBytes($imagePath)
$encoding = [System.Text.Encoding]::ASCII

$bodyLines = @(
    "--$boundary",
    "Content-Disposition: form-data; name=`"file`"; filename=`"completion.jpg`"",
    "Content-Type: image/jpeg",
    "",
    [System.Text.Encoding]::GetEncoding("iso-8859-1").GetString($fileBytes),
    "--$boundary--"
)

$body = $bodyLines -join "`r`n"

try {
    $uploadResult = Invoke-RestMethod -Uri "$baseUrl/api/File/upload" `
        -Method Post `
        -Headers @{ 
            "Authorization" = "Bearer $adminToken"
            "Content-Type" = "multipart/form-data; boundary=$boundary"
        } `
        -Body $body

    $imageUrl = $uploadResult.url
    Write-Host "✓ Image uploaded: $imageUrl" -ForegroundColor Green
} catch {
    Write-Host "✗ Upload failed: $_" -ForegroundColor Red
    Write-Host $_.Exception.Message
    exit 1
}

# Step 4: Complete request with image
Write-Host ""
Write-Host "[4] Completing request with image..." -ForegroundColor Yellow

try {
    $updateResult = Invoke-RestMethod -Uri "$baseUrl/api/YeuCauSuaChua/$($pendingRequest.id)/close" `
        -Method Post `
        -Headers $headers `
        -ContentType "application/json" `
        -Body (@{
            status = "Hoàn thành"
            adminNote = "Đã sửa xong. Vui lòng kiểm tra ảnh kết quả."
            completionImageUrl = $imageUrl
        } | ConvertTo-Json)

    Write-Host "✓ Request completed with image" -ForegroundColor Green
    Write-Host "  Admin note: $($updateResult.adminNote)" -ForegroundColor Gray
    Write-Host "  Image URL: $($updateResult.completionImageUrl)" -ForegroundColor Gray
} catch {
    Write-Host "✗ Failed to complete request: $_" -ForegroundColor Red
    Write-Host $_.Exception.Message
    exit 1
}

# Step 5: Resident login
Write-Host ""
Write-Host "[5] Resident login..." -ForegroundColor Yellow
$residentLogin = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method Post -ContentType "application/json" -Body (@{
    phoneNumber = "0111222333"
    password = "123456"
} | ConvertTo-Json)

$residentToken = $residentLogin.accessToken
$residentHeaders = @{ "Authorization" = "Bearer $residentToken" }

Write-Host "✓ Resident logged in" -ForegroundColor Green

# Step 6: Get request detail (resident view)
Write-Host ""
Write-Host "[6] Resident viewing completion result..." -ForegroundColor Yellow

$residentView = Invoke-RestMethod -Uri "$baseUrl/api/YeuCauSuaChua/$($pendingRequest.id)" -Headers $residentHeaders

Write-Host "✓ Request details retrieved" -ForegroundColor Green
Write-Host "  Status: $($residentView.status)" -ForegroundColor Gray
Write-Host "  Admin note: $($residentView.adminNote)" -ForegroundColor Gray
Write-Host "  Completion image: $($residentView.completionImageUrl)" -ForegroundColor Gray

if ($residentView.completionImageUrl) {
    Write-Host ""
    Write-Host "✓ SUCCESS: Completion image workflow working!" -ForegroundColor Green
    Write-Host "  Image can be accessed at: $baseUrl$($residentView.completionImageUrl)" -ForegroundColor Cyan
} else {
    Write-Host ""
    Write-Host "✗ FAILED: No completion image in response" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== TEST COMPLETE ===" -ForegroundColor Cyan
Write-Host ""
