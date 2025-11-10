const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  // Review Information
  session: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Session',
    required: [true, 'Session is required']
  },
  
  // Participants
  reviewer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Reviewer is required']
  },
  
  reviewee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Reviewee is required']
  },
  
  // Review Type
  type: {
    type: String,
    enum: ['teacher', 'student'],
    required: [true, 'Review type is required']
  },
  
  // Rating
  rating: {
    type: Number,
    required: [true, 'Rating is required'],
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating cannot exceed 5']
  },
  
  // Detailed Ratings (for teachers)
  detailedRatings: {
    teachingQuality: {
      type: Number,
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5']
    },
    communication: {
      type: Number,
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5']
    },
    punctuality: {
      type: Number,
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5']
    },
    preparation: {
      type: Number,
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5']
    }
  },
  
  // Review Content
  comment: {
    type: String,
    required: [true, 'Review comment is required'],
    trim: true,
    minlength: [10, 'Comment must be at least 10 characters'],
    maxlength: [1000, 'Comment cannot exceed 1000 characters']
  },
  
  // Tags/Keywords
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  
  // Review Status
  isPublic: {
    type: Boolean,
    default: true
  },
  
  isVerified: {
    type: Boolean,
    default: true // Auto-verified for completed sessions
  },
  
  // Response from reviewee
  response: {
    comment: {
      type: String,
      trim: true,
      maxlength: [500, 'Response cannot exceed 500 characters']
    },
    respondedAt: {
      type: Date
    }
  },
  
  // Helpfulness votes
  helpfulness: {
    helpful: {
      type: Number,
      default: 0,
      min: [0, 'Helpful count cannot be negative']
    },
    notHelpful: {
      type: Number,
      default: 0,
      min: [0, 'Not helpful count cannot be negative']
    },
    voters: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      vote: {
        type: String,
        enum: ['helpful', 'notHelpful']
      },
      votedAt: {
        type: Date,
        default: Date.now
      }
    }]
  },
  
  // Moderation
  isModerated: {
    type: Boolean,
    default: false
  },
  
  moderatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  moderatedAt: {
    type: Date
  },
  
  moderationReason: {
    type: String,
    trim: true
  },
  
  // Reports
  reports: [{
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    reason: {
      type: String,
      enum: [
        'inappropriate',
        'spam',
        'false',
        'offensive',
        'irrelevant',
        'other'
      ],
      required: true
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Report description cannot exceed 500 characters']
    },
    reportedAt: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['pending', 'resolved', 'dismissed'],
      default: 'pending'
    }
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
reviewSchema.index({ session: 1 });
reviewSchema.index({ reviewer: 1 });
reviewSchema.index({ reviewee: 1 });
reviewSchema.index({ type: 1 });
reviewSchema.index({ rating: -1 });
reviewSchema.index({ createdAt: -1 });
reviewSchema.index({ isPublic: 1, isVerified: 1 });

// Virtual for helpfulness score
reviewSchema.virtual('helpfulnessScore').get(function() {
  const total = this.helpfulness.helpful + this.helpfulness.notHelpful;
  return total > 0 ? (this.helpfulness.helpful / total) * 100 : 0;
});

// Virtual for average detailed rating
reviewSchema.virtual('averageDetailedRating').get(function() {
  if (!this.detailedRatings) return this.rating;
  
  const ratings = Object.values(this.detailedRatings).filter(r => r);
  return ratings.length > 0 ? 
    ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length : 
    this.rating;
});

// Pre-save middleware to calculate average detailed rating
reviewSchema.pre('save', function(next) {
  if (this.detailedRatings && this.type === 'teacher') {
    const ratings = Object.values(this.detailedRatings).filter(r => r);
    if (ratings.length > 0) {
      this.rating = ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;
    }
  }
  next();
});

// Static method to get reviews for a user
reviewSchema.statics.getUserReviews = function(userId, type = 'all', options = {}) {
  const query = {
    reviewee: userId,
    isPublic: true,
    isVerified: true
  };
  
  if (type !== 'all') {
    query.type = type;
  }
  
  return this.find(query)
    .populate('reviewer', 'name profileImage')
    .populate('session', 'skill scheduledDate')
    .populate('session.skill', 'title category')
    .sort({ createdAt: -1 })
    .limit(options.limit || 20)
    .skip(options.skip || 0);
};

// Static method to get average rating for a user
reviewSchema.statics.getAverageRating = async function(userId, type = 'teacher') {
  const result = await this.aggregate([
    {
      $match: {
        reviewee: mongoose.Types.ObjectId(userId),
        type: type,
        isPublic: true,
        isVerified: true
      }
    },
    {
      $group: {
        _id: null,
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 },
        ratingDistribution: {
          $push: '$rating'
        }
      }
    }
  ]);
  
  if (result.length === 0) {
    return {
      averageRating: 0,
      totalReviews: 0,
      ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    };
  }
  
  const { averageRating, totalReviews, ratingDistribution } = result[0];
  
  // Calculate rating distribution
  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  ratingDistribution.forEach(rating => {
    distribution[Math.round(rating)] += 1;
  });
  
  return {
    averageRating: Math.round(averageRating * 10) / 10,
    totalReviews,
    ratingDistribution: distribution
  };
};

// Static method to check if user can review
reviewSchema.statics.canUserReview = async function(sessionId, userId) {
  const session = await mongoose.model('Session').findById(sessionId);
  
  if (!session || session.status !== 'completed') {
    return { canReview: false, reason: 'Session not completed' };
  }
  
  // Convert to strings for comparison
  const userIdStr = userId.toString();
  const teacherIdStr = session.teacher.toString();
  const studentIdStr = session.student.toString();
  
  // Check if user was part of the session
  if (teacherIdStr !== userIdStr && studentIdStr !== userIdStr) {
    return { canReview: false, reason: 'User not part of session' };
  }
  
  // Check if review already exists
  const existingReview = await this.findOne({
    session: sessionId,
    reviewer: userId
  });
  
  if (existingReview) {
    return { canReview: false, reason: 'Review already exists' };
  }
  
  return { canReview: true };
};

// Instance method to add helpfulness vote
reviewSchema.methods.addHelpfulnessVote = function(userId, vote) {
  // Check if user already voted
  const existingVote = this.helpfulness.voters.find(v => v.user.toString() === userId);
  
  if (existingVote) {
    // Update existing vote
    if (existingVote.vote !== vote) {
      // Change vote
      if (existingVote.vote === 'helpful') {
        this.helpfulness.helpful -= 1;
        this.helpfulness.notHelpful += 1;
      } else {
        this.helpfulness.notHelpful -= 1;
        this.helpfulness.helpful += 1;
      }
      existingVote.vote = vote;
      existingVote.votedAt = new Date();
    }
  } else {
    // Add new vote
    this.helpfulness.voters.push({
      user: userId,
      vote: vote,
      votedAt: new Date()
    });
    
    if (vote === 'helpful') {
      this.helpfulness.helpful += 1;
    } else {
      this.helpfulness.notHelpful += 1;
    }
  }
  
  return this.save();
};

// Instance method to add response
reviewSchema.methods.addResponse = function(comment) {
  this.response.comment = comment;
  this.response.respondedAt = new Date();
  return this.save();
};

// Instance method to report review
reviewSchema.methods.reportReview = function(reportedBy, reason, description = '') {
  this.reports.push({
    reportedBy,
    reason,
    description,
    reportedAt: new Date(),
    status: 'pending'
  });
  return this.save();
};

module.exports = mongoose.model('Review', reviewSchema);
