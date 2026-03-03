# Script to start ONLY backend
# Usage: .\start-backend-only.ps1

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  STARTING BACKEND ONLY" -ForegroundColor Yellow
Write-Host "========================================`n" -ForegroundColor Cyan

# Clean up backend processes and ports
Write-Host "1. Cleaning up backend processes..." -ForegroundColor Yellow

Get-Process -Name dotnet -ErrorAction SilentlyContinue | Where-Object { $_.Path -like "*Prop-Tech*" } | Stop-Process -Force -ErrorAction SilentlyContinue

Get-NetTCPConnection -LocalPort 5052 -ErrorAction SilentlyContinue | ForEach-Object { 
    Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue 
}

Get-NetTCPConnection -LocalPort 5053 -ErrorAction SilentlyContinue | ForEach-Object { 
    Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue 
}

Start-Sleep -Seconds 2
Write-Host "   Cleanup completed" -ForegroundColor Green

# Start Backend
Write-Host "`n2. Starting Backend..." -ForegroundColor Yellow
Set-Location "d:\Prop_Tech\Prop-Tech\backend"
dotnet run

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  BACKEND STOPPED" -ForegroundColor Red
Write-Host "========================================`n" -ForegroundColor Cyan
