# Script để restart frontend đúng cách
# Sử dụng: .\restart-frontend.ps1

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  RESTARTING FRONTEND" -ForegroundColor Yellow
Write-Host "========================================`n" -ForegroundColor Cyan

# 1. Kill tất cả Node.js processes
Write-Host "1. Đang tắt các Node.js processes cũ..." -ForegroundColor Yellow
Get-Process | Where-Object {$_.ProcessName -eq "node"} | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2
Write-Host "   ✅ Đã tắt" -ForegroundColor Green

# 2. Clear Vite cache (optional)
# Write-Host "`n2. Xóa Vite cache..." -ForegroundColor Yellow
# Remove-Item -Path "frontend/node_modules/.vite" -Recurse -Force -ErrorAction SilentlyContinue
# Write-Host "   ✅ Đã xóa cache" -ForegroundColor Green

# 3. Start frontend
Write-Host "`n2. Đang khởi động frontend..." -ForegroundColor Yellow
Set-Location "d:\Prop_Tech\Prop-Tech\frontend"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run dev"

Write-Host "   ✅ Đã khởi động" -ForegroundColor Green
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Frontend sẽ chạy tại: http://localhost:3000" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Cyan
