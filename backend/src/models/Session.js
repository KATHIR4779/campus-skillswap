const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  // Session Information
  title: {
    type: String,
    required: [true, 'Session title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  
  // Participants
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Teacher is required']
  },
  
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Student is required']
  },
  
  // Skill being taught
  skill: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Skill',
    required: [true, 'Skill is required']
  },
  
  // Session Details
  creditsPerHour: {
    type: Number,
    required: [true, 'Credits per hour is required'],
    min: [1, 'Minimum 1 credit per hour']
  },
  
  duration: {
    type: Number, // in minutes
    required: [true, 'Duration is required'],
    min: [30, 'Minimum 30 minutes'],
    max: [180, 'Maximum 3 hours']
  },
  
  totalCredits: {
    type: Number,
    required: true,
    min: [1, 'Total credits must be at least 1']
  },
  
  // Scheduling
  scheduledDate: {
    type: Date,
    required: [true, 'Scheduled date is required']
  },
  
  startTime: {
    type: String,
    required: [true, 'Start time is required']
  },
  
  endTime: {
    type: String,
    required: [true, 'End time is required']
  },
  
  // Location
  location: {
    type: String,
    enum: ['campus-library', 'campus-cafeteria', 'study-rooms', 'online', 'flexible'],
    required: [true, 'Location is required']
  },
  
  locationDetails: {
    type: String,
    trim: true
  },
  
  // Online session details
  meetingLink: {
    type: String,
    trim: true
  },
  
  meetingPassword: {
    type: String,
    trim: true
  },
  
  // Status
  status: {
    type: String,
    enum: [
      'pending',      // Request sent, waiting for teacher approval
      'approved',     // Teacher approved, scheduled
      'confirmed',    // Both parties confirmed
      'in-progress',  // Session is currently happening
      'completed',    // Session completed successfully
      'cancelled',    // Session was cancelled
      'no-show',      // One party didn't show up
      'disputed'      // There's a dispute about the session
    ],
    default: 'pending'
  },
  
  // Request Information
  requestMessage: {
    type: String,
    trim: true,
    maxlength: [500, 'Request message cannot exceed 500 characters']
  },
  
  requestedAt: {
    type: Date,
    default: Date.now
  },
  
  // Approval Information
  approvedAt: {
    type: Date
  },
  
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  approvalMessage: {
    type: String,
    trim: true,
    maxlength: [500, 'Approval message cannot exceed 500 characters']
  },
  
  // Session Completion
  startedAt: {
    type: Date
  },
  
  completedAt: {
    type: Date
  },
  
  actualDuration: {
    type: Number, // in minutes
    min: [0, 'Actual duration cannot be negative']
  },
  
  completionNotes: {
    teacher: {
      type: String,
      trim: true,
      maxlength: [1000, 'Teacher notes cannot exceed 1000 characters']
    },
    student: {
      type: String,
      trim: true,
      maxlength: [1000, 'Student notes cannot exceed 1000 characters']
    }
  },
  
  // Completion Request (initiated by learner)
  completionRequest: {
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    requestedAt: {
      type: Date
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'rejected'],
      default: 'pending'
    },
    confirmedAt: {
      type: Date
    },
    rejectedAt: {
      type: Date
    },
    rejectionReason: {
      type: String,
      trim: true,
      maxlength: [500, 'Rejection reason cannot exceed 500 characters']
    }
  },
  
  // Cancellation
  cancelledAt: {
    type: Date
  },
  
  cancelledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  cancellationReason: {
    type: String,
    trim: true,
    maxlength: [500, 'Cancellation reason cannot exceed 500 characters']
  },
  
  // Payment/Credit Transfer
  creditsTransferred: {
    type: Boolean,
    default: false
  },
  
  transferredAt: {
    type: Date
  },
  
  // Reminders
  reminders: [{
    type: {
      type: String,
      enum: ['email', 'push', 'sms']
    },
    sentAt: {
      type: Date
    },
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  
  // Session Materials
  materials: [{
    name: {
      type: String,
      required: true
    },
    url: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['document', 'video', 'link', 'image'],
      default: 'document'
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Feedback
  feedback: {
    teacher: {
      rating: {
        type: Number,
        min: [1, 'Rating must be at least 1'],
        max: [5, 'Rating cannot exceed 5']
      },
      comment: {
        type: String,
        trim: true,
        maxlength: [500, 'Feedback cannot exceed 500 characters']
      },
      submittedAt: {
        type: Date
      }
    },
    student: {
      rating: {
        type: Number,
        min: [1, 'Rating must be at least 1'],
        max: [5, 'Rating cannot exceed 5']
      },
      comment: {
        type: String,
        trim: true,
        maxlength: [500, 'Feedback cannot exceed 500 characters']
      },
      submittedAt: {
        type: Date
      }
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
sessionSchema.index({ teacher: 1, status: 1 });
sessionSchema.index({ student: 1, status: 1 });
sessionSchema.index({ skill: 1 });
sessionSchema.index({ scheduledDate: 1 });
sessionSchema.index({ status: 1 });
sessionSchema.index({ createdAt: -1 });

// Virtual for session duration in hours
sessionSchema.virtual('durationHours').get(function() {
  return this.duration / 60;
});

// Virtual for actual duration in hours
sessionSchema.virtual('actualDurationHours').get(function() {
  return this.actualDuration ? this.actualDuration / 60 : null;
});

// Virtual for is upcoming
sessionSchema.virtual('isUpcoming').get(function() {
  return this.status === 'approved' || this.status === 'confirmed';
});

// Virtual for is completed
sessionSchema.virtual('isCompleted').get(function() {
  return this.status === 'completed';
});

// Virtual for can be cancelled
sessionSchema.virtual('canBeCancelled').get(function() {
  const now = new Date();
  const sessionTime = new Date(`${this.scheduledDate}T${this.startTime}`);
  const hoursUntilSession = (sessionTime - now) / (1000 * 60 * 60);
  
  return (this.status === 'approved' || this.status === 'confirmed') && 
         hoursUntilSession > 2; // Can cancel if more than 2 hours before
});

// Pre-save middleware to calculate total credits
sessionSchema.pre('save', function(next) {
  if (this.isModified('duration') || this.isModified('creditsPerHour')) {
    this.totalCredits = Math.ceil((this.duration / 60) * this.creditsPerHour);
  }
  next();
});

// Static method to get upcoming sessions
sessionSchema.statics.getUpcomingSessions = function(userId, role = 'both') {
  const query = {
    scheduledDate: { $gte: new Date() },
    status: { $in: ['approved', 'confirmed'] }
  };
  
  if (role === 'teacher') {
    query.teacher = userId;
  } else if (role === 'student') {
    query.student = userId;
  } else {
    query.$or = [{ teacher: userId }, { student: userId }];
  }
  
  return this.find(query)
    .populate('teacher', 'name profileImage')
    .populate('student', 'name profileImage')
    .populate('skill', 'title category')
    .sort({ scheduledDate: 1, startTime: 1 });
};

// Static method to get session history
sessionSchema.statics.getSessionHistory = function(userId, role = 'both', limit = 20) {
  const query = {
    status: { $in: ['completed', 'cancelled', 'no-show'] }
  };
  
  if (role === 'teacher') {
    query.teacher = userId;
  } else if (role === 'student') {
    query.student = userId;
  } else {
    query.$or = [{ teacher: userId }, { student: userId }];
  }
  
  return this.find(query)
    .populate('teacher', 'name profileImage')
    .populate('student', 'name profileImage')
    .populate('skill', 'title category')
    .sort({ completedAt: -1, createdAt: -1 })
    .limit(limit);
};

// Instance method to approve session
sessionSchema.methods.approve = function(approvedBy, message = '') {
  this.status = 'approved';
  this.approvedAt = new Date();
  this.approvedBy = approvedBy;
  this.approvalMessage = message;
  return this.save();
};

// Instance method to confirm session
sessionSchema.methods.confirm = function() {
  this.status = 'confirmed';
  return this.save();
};

// Instance method to start session
sessionSchema.methods.start = function() {
  this.status = 'in-progress';
  this.startedAt = new Date();
  return this.save();
};

// Instance method to complete session
sessionSchema.methods.complete = function(actualDuration) {
  this.status = 'completed';
  this.completedAt = new Date();
  this.actualDuration = actualDuration || this.duration;
  return this.save();
};

// Instance method to request completion (by learner)
sessionSchema.methods.requestCompletion = function(requestedBy) {
  this.completionRequest = {
    requestedBy: requestedBy,
    requestedAt: new Date(),
    status: 'pending'
  };
  return this.save();
};

// Instance method to confirm completion request (by teacher)
sessionSchema.methods.confirmCompletion = function(actualDuration) {
  if (!this.completionRequest || this.completionRequest.status !== 'pending') {
    throw new Error('No pending completion request found');
  }
  
  this.completionRequest.status = 'confirmed';
  this.completionRequest.confirmedAt = new Date();
  this.status = 'completed';
  this.completedAt = new Date();
  this.actualDuration = actualDuration || this.duration;
  return this.save();
};

// Instance method to reject completion request (by teacher)
sessionSchema.methods.rejectCompletion = function(reason = '') {
  if (!this.completionRequest || this.completionRequest.status !== 'pending') {
    throw new Error('No pending completion request found');
  }
  
  this.completionRequest.status = 'rejected';
  this.completionRequest.rejectedAt = new Date();
  this.completionRequest.rejectionReason = reason;
  return this.save();
};

// Instance method to cancel session
sessionSchema.methods.cancel = function(cancelledBy, reason = '') {
  this.status = 'cancelled';
  this.cancelledAt = new Date();
  this.cancelledBy = cancelledBy;
  this.cancellationReason = reason;
  return this.save();
};

// Instance method to transfer credits
sessionSchema.methods.transferCredits = async function() {
  if (this.creditsTransferred || this.status !== 'completed') {
    throw new Error('Credits cannot be transferred for this session');
  }
  
  // Transfer credits from student to teacher
  const User = mongoose.model('User');
  
  await Promise.all([
    User.findByIdAndUpdate(this.student, { 
      $inc: { timeCredits: -this.totalCredits } 
    }),
    User.findByIdAndUpdate(this.teacher, { 
      $inc: { timeCredits: this.totalCredits } 
    })
  ]);
  
  this.creditsTransferred = true;
  this.transferredAt = new Date();
  
  return this.save();
};

module.exports = mongoose.model('Session', sessionSchema);
