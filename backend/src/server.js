const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

// Import database connection
const connectDB = require('./database/connection');
const mongoose = require('mongoose');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const skillRoutes = require('./routes/skills');
const sessionRoutes = require('./routes/sessions');
const reviewRoutes = require('./routes/reviews');
const messageRoutes = require('./routes/messages');
const adminRoutes = require('./routes/admin');

// Import middleware
const errorHandler = require('./middleware/errorHandler');
const notFound = require('./middleware/notFound');

// Import Socket.IO for real-time features
const { createServer } = require('http');
const { Server } = require('socket.io');

const app = express();
const server = createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',') || ["http://localhost:3000"],
    methods: ["GET", "POST"]
  }
});

// Connect to database
connectDB();

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS configuration
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = process.env.CORS_ORIGIN?.split(',') || [
      "http://localhost:3000", 
      "http://127.0.0.1:5500",
      "http://localhost:5500",
      "http://127.0.0.1:3000"
    ];
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(null, true); // Allow all origins for development
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression middleware
app.use(compression());

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Static files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Favicon route - handle browser favicon requests
app.get('/favicon.ico', (req, res) => {
  // Return a simple 204 No Content response for favicon requests
  res.status(204).end();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Campus SkillSwap API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    version: '1.0.0'
  });
});

// API info endpoint
app.get('/api', (req, res) => {
  res.json({
    name: 'Campus SkillSwap API',
    version: '1.0.0',
    description: 'Backend API for Campus SkillSwap peer-to-peer learning platform',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      skills: '/api/skills',
      sessions: '/api/sessions',
      reviews: '/api/reviews',
      messages: '/api/messages',
      admin: '/api/admin'
    }
  });
});

// Basic route
app.get('/', (req, res) => {
  res.json({
    message: 'Campus SkillSwap Backend API is running!',
    endpoints: {
      health: '/health',
      api: '/api',
      auth: '/api/auth',
      users: '/api/users',
      skills: '/api/skills',
      sessions: '/api/sessions',
      reviews: '/api/reviews',
      messages: '/api/messages',
      admin: '/api/admin'
    }
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/skills', skillRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/admin', adminRoutes);

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Join user to their personal room
  socket.on('join-user-room', (userId) => {
    socket.join(`user-${userId}`);
    console.log(`User ${userId} joined their personal room`);
  });

  // Join session room for real-time communication
  socket.on('join-session', (sessionId) => {
    socket.join(`session-${sessionId}`);
    console.log(`User joined session: ${sessionId}`);
  });

  // Leave session room
  socket.on('leave-session', (sessionId) => {
    socket.leave(`session-${sessionId}`);
    console.log(`User left session: ${sessionId}`);
  });

  // Handle session messages
  socket.on('session-message', (data) => {
    socket.to(`session-${data.sessionId}`).emit('session-message', data);
  });

  // Handle user disconnect
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

// Make io accessible to routes
app.set('io', io);

// Error handling middleware (must be last)
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5001;
const HOST = process.env.HOST || 'localhost';

server.listen(PORT, HOST, () => {
  console.log(`
🚀 Campus SkillSwap API Server Started!
📍 Server running on: http://${HOST}:${PORT}
🌍 Environment: ${process.env.NODE_ENV}
📊 Health check: http://${HOST}:${PORT}/health
🔗 API Base URL: http://${HOST}:${PORT}/api
📱 Socket.IO enabled for real-time features
  `);
});

// Graceful shutdown
const gracefulShutdown = (signal) => {
  console.log(`\n🛑 ${signal} received. Shutting down gracefully...`);
  
  server.close((err) => {
    if (err) {
      console.error('❌ Error during server shutdown:', err);
      process.exit(1);
    }
    
    console.log('✅ HTTP server closed');
    
    // Close database connection if needed
    if (mongoose.connection.readyState === 1) {
      mongoose.connection.close(() => {
        console.log('✅ Database connection closed');
        process.exit(0);
      });
    } else {
      process.exit(0);
    }
  });
  
  // Force close after 10 seconds
  setTimeout(() => {
    console.error('❌ Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT')); // Ctrl+C
process.on('SIGUSR2', () => gracefulShutdown('SIGUSR2')); // Nodemon restart

module.exports = { app, server, io };
