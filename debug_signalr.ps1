# Debug SignalR Connection

Write-Host ""
Write-Host "=== SignalR Debug Checklist ===" -ForegroundColor Cyan
Write-Host ""

Write-Host "[1] Check if web admin is logged in:" -ForegroundColor Yellow
Write-Host "    - Open http://localhost:3000" -ForegroundColor White
Write-Host "    - Open Console (F12)" -ForegroundColor White
Write-Host "    - Type: localStorage.getItem('token')" -ForegroundColor Gray
Write-Host "    - Should return JWT token (long string)" -ForegroundColor Gray
Write-Host "    - If null, please login to web admin first!" -ForegroundColor Red
Write-Host ""

Write-Host "[2] Check SignalR connection logs:" -ForegroundColor Yellow
Write-Host "    - In Console, look for these logs:" -ForegroundColor White
Write-Host "      ✓ 'SignalR connected successfully'" -ForegroundColor Green
Write-Host "      ✗ 'Error starting SignalR connection'" -ForegroundColor Red
Write-Host ""

Write-Host "[3] Check Network tab for WebSocket:" -ForegroundColor Yellow
Write-Host "    - Go to Network tab in DevTools" -ForegroundColor White
Write-Host "    - Filter: WS (WebSocket)" -ForegroundColor White
Write-Host "    - Should see: hubs/notifications" -ForegroundColor Gray
Write-Host "    - Status: 101 Switching Protocols" -ForegroundColor Green
Write-Host ""

Write-Host "[4] Current backend status:" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:5052/api/buildings" -ErrorAction Stop
    Write-Host "    ✓ Backend is running at http://localhost:5052" -ForegroundColor Green
} catch {
    Write-Host "    ✗ Backend is NOT running!" -ForegroundColor Red
    Write-Host "    Please start backend first: cd backend; dotnet run" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "=== Ready to Test ===" -ForegroundColor Cyan
Write-Host ""

$answer = Read-Host "Is web admin logged in and SignalR connected? (y/n)"

if ($answer -ne "y") {
    Write-Host ""
    Write-Host "Please fix the issues above first, then re-run this script." -ForegroundColor Yellow
    Write-Host ""
    exit 0
}

Write-Host ""
Write-Host "=== Creating Test Maintenance Request ===" -ForegroundColor Cyan
Write-Host ""

# Login as resident
Write-Host "[1] Login as resident (0111222333)..." -ForegroundColor Yellow
$loginBody = '{"phoneNumber":"0111222333","password":"123456"}'
$loginUrl = "http://localhost:5052/api/auth/login"

try {
    $loginResponse = Invoke-RestMethod -Uri $loginUrl -Method POST -ContentType "application/json" -Body $loginBody
    $token = $loginResponse.accessToken
    Write-Host "    SUCCESS - Token received" -ForegroundColor Green
} catch {
    Write-Host "    FAILED: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Create maintenance request
Write-Host ""
Write-Host "[2] Creating maintenance request..." -ForegroundColor Yellow
$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

$timestamp = Get-Date -Format 'HH:mm:ss'
$requestBody = @{
    IssueType = "Dien"
    Description = "Test SignalR at $timestamp"
} | ConvertTo-Json -Depth 3

$createUrl = "http://localhost:5052/api/YeuCauSuaChua"

try {
    $createResponse = Invoke-RestMethod -Uri $createUrl -Method POST -Headers $headers -Body $requestBody
    
    Write-Host "    SUCCESS" -ForegroundColor Green
    Write-Host "    Request ID: $($createResponse.id)" -ForegroundColor Cyan
    Write-Host "    Room: $($createResponse.roomNumber)" -ForegroundColor Cyan
    Write-Host "    Status: $($createResponse.status)" -ForegroundColor Cyan
    
} catch {
    Write-Host "    FAILED: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "=== Check Web Admin Console NOW ===" -ForegroundColor Magenta
Write-Host ""
Write-Host "You should see this log within 1-2 seconds:" -ForegroundColor Yellow
Write-Host "🆕 New maintenance request received: { id: $($createResponse.id), ... }" -ForegroundColor Green
Write-Host ""
Write-Host "Also check:" -ForegroundColor Yellow
Write-Host "- Incidents page: New request should appear" -ForegroundColor White
Write-Host "- Notification bell: Count should increase" -ForegroundColor White
Write-Host ""

$result = Read-Host "Did you see the notification in console? (y/n)"

if ($result -eq "y") {
    Write-Host ""
    Write-Host "✅ SUCCESS! SignalR is working correctly!" -ForegroundColor Green
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "❌ SignalR notification NOT received" -ForegroundColor Red
    Write-Host ""
    Write-Host "Troubleshooting:" -ForegroundColor Yellow
    Write-Host "1. Check Console for any errors" -ForegroundColor White
    Write-Host "2. Verify WebSocket connection in Network tab (WS filter)" -ForegroundColor White
    Write-Host "3. Try refreshing the page (F5)" -ForegroundColor White
    Write-Host "4. Check if token expired (logout and login again)" -ForegroundColor White
    Write-Host ""
}
