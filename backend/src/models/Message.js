const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  // Message Information
  content: {
    type: String,
    required: [true, 'Message content is required'],
    trim: true,
    maxlength: [2000, 'Message cannot exceed 2000 characters']
  },
  
  // Participants
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Sender is required']
  },
  
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Recipient is required']
  },
  
  // Message Type
  type: {
    type: String,
    enum: [
      'text',
      'image',
      'file',
      'session_request',
      'session_approval',
      'session_rejection',
      'session_reminder',
      'session_completion',
      'system_notification'
    ],
    default: 'text'
  },
  
  // Related Session (if applicable)
  session: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Session'
  },
  
  // Message Status
  isRead: {
    type: Boolean,
    default: false
  },
  
  readAt: {
    type: Date
  },
  
  // Message Priority
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },
  
  // Attachments
  attachments: [{
    filename: {
      type: String,
      required: true
    },
    originalName: {
      type: String,
      required: true
    },
    url: {
      type: String,
      required: true
    },
    size: {
      type: Number,
      required: true
    },
    mimeType: {
      type: String,
      required: true
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Reply Information
  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  
  // Message Thread
  thread: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MessageThread'
  },
  
  // Message Reactions
  reactions: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    emoji: {
      type: String,
      required: true
    },
    reactedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Message Status (for system messages)
  status: {
    type: String,
    enum: ['sent', 'delivered', 'failed'],
    default: 'sent'
  },
  
  // Delivery Information
  deliveryAttempts: {
    type: Number,
    default: 0
  },
  
  lastDeliveryAttempt: {
    type: Date
  },
  
  // Message Metadata
  metadata: {
    // For session-related messages
    sessionData: {
      sessionId: String,
      sessionTitle: String,
      scheduledDate: Date,
      location: String
    },
    
    // For system notifications
    notificationData: {
      title: String,
      action: String,
      url: String
    },
    
    // For file messages
    fileData: {
      downloadCount: { type: Number, default: 0 },
      lastDownloadedAt: Date
    }
  },
  
  // Message Encryption (for sensitive messages)
  isEncrypted: {
    type: Boolean,
    default: false
  },
  
  encryptionKey: {
    type: String,
    select: false
  },
  
  // Message Moderation
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
    type: String
  },
  
  // Soft Delete
  isDeleted: {
    type: Boolean,
    default: false
  },
  
  deletedAt: {
    type: Date
  },
  
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
messageSchema.index({ sender: 1, recipient: 1, createdAt: -1 });
messageSchema.index({ recipient: 1, isRead: 1 });
messageSchema.index({ session: 1 });
messageSchema.index({ thread: 1, createdAt: 1 });
messageSchema.index({ type: 1 });
messageSchema.index({ createdAt: -1 });

// Virtual for message age
messageSchema.virtual('age').get(function() {
  const now = new Date();
  const diff = now - this.createdAt;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
});

// Virtual for sender name
messageSchema.virtual('senderName').get(function() {
  return this.populated('sender') ? this.sender.name : 'Unknown';
});

// Virtual for recipient name
messageSchema.virtual('recipientName').get(function() {
  return this.populated('recipient') ? this.recipient.name : 'Unknown';
});

// Static method to get conversation between two users
messageSchema.statics.getConversation = function(user1Id, user2Id, options = {}) {
  const query = {
    $or: [
      { sender: user1Id, recipient: user2Id },
      { sender: user2Id, recipient: user1Id }
    ],
    isDeleted: false
  };
  
  return this.find(query)
    .populate('sender', 'name profileImage')
    .populate('recipient', 'name profileImage')
    .populate('session', 'title scheduledDate')
    .sort({ createdAt: -1 })
    .limit(options.limit || 50)
    .skip(options.skip || 0);
};

// Static method to get unread messages count
messageSchema.statics.getUnreadCount = function(userId) {
  return this.countDocuments({
    recipient: userId,
    isRead: false,
    isDeleted: false
  });
};

// Static method to mark messages as read
messageSchema.statics.markAsRead = function(userId, senderId = null) {
  const query = {
    recipient: userId,
    isRead: false,
    isDeleted: false
  };
  
  if (senderId) {
    query.sender = senderId;
  }
  
  return this.updateMany(query, {
    isRead: true,
    readAt: new Date()
  });
};

// Static method to get message threads for a user
messageSchema.statics.getMessageThreads = function(userId, options = {}) {
  return this.aggregate([
    {
      $match: {
        $or: [
          { sender: mongoose.Types.ObjectId(userId) },
          { recipient: mongoose.Types.ObjectId(userId) }
        ],
        isDeleted: false
      }
    },
    {
      $sort: { createdAt: -1 }
    },
    {
      $group: {
        _id: {
          $cond: [
            { $eq: ['$sender', mongoose.Types.ObjectId(userId)] },
            '$recipient',
            '$sender'
          ]
        },
        lastMessage: { $first: '$$ROOT' },
        unreadCount: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $eq: ['$recipient', mongoose.Types.ObjectId(userId)] },
                  { $eq: ['$isRead', false] }
                ]
              },
              1,
              0
            ]
          }
        },
        totalMessages: { $sum: 1 }
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'user'
      }
    },
    {
      $unwind: '$user'
    },
    {
      $project: {
        user: {
          _id: 1,
          name: 1,
          profileImage: 1,
          isActive: 1
        },
        lastMessage: 1,
        unreadCount: 1,
        totalMessages: 1
      }
    },
    {
      $sort: { 'lastMessage.createdAt': -1 }
    },
    {
      $limit: options.limit || 20
    }
  ]);
};

// Instance method to add reaction
messageSchema.methods.addReaction = function(userId, emoji) {
  // Remove existing reaction from this user
  this.reactions = this.reactions.filter(r => r.user.toString() !== userId);
  
  // Add new reaction
  this.reactions.push({
    user: userId,
    emoji: emoji,
    reactedAt: new Date()
  });
  
  return this.save();
};

// Instance method to remove reaction
messageSchema.methods.removeReaction = function(userId) {
  this.reactions = this.reactions.filter(r => r.user.toString() !== userId);
  return this.save();
};

// Instance method to mark as read
messageSchema.methods.markAsRead = function() {
  if (!this.isRead) {
    this.isRead = true;
    this.readAt = new Date();
    return this.save();
  }
  return Promise.resolve(this);
};

// Instance method to soft delete
messageSchema.methods.softDelete = function(deletedBy) {
  this.isDeleted = true;
  this.deletedAt = new Date();
  this.deletedBy = deletedBy;
  return this.save();
};

// Instance method to get message reactions summary
messageSchema.methods.getReactionsSummary = function() {
  const summary = {};
  this.reactions.forEach(reaction => {
    if (!summary[reaction.emoji]) {
      summary[reaction.emoji] = {
        count: 0,
        users: []
      };
    }
    summary[reaction.emoji].count += 1;
    summary[reaction.emoji].users.push(reaction.user);
  });
  return summary;
};

module.exports = mongoose.model('Message', messageSchema);
