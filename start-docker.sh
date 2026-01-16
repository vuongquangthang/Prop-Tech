#!/bin/bash

# Quick Start Script for Docker Deployment
# Run this script from the root directory

echo "🚀 Starting Apartment Management System with Docker..."
echo ""

# Check if Docker is running
echo "Checking Docker..."
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi
echo "✅ Docker is running"
echo ""

# Stop and remove existing containers
echo "Cleaning up existing containers..."
docker-compose down > /dev/null 2>&1
echo "✅ Cleanup completed"
echo ""

# Build and start all services
echo "Building and starting all services..."
echo "This may take a few minutes on first run..."
docker-compose up -d --build

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ All services started successfully!"
    echo ""
    echo "Waiting for services to be ready..."
    sleep 10
    
    echo ""
    echo "📊 Service Status:"
    docker-compose ps
    
    echo ""
    echo "🌐 Access URLs:"
    echo "   Frontend:  http://localhost:3001"
    echo "   Backend:   http://localhost:8080"
    echo "   Swagger:   http://localhost:8080/swagger"
    echo "   SQL Server: localhost,1433 (sa/YourStrong@Passw0rd)"
    
    echo ""
    echo "📝 Useful Commands:"
    echo "   View logs:        docker-compose logs -f"
    echo "   Stop services:    docker-compose down"
    echo "   Restart service:  docker-compose restart [service-name]"
    echo ""
    
    echo "⚠️  Don't forget to run database migrations:"
    echo "   cd backend"
    echo "   dotnet ef database update"
    echo ""
else
    echo ""
    echo "❌ Failed to start services. Check logs with: docker-compose logs"
    exit 1
fi
