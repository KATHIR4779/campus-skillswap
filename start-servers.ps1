# Start both frontend and backend servers
Write-Host "Starting Campus SkillSwap..." -ForegroundColor Cyan

# Check if ports are in use and kill processes
Get-Process -Name node -ErrorAction SilentlyContinue | ForEach-Object {
    $ports = Get-NetTCPConnection -OwningProcess $_.Id -ErrorAction SilentlyContinue | Where-Object {$_.LocalPort -in @(3001,5001)}
    if ($ports) {
        Write-Host "Killing process on port $($ports.LocalPort)" -ForegroundColor Yellow
        Stop-Process -Id $_.Id -Force
    }
}

# Start backend
Write-Host "Starting Backend (Port 5001)..." -ForegroundColor Blue
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; npm start"

Start-Sleep -Seconds 2

# Start frontend
Write-Host "Starting Frontend (Port 3001)..." -ForegroundColor Blue
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd .; node server.js"

Write-Host "Servers started! Frontend: http://localhost:3001" -ForegroundColor Green

