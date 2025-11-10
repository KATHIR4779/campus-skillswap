# Campus SkillSwap Backend Setup Guide

This guide will walk you through setting up the Campus SkillSwap backend API from scratch.

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18.0.0 or higher) - [Download here](https://nodejs.org/)
- **npm** (v8.0.0 or higher) - Comes with Node.js
- **MongoDB** (v4.4 or higher) - [Download here](https://www.mongodb.com/try/download/community)
- **Git** - [Download here](https://git-scm.com/)

### Optional but Recommended:
- **MongoDB Compass** - GUI for MongoDB
- **Postman** - API testing tool
- **VS Code** - Code editor with helpful extensions

## 🚀 Quick Start

### 1. Clone and Install

```bash
# Clone the repository (if not already done)
git clone <repository-url>
cd campus-skillswap/backend

# Install dependencies
npm install
```

### 2. Environment Setup

```bash
# Copy environment template
cp env.example .env
```

Edit the `.env` file with your configuration:

```env
# Server Configuration
PORT=5000
NODE_ENV=development
HOST=localhost

# Database (Local MongoDB)
MONGODB_URI=mongodb://localhost:27017/campus_skillswap

# JWT Configuration (Generate a strong secret)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=1h

# Email Configuration (Gmail example)
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM="Campus SkillSwap" <your-email@gmail.com>

# Frontend URL
FRONTEND_URL=http://localhost:3000
CORS_ORIGIN=http://localhost:3000,http://127.0.0.1:5500

# Admin Configuration
ADMIN_EMAIL=admin@campusskillswap.com
ADMIN_PASSWORD=admin123456

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# File Upload
MAX_FILE_SIZE=5242880
```

### 3. Database Setup

```bash
# Start MongoDB (if not running)
# On Windows: net start MongoDB
# On macOS: brew services start mongodb-community
# On Linux: sudo systemctl start mongod

# Run database migration
npm run migrate

# Seed sample data (optional)
npm run seed
```

### 4. Start the Server

```bash
# Development mode (with auto-reload)
npm run dev

# Or production mode
npm start
```

You should see:
```
🚀 Campus SkillSwap API Server Started!
📍 Server running on: http://localhost:5000
🌍 Environment: development
📊 Health check: http://localhost:5000/health
🔗 API Base URL: http://localhost:5000/api
📱 Socket.IO enabled for real-time features
```

## 🔧 Detailed Configuration

### MongoDB Setup

#### Option 1: Local MongoDB

1. **Install MongoDB Community Edition**
   - Download from [MongoDB Download Center](https://www.mongodb.com/try/download/community)
   - Follow installation instructions for your OS

2. **Start MongoDB Service**
   ```bash
   # Windows
   net start MongoDB
   
   # macOS (with Homebrew)
   brew services start mongodb-community
   
   # Linux
   sudo systemctl start mongod
   ```

3. **Verify Connection**
   ```bash
   # Connect to MongoDB shell
   mongosh
   
   # List databases
   show dbs
   ```

#### Option 2: MongoDB Atlas (Cloud)

1. **Create Account**
   - Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
   - Create a free account

2. **Create Cluster**
   - Click "Build a Database"
   - Choose "M0 Sandbox" (free tier)
   - Select region closest to you
   - Create cluster

3. **Configure Access**
   - Go to "Database Access"
   - Add new database user
   - Go to "Network Access"
   - Add IP address (0.0.0.0/0 for development)

4. **Get Connection String**
   - Go to "Clusters"
   - Click "Connect"
   - Choose "Connect your application"
   - Copy connection string
   - Update `.env` file:
     ```env
     MONGODB_URI=mongodb+srv://kathir4779:tllqq6SJYdVeDI2C@cluster.mongodb.net/campus_skillswap
     ```

### Email Configuration

#### Gmail Setup

1. **Enable 2-Factor Authentication**
   - Go to Google Account settings
   - Enable 2FA

2. **Generate App Password**
   - Go to "Security" → "2-Step Verification"
   - Generate app password for "Mail"
   - Use this password in `EMAIL_PASS`

3. **Update Environment Variables**
   ```env
   EMAIL_SERVICE=gmail
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-16-character-app-password
   ```

#### Other Email Services

**SendGrid:**
```env
EMAIL_SERVICE=sendgrid
EMAIL_USER=apikey
EMAIL_PASS=your-sendgrid-api-key
```

**Outlook/Hotmail:**
```env
EMAIL_SERVICE=hotmail
EMAIL_USER=your-email@outlook.com
EMAIL_PASS=your-password
```

## 🧪 Testing the Setup

### 1. Health Check

```bash
curl http://localhost:5000/health
```

Expected response:
```json
{
  "status": "OK",
  "message": "Campus SkillSwap API is running",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "environment": "development",
  "version": "1.0.0"
}
```

### 2. API Info

```bash
curl http://localhost:5000/api
```

### 3. Test Registration

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "password123",
    "university": "Test University",
    "major": "Computer Science",
    "year": "3rd Year"
  }'
```

### 4. Test Login

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

## 📁 File Structure

After setup, your backend directory should look like:

```
backend/
├── src/
│   ├── controllers/          # Route controllers (if needed)
│   ├── database/
│   │   ├── connection.js     # MongoDB connection
│   │   ├── migrate.js        # Database migration
│   │   └── seed.js           # Sample data
│   ├── middleware/
│   │   ├── auth.js           # Authentication
│   │   ├── errorHandler.js   # Error handling
│   │   ├── notFound.js       # 404 handler
│   │   └── validation.js     # Input validation
│   ├── models/
│   │   ├── User.js           # User model
│   │   ├── Skill.js          # Skill model
│   │   ├── Session.js        # Session model
│   │   ├── Review.js         # Review model
│   │   ├── Message.js        # Message model
│   │   └── MessageThread.js  # Message thread model
│   ├── routes/
│   │   ├── auth.js           # Authentication routes
│   │   ├── users.js          # User routes
│   │   ├── skills.js         # Skill routes
│   │   ├── sessions.js       # Session routes
│   │   ├── reviews.js        # Review routes
│   │   ├── messages.js       # Message routes
│   │   └── admin.js          # Admin routes
│   ├── utils/
│   │   └── email.js          # Email utilities
│   └── server.js             # Main server file
├── uploads/                  # File uploads (created automatically)
├── .env                      # Environment variables
├── .env.example             # Environment template
├── package.json             # Dependencies
├── README.md                # Documentation
└── SETUP.md                 # This file
```

## 🔧 Troubleshooting

### Common Issues

#### 1. MongoDB Connection Error

**Error:** `MongoNetworkError: failed to connect to server`

**Solutions:**
- Ensure MongoDB is running
- Check connection string in `.env`
- Verify network access (for Atlas)

#### 2. JWT Secret Error

**Error:** `JWT_SECRET is required`

**Solutions:**
- Add `JWT_SECRET` to `.env` file
- Use a strong, random secret key

#### 3. Email Service Error

**Error:** `Email service not configured`

**Solutions:**
- Check email credentials in `.env`
- Verify app password for Gmail
- Test email service independently

#### 4. Port Already in Use

**Error:** `EADDRINUSE: address already in use :::5000`

**Solutions:**
- Change `PORT` in `.env` file
- Kill process using port 5000:
  ```bash
  # Find process
  lsof -i :5000
  # Kill process
  kill -9 <PID>
  ```

#### 5. File Upload Error

**Error:** `ENOENT: no such file or directory, mkdir`

**Solutions:**
- Ensure uploads directory exists
- Check file permissions
- Verify `MAX_FILE_SIZE` setting

### Logs and Debugging

```bash
# View server logs
npm run dev

# Check MongoDB logs
tail -f /var/log/mongodb/mongod.log

# Test database connection
mongosh "mongodb://localhost:27017/campus_skillswap"
```

## 🚀 Production Deployment

### Environment Variables

Update `.env` for production:

```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/campus_skillswap
JWT_SECRET=your-production-secret-key
FRONTEND_URL=https://yourdomain.com
CORS_ORIGIN=https://yourdomain.com
```

### Process Management

```bash
# Install PM2
npm install -g pm2

# Start application
pm2 start src/server.js --name campus-skillswap-api

# Save PM2 configuration
pm2 save

# Setup startup script
pm2 startup
```

### SSL/HTTPS

Use a reverse proxy like Nginx:

```nginx
server {
    listen 443 ssl;
    server_name yourdomain.com;
    
    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;
    
    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 📚 Next Steps

1. **Frontend Integration**: Connect your frontend to the API
2. **API Testing**: Use Postman or similar tools to test endpoints
3. **Real-time Features**: Implement Socket.IO client-side
4. **File Uploads**: Test image upload functionality
5. **Email Notifications**: Verify email delivery
6. **Admin Panel**: Access admin features with admin credentials

## 🆘 Getting Help

If you encounter issues:

1. Check the logs for error messages
2. Verify all environment variables
3. Test each service independently (MongoDB, email)
4. Check the API documentation
5. Review this setup guide

For additional support, create an issue in the repository or contact the development team.

---

**Happy Coding! 🎉**
