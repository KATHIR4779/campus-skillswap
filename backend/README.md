# Campus SkillSwap Backend API

A comprehensive backend API for the Campus SkillSwap peer-to-peer learning platform, built with Node.js, Express, and MongoDB.

## 🚀 Features

- **User Authentication & Authorization**: JWT-based auth with role-based access control
- **Skill Management**: Create, update, and manage learning skills
- **Session Booking**: Schedule and manage learning sessions
- **Review System**: Rate and review teaching/learning experiences
- **Real-time Messaging**: Socket.IO powered messaging system
- **Admin Panel**: Comprehensive admin dashboard and management tools
- **File Upload**: Profile images and skill images with optimization
- **Email Notifications**: Automated email notifications for various events
- **Security**: Rate limiting, input validation, XSS protection, and more

## 📋 Prerequisites

- Node.js (v18.0.0 or higher)
- npm (v8.0.0 or higher)
- MongoDB (v4.4 or higher)
- Email service (Gmail, SendGrid, etc.)

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd campus-skillswap/backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   ```bash
   cp env.example .env
   ```
   
   Update the `.env` file with your configuration:
   ```env
   # Server Configuration
   PORT=5000
   NODE_ENV=development
   HOST=localhost
   
   # Database
   MONGODB_URI=mongodb://localhost:27017/campus_skillswap
   
   # JWT Configuration
   JWT_SECRET=your-super-secret-jwt-key
   JWT_EXPIRES_IN=1h
   
   # Email Configuration
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

4. **Database Setup**
   ```bash
   # Run database migration
   npm run migrate
   
   # Seed sample data (optional)
   npm run seed
   ```

5. **Start the server**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

## 📚 API Documentation

### Base URL
```
http://localhost:5000/api
```

### Authentication Endpoints

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/auth/register` | Register new user | Public |
| POST | `/auth/login` | User login | Public |
| GET | `/auth/me` | Get current user | Private |
| GET | `/auth/verify-email` | Verify email address | Public |
| POST | `/auth/resend-verification` | Resend verification email | Private |
| POST | `/auth/forgot-password` | Request password reset | Public |
| PUT | `/auth/reset-password` | Reset password | Public |
| PUT | `/auth/update-password` | Update password | Private |
| POST | `/auth/logout` | Logout user | Private |

### User Endpoints

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/users` | Get all users | Admin |
| GET | `/users/:id` | Get single user | Private |
| GET | `/users/me/profile` | Get current user profile | Private |
| PUT | `/users/me` | Update user profile | Private |
| POST | `/users/me/avatar` | Upload profile image | Private |
| DELETE | `/users/me/avatar` | Delete profile image | Private |
| GET | `/users/me/stats` | Get user statistics | Private |
| GET | `/users/:id/reviews` | Get user reviews | Private |
| GET | `/users/:id/skills` | Get user skills | Private |

### Skill Endpoints

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/skills` | Get all skills | Public |
| GET | `/skills/featured` | Get featured skills | Public |
| GET | `/skills/categories` | Get skill categories | Public |
| GET | `/skills/:id` | Get single skill | Public |
| POST | `/skills` | Create new skill | Private |
| PUT | `/skills/:id` | Update skill | Private |
| DELETE | `/skills/:id` | Delete skill | Private |
| POST | `/skills/:id/images` | Upload skill images | Private |
| PUT | `/skills/:id/images/:imageId/primary` | Set primary image | Private |
| DELETE | `/skills/:id/images/:imageId` | Delete skill image | Private |
| GET | `/skills/my-skills` | Get user's skills | Private |
| PUT | `/skills/:id/featured` | Toggle featured status | Admin |

### Session Endpoints

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/sessions` | Get user sessions | Private |
| GET | `/sessions/:id` | Get single session | Private |
| POST | `/sessions` | Request new session | Private |
| PUT | `/sessions/:id` | Update session status | Private |
| DELETE | `/sessions/:id` | Delete session | Private |
| GET | `/sessions/stats` | Get session statistics | Private |

### Review Endpoints

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/reviews` | Get all reviews | Private |
| GET | `/reviews/:id` | Get single review | Private |
| POST | `/reviews` | Create new review | Private |
| PUT | `/reviews/:id` | Update review | Private |
| DELETE | `/reviews/:id` | Delete review | Private |
| POST | `/reviews/:id/helpful` | Add helpfulness vote | Private |
| POST | `/reviews/:id/response` | Add response to review | Private |
| POST | `/reviews/:id/report` | Report review | Private |
| GET | `/reviews/user/:userId` | Get user reviews | Private |

### Message Endpoints

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/messages/threads` | Get message threads | Private |
| GET | `/messages/conversation/:userId` | Get conversation | Private |
| POST | `/messages` | Send message | Private |
| GET | `/messages/unread-count` | Get unread count | Private |
| PUT | `/messages/mark-read` | Mark messages as read | Private |
| GET | `/messages/:id` | Get single message | Private |
| PUT | `/messages/:id` | Update message | Private |
| DELETE | `/messages/:id` | Delete message | Private |

### Admin Endpoints

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/admin/dashboard` | Get dashboard statistics | Admin |
| GET | `/admin/users` | Get all users (admin view) | Admin |
| PUT | `/admin/users/:id/status` | Update user status | Admin |
| GET | `/admin/skills` | Get all skills (admin view) | Admin |
| PUT | `/admin/skills/:id/verify` | Verify skill | Admin |
| GET | `/admin/sessions` | Get all sessions (admin view) | Admin |
| GET | `/admin/reviews` | Get all reviews (admin view) | Admin |
| PUT | `/admin/reviews/:id/moderate` | Moderate review | Admin |
| GET | `/admin/reports` | Get system reports | Admin |
| GET | `/admin/flagged` | Get flagged content | Admin |

## 🔧 Scripts

```bash
# Development
npm run dev          # Start development server with nodemon

# Production
npm start           # Start production server

# Database
npm run migrate     # Run database migration
npm run seed        # Seed database with sample data

# Testing
npm test           # Run tests
npm run test:watch # Run tests in watch mode

# Code Quality
npm run lint       # Run ESLint
npm run lint:fix   # Fix ESLint issues
```

## 🏗️ Project Structure

```
backend/
├── src/
│   ├── controllers/          # Route controllers
│   ├── database/            # Database connection and utilities
│   │   ├── connection.js    # MongoDB connection
│   │   ├── migrate.js       # Database migration
│   │   └── seed.js          # Sample data seeding
│   ├── middleware/          # Custom middleware
│   │   ├── auth.js          # Authentication middleware
│   │   ├── errorHandler.js  # Error handling middleware
│   │   ├── notFound.js      # 404 handler
│   │   └── validation.js    # Input validation middleware
│   ├── models/              # Mongoose models
│   │   ├── User.js          # User model
│   │   ├── Skill.js         # Skill model
│   │   ├── Session.js       # Session model
│   │   ├── Review.js        # Review model
│   │   ├── Message.js       # Message model
│   │   └── MessageThread.js # Message thread model
│   ├── routes/              # API routes
│   │   ├── auth.js          # Authentication routes
│   │   ├── users.js         # User routes
│   │   ├── skills.js        # Skill routes
│   │   ├── sessions.js      # Session routes
│   │   ├── reviews.js       # Review routes
│   │   ├── messages.js      # Message routes
│   │   └── admin.js         # Admin routes
│   ├── utils/               # Utility functions
│   │   └── email.js         # Email utilities
│   └── server.js            # Main server file
├── uploads/                 # File uploads directory
├── .env                     # Environment variables
├── .env.example            # Environment variables example
├── package.json            # Dependencies and scripts
└── README.md               # This file
```

## 🔒 Security Features

- **Helmet.js**: Security headers
- **Rate Limiting**: Prevent API abuse
- **Input Validation**: Comprehensive request validation
- **XSS Protection**: Cross-site scripting prevention
- **NoSQL Injection Protection**: MongoDB query sanitization
- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt password encryption
- **CORS Configuration**: Cross-origin resource sharing control

## 📱 Real-time Features

The API includes Socket.IO for real-time functionality:

- **Real-time messaging**: Instant message delivery
- **Session notifications**: Live updates for session events
- **User presence**: Online/offline status
- **Live updates**: Real-time data synchronization

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run specific test file
npm test -- --testPathPattern=auth.test.js
```

## 🚀 Deployment

### Production Checklist

1. **Environment Variables**: Set all production environment variables
2. **Database**: Configure production MongoDB connection
3. **Email Service**: Set up production email service
4. **File Storage**: Configure production file storage
5. **SSL Certificate**: Enable HTTPS
6. **Process Manager**: Use PM2 or similar for process management
7. **Monitoring**: Set up application monitoring
8. **Backup**: Configure database backups

### PM2 Configuration

```bash
# Install PM2
npm install -g pm2

# Start application
pm2 start src/server.js --name campus-skillswap-api

# Monitor
pm2 monit

# Logs
pm2 logs campus-skillswap-api
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support, email support@campusskillswap.com or join our Discord community.

## 🔄 API Versioning

The API uses URL versioning. Current version: `v1`

Example: `http://localhost:5000/api/v1/auth/login`

## 📊 Monitoring & Logs

- **Health Check**: `GET /health`
- **API Info**: `GET /api`
- **Logs**: Available via PM2 or your process manager
- **Metrics**: Consider integrating with monitoring services like New Relic or DataDog

---

**Happy Coding! 🎉**
