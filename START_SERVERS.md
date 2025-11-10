# Starting the Campus SkillSwap Application

## Quick Start

### Option 1: Double-click `start-servers.bat`
This is the easiest method for Windows users.

### Option 2: Run PowerShell Script
```powershell
.\start-servers.ps1
```

### Option 3: Manual Start

**Terminal 1 - Backend:**
```powershell
cd backend
npm start
```

**Terminal 2 - Frontend:**
```powershell
node server.js
```

## Application URLs

- **Frontend**: http://localhost:3001
- **Backend API**: http://localhost:5001

## What the Startup Script Does

1. **Kills any existing processes** on ports 3001 and 5001
2. **Starts the backend server** (port 5001) in a new PowerShell window
3. **Starts the frontend server** (port 3001) in a new PowerShell window
4. **Displays the URLs** for accessing the application

## Requirements

- Node.js installed
- MongoDB running locally (default: `mongodb://localhost:27017`)
- Backend dependencies installed (`cd backend && npm install`)

## MongoDB Setup

### Check if MongoDB is Running
```powershell
.\check-mongodb.ps1
```

### Install MongoDB (if not installed)

**Option 1: MongoDB Community Server (Local)**
1. Download: https://www.mongodb.com/try/download/community
2. Run the installer
3. Choose "Complete" installation
4. ✅ **Important**: Check "Install MongoDB as a Service" so it starts automatically

**Option 2: MongoDB Atlas (Cloud - Recommended for beginners)**
1. Sign up: https://www.mongodb.com/cloud/atlas
2. Create a free cluster
3. Get your connection string
4. Update `backend\.env` with: `MONGODB_URI=your-atlas-connection-string`

### Start MongoDB

**If installed as Windows Service:**
```powershell
net start MongoDB
```

**If not installed as service:**
```powershell
mongod
```

### Stop MongoDB

**If installed as Windows Service:**
```powershell
net stop MongoDB
```

## Stopping the Servers

- Close the PowerShell windows where the servers are running
- Or press `Ctrl+C` in each server window

## Troubleshooting

### Port Already in Use
The startup script automatically kills existing processes. If you still get port errors, manually kill them:
```powershell
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force
```

### Backend Not Starting
1. Check if MongoDB is running: `mongod`
2. Verify the `.env` file exists in the `backend` folder
3. Check the backend window for error messages

### Frontend Not Starting
1. Make sure you're in the project root directory
2. Verify `server.js` exists in the root

## Development Tips

- Keep both server windows visible to see logs
- Frontend changes require a page refresh
- Backend changes require a server restart (unless using nodemon)
