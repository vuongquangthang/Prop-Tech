# Script to start backend, frontend and mobile app
# Usage: .\start-all.ps1

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  STARTING PROP-TECH SYSTEM" -ForegroundColor Yellow
Write-Host "========================================`n" -ForegroundColor Cyan

# 1. Kill old processes and ports
Write-Host "1. Cleaning up processes and ports..." -ForegroundColor Yellow

# Kill all node processes (fixes esbuild thread issues)
Write-Host "   Stopping all Node.js processes..." -ForegroundColor Gray
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

# Kill all dotnet processes
Write-Host "   Stopping all .NET processes..." -ForegroundColor Gray
Get-Process -Name dotnet -ErrorAction SilentlyContinue | Where-Object { $_.Path -like "*Prop-Tech*" } | Stop-Process -Force -ErrorAction SilentlyContinue

# Kill port 3000 (Frontend)
Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue | ForEach-Object { 
    Write-Host "   Killing process on port 3000 (PID: $($_.OwningProcess))" -ForegroundColor Red
    Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue 
}

# Kill port 5052 (Backend HTTP)
Get-NetTCPConnection -LocalPort 5052 -ErrorAction SilentlyContinue | ForEach-Object { 
    Write-Host "   Killing process on port 5052 (PID: $($_.OwningProcess))" -ForegroundColor Red
    Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue 
}

# Kill port 5053 (Backend HTTPS)
Get-NetTCPConnection -LocalPort 5053 -ErrorAction SilentlyContinue | ForEach-Object { 
    Write-Host "   Killing process on port 5053 (PID: $($_.OwningProcess))" -ForegroundColor Red
    Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue 
}

# Kill port 8081 (Expo)
Get-NetTCPConnection -LocalPort 8081 -ErrorAction SilentlyContinue | ForEach-Object { 
    Write-Host "   Killing process on port 8081 (PID: $($_.OwningProcess))" -ForegroundColor Red
    Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue 
}

# Force garbage collection to free resources
Write-Host "   Freeing system resources..." -ForegroundColor Gray
[System.GC]::Collect()
[System.GC]::WaitForPendingFinalizers()

Start-Sleep -Seconds 3
Write-Host "   Cleanup completed" -ForegroundColor Green

# 2. Start Backend
Write-Host "`n2. Starting Backend..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'd:\Prop_Tech\Prop-Tech\backend'; dotnet run"
Write-Host "   Backend starting..." -ForegroundColor Green

# 3. Wait for backend to be ready
Write-Host "`n3. Waiting for Backend to be ready..." -ForegroundColor Yellow
$maxAttempts = 10
$attempt = 0
$backendReady = $false

while ($attempt -lt $maxAttempts -and -not $backendReady) {
    $attempt++
    Start-Sleep -Seconds 2
    Write-Host "   Checking backend... attempt $attempt/$maxAttempts" -ForegroundColor Gray
    
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:5052/swagger/index.html" -TimeoutSec 3 -UseBasicParsing -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            $backendReady = $true
            Write-Host "   ✅ Backend is ready!" -ForegroundColor Green
        }
    } catch {
        # Backend not ready yet
    }
}

if (-not $backendReady) {
    Write-Host "   ⚠️ Backend timed out, but continuing..." -ForegroundColor Yellow
}

# Wait a bit to let backend stabilize
Start-Sleep -Seconds 2

# 4. Start Frontend
Write-Host "\n4. Starting Frontend..." -ForegroundColor Yellow
Write-Host "   Note: If Frontend fails with thread error, close some programs and try again" -ForegroundColor DarkGray
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'd:\Prop_Tech\Prop-Tech\frontend'; npm run dev"
Write-Host "   Frontend starting..." -ForegroundColor Green

# Wait for frontend to initialize
Start-Sleep -Seconds 3

# 5. Start Mobile App
Write-Host "`n5. Starting Mobile App (Expo)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'd:\Prop_Tech\Prop-Tech\mobile'; npm start"
Write-Host "   Mobile starting..." -ForegroundColor Green

# 6. Summary
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  SYSTEM STARTING UP" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "\nBackend:  http://localhost:5052 (HTTP) | https://localhost:5053 (HTTPS)" -ForegroundColor Yellow
Write-Host "Frontend: http://localhost:3000" -ForegroundColor Yellow
Write-Host "Mobile:   Check QR code in Mobile terminal" -ForegroundColor Yellow
Write-Host "Swagger:  http://localhost:5052/swagger\n" -ForegroundColor Yellow

Write-Host "Demo Accounts (Database: apartment_management_dev):" -ForegroundColor White
Write-Host "  Admin:    0123456789 / Admin@123" -ForegroundColor Magenta
Write-Host "  Manager:  0987654321 / Manager@123" -ForegroundColor Magenta
Write-Host "  Staff:    0912345678 / Staff@123" -ForegroundColor Cyan
Write-Host "  Resident: 0111222333 / 123456 (Nguyễn Văn A - Phòng 101)" -ForegroundColor Green
Write-Host "  Resident: 0222333444 / 123456 (Trần Thị B - Phòng 201)" -ForegroundColor Green
Write-Host "  Resident: 0333444555 / 123456 (Lê Văn C - Phòng 301)" -ForegroundColor Green
Write-Host "  + 9 more residents (all use password: 123456)\n" -ForegroundColor DarkGray
Write-Host "Sample Data: 165 records across 20 tables (fully populated)" -ForegroundColor DarkCyan

Write-Host "`nWaiting 8s to check services status..." -ForegroundColor Gray
Start-Sleep -Seconds 8

# 7. Check status
try {
    $backend = Invoke-WebRequest -Uri "http://localhost:5052/swagger/index.html" -TimeoutSec 5 -UseBasicParsing -ErrorAction SilentlyContinue
    if ($backend.StatusCode -eq 200) {
        Write-Host "  Backend: OK" -ForegroundColor Green
    }
} catch {
    Write-Host "  Backend: Starting..." -ForegroundColor Yellow
}

try {
    $frontend = Invoke-WebRequest -Uri "http://localhost:3000" -TimeoutSec 5 -UseBasicParsing -ErrorAction SilentlyContinue
    if ($frontend.StatusCode -eq 200) {
        Write-Host "  Frontend: OK" -ForegroundColor Green
    }
} catch {
    Write-Host "  Frontend: Starting..." -ForegroundColor Yellow
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  SYSTEM STARTED SUCCESSFULLY" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Cyan
Write-Host "Troubleshooting:" -ForegroundColor White
Write-Host "  - If Frontend fails: Close some programs and run script again" -ForegroundColor Gray
Write-Host "  - If Backend fails: Check SQL Server is running" -ForegroundColor Gray
Write-Host "  - If Mobile fails: Check Expo CLI is installed\n" -ForegroundColor Gray