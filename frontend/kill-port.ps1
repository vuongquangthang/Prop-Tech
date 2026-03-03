# Script chỉ kill port 3000 (Frontend)
Write-Host "🔥 Killing processes on port 3000..." -ForegroundColor Yellow

Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue | ForEach-Object { 
    Write-Host "   Killing PID: $($_.OwningProcess)" -ForegroundColor Red
    Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue 
}

Write-Host "✅ Port 3000 is now free" -ForegroundColor Green
