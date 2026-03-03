# Script to start backend, frontend and mobile app
# Usage: .\start-all.ps1

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  STARTING PROP-TECH SYSTEM" -ForegroundColor Yellow
Write-Host "========================================`n" -ForegroundColor Cyan

# 1. Kill old processes and ports
Write-Host "1. Cleaning up processes and ports..." -ForegroundColor Yellow

# Kill port 3000 (Frontend)
Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue | ForEach-Object { 
    Write-Host "   Killing process on port 3000 (PID: $($_.OwningProcess))" -ForegroundColor Red
    Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue 
}

# Kill port 5052 (Backend)
Get-NetTCPConnection -LocalPort 5052 -ErrorAction SilentlyContinue | ForEach-Object { 
    Write-Host "   Killing process on port 5052 (PID: $($_.OwningProcess))" -ForegroundColor Red
    Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue 
}

# Kill port 8081 (Expo)
Get-NetTCPConnection -LocalPort 8081 -ErrorAction SilentlyContinue | ForEach-Object { 
    Write-Host "   Killing process on port 8081 (PID: $($_.OwningProcess))" -ForegroundColor Red
    Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue 
}

Start-Sleep -Seconds 2
Write-Host "   Cleanup completed" -ForegroundColor Green

# 2. Start Backend
Write-Host "`n2. Starting Backend..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'd:\Prop_Tech\Prop-Tech\backend'; dotnet run"
Write-Host "   Backend starting..." -ForegroundColor Green

# 3. Wait for backend to be ready
Write-Host "`n3. Waiting for Backend to be ready..." -ForegroundColor Yellow
$maxAttempts = 8
$attempt = 0
$backendReady = $false

while ($attempt -lt $maxAttempts -and -not $backendReady) {
    $attempt++
    Start-Sleep -Seconds 1
    Write-Host "   Checking backend... attempt $attempt/$maxAttempts" -ForegroundColor Gray
    
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:5052/swagger/index.html" -TimeoutSec 2 -UseBasicParsing -ErrorAction Stop
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

# 4. Start Frontend
Write-Host "`n4. Starting Frontend..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'd:\Prop_Tech\Prop-Tech\frontend'; npm run dev"
Write-Host "   Frontend starting..." -ForegroundColor Green

# 5. Start Mobile App
Write-Host "`n5. Starting Mobile App (Expo)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'd:\Prop_Tech\Prop-Tech\mobile'; npm start"
Write-Host "   Mobile starting..." -ForegroundColor Green

# 6. Summary
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  SYSTEM STARTING UP" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "`nBackend:  http://localhost:5052" -ForegroundColor Yellow
Write-Host "Frontend: http://localhost:3000" -ForegroundColor Yellow
Write-Host "Mobile:   Check QR code in Mobile terminal" -ForegroundColor Yellow
Write-Host "Swagger:  http://localhost:5052/swagger`n" -ForegroundColor Yellow

Write-Host "Demo Accounts:" -ForegroundColor White
Write-Host "  Admin:      0123456789 / Admin@123" -ForegroundColor Magenta
Write-Host "  Manager:    0987654321 / Manager@123" -ForegroundColor Magenta
Write-Host "  Resident:   0909000003 / password123" -ForegroundColor Green
Write-Host "  Accountant: 0444555666 / Accountant@123" -ForegroundColor DarkYellow
Write-Host "  Staff:      0777888999 / Staff@123`n" -ForegroundColor Gray

Write-Host "Waiting 5s to check status..." -ForegroundColor Gray
Start-Sleep -Seconds 5

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
