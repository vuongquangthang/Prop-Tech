# Script to start backend, frontend and mobile app
# Usage: .\start-all.ps1

$scriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = $scriptRoot
$backendPath = Join-Path $repoRoot "backend"
$frontendPath = Join-Path $repoRoot "frontend"
$mobilePath = Join-Path $repoRoot "mobile"

$backendHttpPort = 5052
$backendHttpsPort = 5053
$frontendPort = 3000
$expoPort = 8081

$pnpmVersion = "7.33.7"
$nodeVersion = "20.19.0"
$ngrokDomain = if ($env:PROPTECH_NGROK_DOMAIN) { $env:PROPTECH_NGROK_DOMAIN } else { "praiseworthy-katlyn-discountable.ngrok-free.dev" }

function Get-EnvValueFromFile {
    param(
        [string]$Path,
        [string]$Key
    )

    if (-not (Test-Path $Path)) {
        return $null
    }

    $line = Get-Content $Path | Where-Object { $_ -match "^\s*$Key=" } | Select-Object -First 1
    if (-not $line) {
        return $null
    }

    return ($line -replace "^\s*$Key=", "").Trim()
}

$apiBaseUrl = if ($env:PROPTECH_API_BASE_URL) {
    $env:PROPTECH_API_BASE_URL
} else {
    (Get-EnvValueFromFile -Path (Join-Path $frontendPath ".env.development") -Key "VITE_API_BASE_URL") ??
    (Get-EnvValueFromFile -Path (Join-Path $frontendPath ".env") -Key "VITE_API_BASE_URL") ??
    "http://localhost:$backendHttpPort"
}

function Stop-PortProcess {
    param([int]$Port)

    Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue | ForEach-Object {
        Write-Host "   Killing process on port $Port (PID: $($_.OwningProcess))" -ForegroundColor Red
        Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue
    }
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  STARTING PROP-TECH SYSTEM" -ForegroundColor Yellow
Write-Host "========================================`n" -ForegroundColor Cyan

# 1. Kill old processes and ports
Write-Host "1. Cleaning up processes and ports..." -ForegroundColor Yellow

# Kill all dotnet processes
Write-Host "   Stopping all .NET processes..." -ForegroundColor Gray
Get-Process -Name dotnet -ErrorAction SilentlyContinue | Where-Object { $_.Path -like "*Prop-Tech*" } | Stop-Process -Force -ErrorAction SilentlyContinue

# Kill ports
Stop-PortProcess -Port $frontendPort
Stop-PortProcess -Port $backendHttpPort
Stop-PortProcess -Port $backendHttpsPort
Stop-PortProcess -Port $expoPort

# Force garbage collection to free resources
Write-Host "   Freeing system resources..." -ForegroundColor Gray
[System.GC]::Collect()
[System.GC]::WaitForPendingFinalizers()

Start-Sleep -Seconds 3
Write-Host "   Cleanup completed" -ForegroundColor Green

# 2. Start Backend
Write-Host "`n2. Starting Backend..." -ForegroundColor Yellow
$backendUrls = "http://0.0.0.0:$backendHttpPort;https://0.0.0.0:$backendHttpsPort"
$backendCommand = "`$env:ASPNETCORE_URLS='$backendUrls'; dotnet run"
Start-Process powershell -WorkingDirectory $backendPath -ArgumentList "-NoExit", "-Command", $backendCommand
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
        $response = Invoke-WebRequest -Uri "http://localhost:$backendHttpPort/swagger/index.html" -TimeoutSec 3 -UseBasicParsing -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            $backendReady = $true
            Write-Host "Backend is ready!" -ForegroundColor Green
        }
    } catch {
        # Backend not ready yet
    }
}

if (-not $backendReady) {
    Write-Host "  Backend timed out, but continuing..." -ForegroundColor Yellow
}

# Wait a bit to let backend stabilize
Start-Sleep -Seconds 2

# 4. Start Ngrok tunnel
Write-Host "`n4. Starting Ngrok tunnel..." -ForegroundColor Yellow
if (Get-Command ngrok -ErrorAction SilentlyContinue) {
    Start-Process ngrok -ArgumentList "http", "--domain=$ngrokDomain", $backendHttpPort
    Write-Host "   Ngrok tunnel starting on $ngrokDomain" -ForegroundColor Green
} elseif (Test-Path "D:\Prop_Tech\Ngrok") {
    Start-Process cmd -ArgumentList "/K", "cd /d D:\Prop_Tech\Ngrok && ngrok http --domain=$ngrokDomain $backendHttpPort"
    Write-Host "   Ngrok tunnel starting on $ngrokDomain" -ForegroundColor Green
} else {
    Write-Host "   Ngrok not found. Skipping tunnel." -ForegroundColor Yellow
}

# 5. Start Frontend
Write-Host "`n5. Starting Frontend..." -ForegroundColor Yellow
Write-Host "   Note: If Frontend fails with thread error, close some programs and try again" -ForegroundColor DarkGray
$frontendCommand = @"
if (Get-Command nvm -ErrorAction SilentlyContinue) { nvm use $nodeVersion | Out-Null }
if (Get-Command corepack -ErrorAction SilentlyContinue) { corepack enable | Out-Null; corepack prepare pnpm@$pnpmVersion --activate | Out-Null }
`$env:VITE_API_BASE_URL='$apiBaseUrl'
if (-not (Test-Path 'node_modules')) { pnpm install }
pnpm run dev
"@
Start-Process powershell -WorkingDirectory $frontendPath -ArgumentList "-NoExit", "-Command", $frontendCommand
Write-Host "   Frontend starting..." -ForegroundColor Green

# Wait for frontend to initialize
Start-Sleep -Seconds 3

# 6. Start Mobile App
Write-Host "`n6. Starting Mobile App (Expo)..." -ForegroundColor Yellow
$mobileCommand = @"
if (Get-Command nvm -ErrorAction SilentlyContinue) { nvm use $nodeVersion | Out-Null }
`$env:EXPO_PUBLIC_API_BASE_URL='$apiBaseUrl'
if (-not (Test-Path 'node_modules')) { npm install }
npm start
"@
Start-Process powershell -WorkingDirectory $mobilePath -ArgumentList "-NoExit", "-Command", $mobileCommand
Write-Host "   Mobile starting..." -ForegroundColor Green

# 7. Summary
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  SYSTEM STARTING UP" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "`nBackend:  http://localhost:$backendHttpPort (HTTP) | https://localhost:$backendHttpsPort (HTTPS)" -ForegroundColor Yellow
Write-Host "API Base: $apiBaseUrl" -ForegroundColor Yellow
Write-Host "Ngrok:    https://$ngrokDomain" -ForegroundColor Yellow
Write-Host "Frontend: http://localhost:$frontendPort" -ForegroundColor Yellow
Write-Host "Mobile:   Check QR code in Mobile terminal" -ForegroundColor Yellow
Write-Host "Swagger:  http://localhost:$backendHttpPort/swagger`n" -ForegroundColor Yellow


Write-Host "`nWaiting 8s to check services status..." -ForegroundColor Gray
Start-Sleep -Seconds 8

# 8. Check status
try {
    $backend = Invoke-WebRequest -Uri "http://localhost:$backendHttpPort/swagger/index.html" -TimeoutSec 5 -UseBasicParsing -ErrorAction SilentlyContinue
    if ($backend.StatusCode -eq 200) {
        Write-Host "  Backend: OK" -ForegroundColor Green
    }
} catch {
    Write-Host "  Backend: Starting..." -ForegroundColor Yellow
}

try {
    $frontend = Invoke-WebRequest -Uri "http://localhost:$frontendPort" -TimeoutSec 5 -UseBasicParsing -ErrorAction SilentlyContinue
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
Write-Host "  - If Mobile fails: Use Node 20 (nvm use 20.19.0) and run npm install in mobile\n" -ForegroundColor Gray