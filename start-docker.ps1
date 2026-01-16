# Quick Start Script for Docker Deployment
# Run this script from the root directory

Write-Host "🚀 Starting Apartment Management System with Docker..." -ForegroundColor Green
Write-Host ""

# Check if Docker is running
Write-Host "Checking Docker..." -ForegroundColor Yellow
$dockerRunning = docker info 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Docker is not running. Please start Docker Desktop first." -ForegroundColor Red
    exit 1
}
Write-Host "✅ Docker is running" -ForegroundColor Green
Write-Host ""

# Stop and remove existing containers
Write-Host "Cleaning up existing containers..." -ForegroundColor Yellow
docker-compose down 2>&1 | Out-Null
Write-Host "✅ Cleanup completed" -ForegroundColor Green
Write-Host ""

# Build and start all services
Write-Host "Building and starting all services..." -ForegroundColor Yellow
Write-Host "This may take a few minutes on first run..." -ForegroundColor Cyan
docker-compose up -d --build

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ All services started successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Waiting for services to be ready..." -ForegroundColor Yellow
    Start-Sleep -Seconds 10
    
    Write-Host ""
    Write-Host "📊 Service Status:" -ForegroundColor Cyan
    docker-compose ps
    
    Write-Host ""
    Write-Host "🌐 Access URLs:" -ForegroundColor Cyan
    Write-Host "   Frontend:  http://localhost:3001" -ForegroundColor White
    Write-Host "   Backend:   http://localhost:8080" -ForegroundColor White
    Write-Host "   Swagger:   http://localhost:8080/swagger" -ForegroundColor White
    Write-Host "   SQL Server: localhost,1433 (sa/YourStrong@Passw0rd)" -ForegroundColor White
    
    Write-Host ""
    Write-Host "📝 Useful Commands:" -ForegroundColor Cyan
    Write-Host "   View logs:        docker-compose logs -f" -ForegroundColor White
    Write-Host "   Stop services:    docker-compose down" -ForegroundColor White
    Write-Host "   Restart service:  docker-compose restart [service-name]" -ForegroundColor White
    Write-Host ""
    
    Write-Host "⚠️  Don't forget to run database migrations:" -ForegroundColor Yellow
    Write-Host "   cd backend" -ForegroundColor White
    Write-Host "   dotnet ef database update" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "❌ Failed to start services. Check logs with: docker-compose logs" -ForegroundColor Red
    exit 1
}
