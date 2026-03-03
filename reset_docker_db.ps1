# Script to reset Docker database and reseed data
Write-Host "🗑️  Resetting Docker Database..." -ForegroundColor Yellow

# Stop backend if running
Write-Host "Stopping any running backend..." -ForegroundColor Gray
Get-Process -Name "dotnet" -ErrorAction SilentlyContinue | Where-Object {$_.Path -like "*backend*"} | Stop-Process -Force

# Stop docker containers
Write-Host "Stopping Docker containers..." -ForegroundColor Gray
docker-compose down

# Remove SQL Server volume to completely reset database
Write-Host "Removing SQL Server volume..." -ForegroundColor Gray
docker volume rm prop-tech_sqldata -ErrorAction SilentlyContinue

# Start containers again
Write-Host "Starting Docker containers..." -ForegroundColor Green
docker-compose up -d

# Wait for SQL Server to be ready
Write-Host "Waiting for SQL Server to start (15 seconds)..." -ForegroundColor Cyan
Start-Sleep -Seconds 15

# Start backend to seed data
Write-Host "Starting backend to seed data..." -ForegroundColor Green
Set-Location backend
Start-Process powershell -ArgumentList "-NoExit", "-Command", "dotnet run"

Write-Host ""
Write-Host "✅ Done! Backend is starting in a new window." -ForegroundColor Green
Write-Host "📋 Check backend console for seed results" -ForegroundColor Yellow
Write-Host ""
Write-Host "Demo accounts:" -ForegroundColor Cyan
Write-Host "  Resident: 0111222333 / 123456" -ForegroundColor White
Write-Host "  Admin:    0123456789 / Admin@123" -ForegroundColor White
Write-Host "  Manager:  0987654321 / Manager@123" -ForegroundColor White
