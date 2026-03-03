# Script to start ONLY frontend
# Usage: .\start-frontend-only.ps1

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  STARTING FRONTEND ONLY" -ForegroundColor Yellow
Write-Host "========================================`n" -ForegroundColor Cyan

# Clean up frontend processes and ports
Write-Host "1. Cleaning up frontend processes..." -ForegroundColor Yellow

# Kill all node processes
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue | ForEach-Object { 
    Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue 
}

# Force garbage collection
Write-Host "   Freeing system resources..." -ForegroundColor Gray
[System.GC]::Collect()
[System.GC]::WaitForPendingFinalizers()

Start-Sleep -Seconds 3
Write-Host "   Cleanup completed" -ForegroundColor Green

# Start Frontend
Write-Host "`n2. Starting Frontend..." -ForegroundColor Yellow
Write-Host "   Note: If you get thread error, close some programs first" -ForegroundColor DarkGray
Set-Location "d:\Prop_Tech\Prop-Tech\frontend"
npm run dev

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  FRONTEND STOPPED" -ForegroundColor Red
Write-Host "========================================`n" -ForegroundColor Cyan
