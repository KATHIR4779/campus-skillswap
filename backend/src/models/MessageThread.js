const mongoose = require('mongoose');

const messageThreadSchema = new mongoose.Schema({
  // Thread Information
  title: {
    type: String,
    trim: true,
    maxlength: [200, 'Thread title cannot exceed 200 characters']
  },
  
  // Participants
  participants: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    lastReadAt: {
      type: Date,
      default: Date.now
    },
    isActive: {
      type: Boolean,
      default: true
    },
    leftAt: {
      type: Date
    }
  }],
  
  // Thread Type
  type: {
    type: String,
    enum: ['direct', 'group', 'session', 'support'],
    default: 'direct'
  },
  
  // Related Session (if applicable)
  session: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Session'
  },
  
  // Thread Status
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Last Message
  lastMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  
  lastMessageAt: {
    type: Date,
    default: Date.now
  },
  
  // Thread Settings
  settings: {
    allowNewMembers: {
      type: Boolean,
      default: true
    },
    muteNotifications: {
      type: Boolean,
      default: false
    },
    archiveAfterDays: {
      type: Number,
      default: 30
    }
  },
  
  // Thread Metadata
  metadata: {
    // For session threads
    sessionData: {
      skillTitle: String,
      scheduledDate: Date,
      location: String
    },
    
    // For support threads
    supportData: {
      category: String,
      priority: String,
      status: String
    }
  },
  
  // Thread Statistics
  stats: {
    totalMessages: {
      type: Number,
      default: 0
    },
    unreadCount: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
messageThreadSchema.index({ 'participants.user': 1, isActive: 1 });
messageThreadSchema.index({ type: 1 });
messageThreadSchema.index({ session: 1 });
messageThreadSchema.index({ lastMessageAt: -1 });
messageThreadSchema.index({ createdAt: -1 });

// Virtual for thread participants count
messageThreadSchema.virtual('participantsCount').get(function() {
  return this.participants.filter(p => p.isActive).length;
});

// Virtual for thread display name
messageThreadSchema.virtual('displayName').get(function() {
  if (this.title) {
    return this.title;
  }
  
  if (this.type === 'direct' && this.participants.length === 2) {
    // For direct messages, show the other person's name
    return 'Direct Message';
  }
  
  return `Group Chat (${this.participantsCount} members)`;
});

// Static method to find or create direct message thread
messageThreadSchema.statics.findOrCreateDirectThread = async function(user1Id, user2Id) {
  try {
    console.log('findOrCreateDirectThread called with:', { user1Id, user2Id });
    
    // Validate user IDs before converting to ObjectId
    if (!user1Id || !user2Id) {
      throw new Error('Both user IDs are required');
    }
    
    // Check if user IDs are valid ObjectId strings
    if (!mongoose.Types.ObjectId.isValid(user1Id)) {
      throw new Error(`Invalid user1Id: ${user1Id}`);
    }
    
    if (!mongoose.Types.ObjectId.isValid(user2Id)) {
      throw new Error(`Invalid user2Id: ${user2Id}`);
    }
    
    // Normalize user IDs to ObjectId
    const userId1 = new mongoose.Types.ObjectId(user1Id);
    const userId2 = new mongoose.Types.ObjectId(user2Id);
    
    console.log('Converted to ObjectIds:', { userId1, userId2 });
    
    // Check if thread already exists between these two users
    let thread = await this.findOne({
      type: 'direct',
      isActive: true,
      $and: [
        { 'participants.user': userId1 },
        { 'participants.user': userId2 }
      ],
      // Ensure exactly 2 participants
      'participants': { $size: 2 }
    }).populate('participants.user', 'name profileImage');
    
    console.log('Existing thread found:', thread);
    
    if (!thread) {
      // Create new thread
      console.log('Creating new thread');
      thread = await this.create({
        type: 'direct',
        participants: [
          { user: userId1, joinedAt: new Date() },
          { user: userId2, joinedAt: new Date() }
        ],
        lastMessageAt: new Date()
      });
      
      console.log('New thread created:', thread);
      
      await thread.populate('participants.user', 'name profileImage');
    }
    
    return thread;
  } catch (error) {
    console.error('Error in findOrCreateDirectThread:', error);
    throw error;
  }
};

// Static method to get user's threads
messageThreadSchema.statics.getUserThreads = function(userId, options = {}) {
  const query = {
    'participants.user': userId,
    'participants.isActive': true,
    isActive: true
  };
  
  return this.find(query)
    .populate('participants.user', 'name profileImage isActive')
    .populate('lastMessage')
    .populate('session', 'title scheduledDate skill')
    .sort({ lastMessageAt: -1 })
    .limit(options.limit || 20)
    .skip(options.skip || 0);
};

// Static method to create session thread
messageThreadSchema.statics.createSessionThread = async function(sessionId, teacherId, studentId) {
  const Session = mongoose.model('Session');
  const session = await Session.findById(sessionId).populate('skill', 'title');
  
  if (!session) {
    throw new Error('Session not found');
  }
  
  const thread = await this.create({
    title: `Session: ${session.skill.title}`,
    type: 'session',
    session: sessionId,
    participants: [
      { user: teacherId, joinedAt: new Date() },
      { user: studentId, joinedAt: new Date() }
    ],
    metadata: {
      sessionData: {
        skillTitle: session.skill.title,
        scheduledDate: session.scheduledDate,
        location: session.location
      }
    }
  });
  
  return thread.populate('participants.user', 'name profileImage');
};

// Instance method to add participant
messageThreadSchema.methods.addParticipant = function(userId) {
  // Check if user is already a participant
  const existingParticipant = this.participants.find(p => p.user.toString() === userId);
  
  if (!existingParticipant) {
    this.participants.push({
      user: userId,
      joinedAt: new Date(),
      lastReadAt: new Date(),
      isActive: true
    });
    return this.save();
  }
  
  return Promise.resolve(this);
};

// Instance method to remove participant
messageThreadSchema.methods.removeParticipant = function(userId) {
  const participant = this.participants.find(p => p.user.toString() === userId);
  
  if (participant) {
    participant.isActive = false;
    participant.leftAt = new Date();
    return this.save();
  }
  
  return Promise.resolve(this);
};

// Instance method to update last read time
messageThreadSchema.methods.updateLastRead = function(userId) {
  const participant = this.participants.find(p => p.user.toString() === userId);
  
  if (participant) {
    participant.lastReadAt = new Date();
    return this.save();
  }
  
  return Promise.resolve(this);
};

// Instance method to get unread count for user
messageThreadSchema.methods.getUnreadCount = async function(userId) {
  const participant = this.participants.find(p => p.user.toString() === userId);
  
  if (!participant) {
    return 0;
  }
  
  const Message = mongoose.model('Message');
  return await Message.countDocuments({
    thread: this._id,
    recipient: userId,
    createdAt: { $gt: participant.lastReadAt },
    isRead: false,
    isDeleted: false
  });
};

// Instance method to archive thread
messageThreadSchema.methods.archive = function() {
  this.isActive = false;
  return this.save();
};

module.exports = mongoose.model('MessageThread', messageThreadSchema);






