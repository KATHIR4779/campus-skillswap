# Check if MongoDB is running and accessible
Write-Host "Checking MongoDB Status..." -ForegroundColor Cyan
Write-Host ""

# Check if MongoDB is installed
try {
    $mongoVersion = mongod --version 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ MongoDB is installed" -ForegroundColor Green
        $mongoVersion -match "db version v(\d+\.\d+\.\d+)"
        if ($matches) {
            Write-Host "   Version: $($matches[1])" -ForegroundColor Gray
        }
    }
} catch {
    Write-Host "❌ MongoDB is not installed or not in PATH" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please install MongoDB:" -ForegroundColor Yellow
    Write-Host "1. Download: https://www.mongodb.com/try/download/community" -ForegroundColor White
    Write-Host "2. Or use MongoDB Atlas (free cloud): https://www.mongodb.com/cloud/atlas" -ForegroundColor White
    exit
}

Write-Host ""

# Try to connect to MongoDB
Write-Host "Checking MongoDB connection..." -ForegroundColor Yellow
try {
    $mongoCheck = mongosh --eval "db.adminCommand('ping')" --quiet 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ MongoDB is running and accessible" -ForegroundColor Green
    } else {
        Write-Host "⚠️  MongoDB connection failed" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Start MongoDB with one of these methods:" -ForegroundColor Yellow
        Write-Host "1. As Windows Service: net start MongoDB" -ForegroundColor White
        Write-Host "2. Or manually: mongod" -ForegroundColor White
        Write-Host "3. Or install as Windows Service during MongoDB setup" -ForegroundColor White
    }
} catch {
    Write-Host "⚠️  Could not check MongoDB connection" -ForegroundColor Yellow
    Write-Host "   Make sure MongoDB is installed and running" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "MongoDB default connection string:" -ForegroundColor Gray
Write-Host "   mongodb://localhost:27017" -ForegroundColor White

