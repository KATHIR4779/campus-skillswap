const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema({
  // Basic Information
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters'],
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      'Please provide a valid email address'
    ]
  },
  
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters'],
    select: false // Don't include password in queries by default
  },
  
  // Profile Information
  bio: {
    type: String,
    maxlength: [500, 'Bio cannot exceed 500 characters'],
    default: ''
  },
  
  profileImage: {
    type: String,
    default: ''
  },
  
  // Academic Information
  university: {
    type: String,
    required: [true, 'University is required'],
    trim: true
  },
  
  major: {
    type: String,
    required: [true, 'Major is required'],
    trim: true
  },
  
  year: {
    type: String,
    required: [true, 'Year of study is required'],
    enum: ['1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year', 'Postgraduate'],
    default: '1st Year'
  },
  
  // SkillSwap Specific
  timeCredits: {
    type: Number,
    default: 2,
    min: [0, 'Time credits cannot be negative']
  },
  
  rating: {
    average: {
      type: Number,
      default: 0,
      min: [0, 'Rating cannot be negative'],
      max: [5, 'Rating cannot exceed 5']
    },
    count: {
      type: Number,
      default: 0
    }
  },
  
  // Statistics
  stats: {
    sessionsCompleted: {
      type: Number,
      default: 0
    },
    sessionsTaught: {
      type: Number,
      default: 0
    },
    studentsHelped: {
      type: Number,
      default: 0
    },
    totalHours: {
      type: Number,
      default: 0
    }
  },
  
  // Interests and Preferences
  interests: [{
    type: String,
    trim: true
  }],
  
  teachingPreferences: {
    location: {
      type: String,
      enum: ['campus-library', 'campus-cafeteria', 'study-rooms', 'online', 'flexible'],
      default: 'campus-library'
    },
    availableDays: [{
      type: String,
      enum: ['weekdays', 'weekends', 'evenings']
    }],
    sessionDuration: {
      type: String,
      enum: ['30min', '1hour', '2hours', 'flexible'],
      default: '1hour'
    }
  },
  
  // Account Status
  isActive: {
    type: Boolean,
    default: true
  },
  
  isVerified: {
    type: Boolean,
    default: false
  },
  
  verificationToken: {
    type: String,
    select: false
  },
  
  passwordResetToken: {
    type: String,
    select: false
  },
  
  passwordResetExpires: {
    type: Date,
    select: false
  },
  
  lastLogin: {
    type: Date
  },
  
  // Role-based access
  role: {
    type: String,
    enum: ['student', 'admin'],
    default: 'student'
  },
  
  // Social login
  googleId: {
    type: String,
    sparse: true,
    unique: true
  },
  
  // Notification preferences
  notifications: {
    email: {
      newMessages: { type: Boolean, default: true },
      sessionRequests: { type: Boolean, default: true },
      sessionReminders: { type: Boolean, default: true },
      reviews: { type: Boolean, default: true }
    },
    push: {
      newMessages: { type: Boolean, default: true },
      sessionRequests: { type: Boolean, default: true },
      sessionReminders: { type: Boolean, default: true }
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
// Note: email index is automatically created by unique: true
userSchema.index({ university: 1 });
userSchema.index({ major: 1 });
userSchema.index({ 'rating.average': -1 });
userSchema.index({ timeCredits: -1 });

// Virtual for member since
userSchema.virtual('memberSince').get(function() {
  if (!this.createdAt) return 'Unknown';
  return this.createdAt.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long' 
  });
});

// Virtual for full profile URL
userSchema.virtual('profileImageUrl').get(function() {
  if (this.profileImage && !this.profileImage.startsWith('http')) {
    // profileImage already contains the path starting with /uploads/profiles/
    // Just prepend the base URL
    return `${process.env.BASE_URL || 'http://localhost:5001'}${this.profileImage}`;
  }
  return this.profileImage;
});

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  // Only run this function if password was actually modified
  if (!this.isModified('password')) return next();
  
  // Hash the password with cost of 12
  this.password = await bcrypt.hash(this.password, parseInt(process.env.BCRYPT_ROUNDS) || 12);
  next();
});

// Instance method to check password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Instance method to generate JWT token
userSchema.methods.generateAuthToken = function() {
  return jwt.sign(
    { 
      id: this._id,
      email: this.email,
      role: this.role 
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

// Instance method to generate refresh token
userSchema.methods.generateRefreshToken = function() {
  return jwt.sign(
    { id: this._id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRE || '30d' }
  );
};

// Static method to find user by email and include password
userSchema.statics.findByEmailWithPassword = function(email) {
  return this.findOne({ email }).select('+password');
};

// Static method to find user by verification token
userSchema.statics.findByVerificationToken = function(token) {
  return this.findOne({ verificationToken: token }).select('+verificationToken');
};

// Static method to find user by password reset token
userSchema.statics.findByPasswordResetToken = function(token) {
  return this.findOne({ 
    passwordResetToken: token,
    passwordResetExpires: { $gt: Date.now() }
  }).select('+passwordResetToken +passwordResetExpires');
};

module.exports = mongoose.model('User', userSchema);
