const mongoose = require('mongoose');

const skillSchema = new mongoose.Schema({
  // Basic Information
  title: {
    type: String,
    required: [true, 'Skill title is required'],
    trim: true,
    minlength: [3, 'Title must be at least 3 characters'],
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  
  description: {
    type: String,
    required: [true, 'Skill description is required'],
    trim: true,
    minlength: [10, 'Description must be at least 10 characters'],
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  
  // Category and Tags
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: [
      'Technology',
      'Academics',
      'Arts',
      'Language',
      'Life Skills',
      'Sports',
      'Music',
      'Other'
    ]
  },
  
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  
  // Teacher Information
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Teacher is required']
  },
  
  // Pricing
  creditsPerHour: {
    type: Number,
    required: [true, 'Credits per hour is required'],
    min: [1, 'Minimum 1 credit per hour'],
    max: [10, 'Maximum 10 credits per hour'],
    default: 2
  },
  
  // Skill Level
  level: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced'],
    default: 'Beginner'
  },
  
  // Availability
  isActive: {
    type: Boolean,
    default: true
  },
  
  availableDays: [{
    type: String,
    enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
  }],
  
  availableTimes: [{
    start: {
      type: String,
      required: true
    },
    end: {
      type: String,
      required: true
    }
  }],
  
  // Location
  location: {
    type: String,
    enum: ['campus-library', 'campus-cafeteria', 'study-rooms', 'online', 'flexible'],
    default: 'campus-library'
  },
  
  // Rating and Reviews
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
    totalSessions: {
      type: Number,
      default: 0
    },
    totalStudents: {
      type: Number,
      default: 0
    },
    totalHours: {
      type: Number,
      default: 0
    },
    completionRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    }
  },
  
  // Prerequisites
  prerequisites: [{
    type: String,
    trim: true
  }],
  
  // Learning Outcomes
  learningOutcomes: [{
    type: String,
    trim: true,
    maxlength: [200, 'Learning outcome cannot exceed 200 characters']
  }],
  
  // Materials Required
  materialsRequired: [{
    type: String,
    trim: true
  }],
  
  // Maximum Students per Session
  maxStudents: {
    type: Number,
    default: 1,
    min: [1, 'Minimum 1 student per session'],
    max: [10, 'Maximum 10 students per session']
  },
  
  // Session Duration
  sessionDuration: {
    type: Number,
    default: 60, // in minutes
    min: [30, 'Minimum 30 minutes'],
    max: [180, 'Maximum 3 hours']
  },
  
  // Featured Skills
  isFeatured: {
    type: Boolean,
    default: false
  },
  
  // Verification Status
  isVerified: {
    type: Boolean,
    default: false
  },
  
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  verifiedAt: {
    type: Date
  },
  
  // Images
  images: [{
    url: String,
    caption: String,
    isPrimary: {
      type: Boolean,
      default: false
    }
  }],
  
  // Search Keywords
  searchKeywords: [{
    type: String,
    lowercase: true,
    trim: true
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
skillSchema.index({ title: 'text', description: 'text', tags: 'text' });
skillSchema.index({ category: 1 });
skillSchema.index({ teacher: 1 });
skillSchema.index({ 'rating.average': -1 });
skillSchema.index({ isActive: 1, isFeatured: 1 });
skillSchema.index({ createdAt: -1 });

// Virtual for primary image
skillSchema.virtual('primaryImage').get(function() {
  // Check if images array exists before trying to use it
  if (!this.images || !Array.isArray(this.images)) {
    return null;
  }
  
  const primaryImg = this.images.find(img => img.isPrimary);
  if (primaryImg) {
    return primaryImg.url.startsWith('http') ? primaryImg.url : 
           `${process.env.BASE_URL || 'http://localhost:5000'}/uploads/${primaryImg.url}`;
  }
  return null;
});

// Virtual for teacher name
skillSchema.virtual('teacherName').get(function() {
  return this.populated('teacher') ? this.teacher.name : 'Loading...';
});

// Pre-save middleware to generate search keywords
skillSchema.pre('save', function(next) {
  if (this.isModified('title') || this.isModified('description') || this.isModified('tags')) {
    const keywords = [];
    
    // Add title words
    keywords.push(...this.title.toLowerCase().split(' '));
    
    // Add description words
    keywords.push(...this.description.toLowerCase().split(' '));
    
    // Add tags
    keywords.push(...this.tags);
    
    // Add category
    keywords.push(this.category.toLowerCase());
    
    // Remove duplicates and filter out short words
    this.searchKeywords = [...new Set(keywords)].filter(word => word.length > 2);
  }
  next();
});

// Static method to search skills
skillSchema.statics.searchSkills = function(query, filters = {}) {
  const searchQuery = {
    isActive: true,
    ...filters
  };
  
  if (query) {
    searchQuery.$text = { $search: query };
  }
  
  return this.find(searchQuery)
    .populate('teacher', 'name profileImage rating.average')
    .sort({ score: { $meta: 'textScore' }, 'rating.average': -1, createdAt: -1 });
};

// Instance method to update rating
skillSchema.methods.updateRating = function(newRating) {
  const totalRating = this.rating.average * this.rating.count + newRating;
  this.rating.count += 1;
  this.rating.average = totalRating / this.rating.count;
  return this.save();
};

// Instance method to add session
skillSchema.methods.addSession = function(duration, studentCount = 1) {
  this.stats.totalSessions += 1;
  this.stats.totalStudents += studentCount;
  this.stats.totalHours += duration / 60; // Convert minutes to hours
  return this.save();
};

module.exports = mongoose.model('Skill', skillSchema);
