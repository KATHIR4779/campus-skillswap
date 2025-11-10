const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Message = require('../models/Message');
const MessageThread = require('../models/MessageThread');
const { protect } = require('../middleware/auth');
const { validateMessageCreation, validatePagination, validateObjectId } = require('../middleware/validation');

const router = express.Router();

// Configure multer for message file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '../../uploads/messages');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `message-${req.user.id}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const fileFilter = (req, file, cb) => {
  // Allow images, documents, and common file types
  const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt|zip|rar/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  
  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error('Only images and documents are allowed'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024 // 10MB
  },
  fileFilter: fileFilter
});

// @desc    Get single message thread
// @route   GET /api/messages/threads/:id
// @access  Private
router.get('/threads/:id', protect, validateObjectId('id'), async (req, res) => {
  try {
    const thread = await MessageThread.findById(req.params.id)
      .populate('participants.user', 'name profileImage isActive')
      .populate('lastMessage')
      .populate('session', 'title scheduledDate skill');
    
    if (!thread) {
      return res.status(404).json({
        success: false,
        message: 'Thread not found'
      });
    }
    
    // Check if user is participant in the thread
    const isParticipant = thread.participants.some(
      participant => participant.user._id.toString() === req.user.id.toString()
    );
    
    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this thread'
      });
    }
    
    res.json({
      success: true,
      data: thread
    });
    
  } catch (error) {
    console.error('Get message thread error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve message thread'
    });
  }
});

// @desc    Get user's message threads
// @route   GET /api/messages/threads
// @access  Private
router.get('/threads', protect, validatePagination, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    const threads = await MessageThread.getUserThreads(req.user.id, { limit, skip });
    
    res.json({
      success: true,
      count: threads.length,
      data: threads
    });
    
  } catch (error) {
    console.error('Get message threads error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve message threads'
    });
  }
});

// @desc    Get conversation between two users
// @route   GET /api/messages/conversation/:userId
// @access  Private
router.get('/conversation/:userId', protect, validateObjectId('userId'), validatePagination, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;
    
    const messages = await Message.getConversation(req.user.id, req.params.userId, { limit, skip });
    
    // Mark messages as read
    await Message.markAsRead(req.user.id, req.params.userId);
    
    res.json({
      success: true,
      count: messages.length,
      data: messages
    });
    
  } catch (error) {
    console.error('Get conversation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve conversation'
    });
  }
});

// @desc    Send message
// @route   POST /api/messages
// @access  Private
router.post('/', protect, validateMessageCreation, async (req, res) => {
  try {
    const { recipient, content, type = 'text', priority = 'normal', session } = req.body;
    
    // Log the request for debugging
    console.log('Send message request:', { 
      recipient, 
      content, 
      type, 
      priority, 
      session, 
      userId: req.user.id,
      body: req.body
    });
    
    // Validate recipient
    if (!recipient) {
      return res.status(400).json({
        success: false,
        message: 'Recipient is required'
      });
    }
    
    // Check if recipient exists and is active
    const User = require('../models/User');
    const recipientUser = await User.findById(recipient);
    
    console.log('Recipient user found:', recipientUser);
    
    if (!recipientUser || !recipientUser.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Recipient not found or inactive'
      });
    }
    
    // Find or create direct message thread
    let thread;
    try {
      console.log('Attempting to find or create thread for users:', {
        sender: req.user.id,
        recipient: recipient
      });
      thread = await MessageThread.findOrCreateDirectThread(req.user.id, recipient);
      console.log('Thread created/found successfully:', thread);
    } catch (threadError) {
      console.error('Error creating thread:', threadError);
      return res.status(500).json({
        success: false,
        message: 'Failed to create message thread: ' + threadError.message
      });
    }
    
    // Create message
    console.log('Creating message with data:', {
      content: content,
      sender: req.user.id,
      recipient: recipient,
      type: type,
      priority: priority,
      thread: thread._id,
      session: session
    });
    
    const message = await Message.create({
      content: content,
      sender: req.user.id,
      recipient: recipient,
      type: type,
      priority: priority,
      thread: thread._id,
      session: session
    });
    
    console.log('Message created:', message);
    
    // Populate message data
    await message.populate([
      { path: 'sender', select: 'name profileImage' },
      { path: 'recipient', select: 'name profileImage' },
      { path: 'session', select: 'title scheduledDate' }
    ]);
    
    // Update thread's last message
    thread.lastMessage = message._id;
    thread.lastMessageAt = message.createdAt;
    thread.stats.totalMessages += 1;
    await thread.save();
    
    // Emit real-time message to recipient
    const io = req.app.get('io');
    if (io) {
      io.to(`user-${recipient}`).emit('newMessage', message);
    }
    
    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: message
    });
    
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send message: ' + error.message
    });
  }
});

// @desc    Send message with file attachment
// @route   POST /api/messages/upload
// @access  Private
router.post('/upload', protect, upload.single('file'), async (req, res) => {
  try {
    const { recipient, content = '' } = req.body;
    
    if (!recipient) {
      return res.status(400).json({
        success: false,
        message: 'Recipient is required'
      });
    }
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }
    
    // Check if recipient exists and is active
    const User = require('../models/User');
    const recipientUser = await User.findById(recipient);
    
    if (!recipientUser || !recipientUser.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Recipient not found or inactive'
      });
    }
    
    // Find or create direct message thread
    let thread = await MessageThread.findOrCreateDirectThread(req.user.id, recipient);
    
    // Create file URL
    const fileUrl = `/uploads/messages/${req.file.filename}`;
    
    // Determine message type based on file type
    let messageType = 'file';
    const imageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    if (imageTypes.includes(req.file.mimetype)) {
      messageType = 'image';
    }
    
    // Create message with file attachment
    const message = await Message.create({
      content: content || `Sent a file: ${req.file.originalname}`,
      sender: req.user.id,
      recipient: recipient,
      type: messageType,
      thread: thread._id,
      attachments: [{
        filename: req.file.filename,
        originalName: req.file.originalname,
        url: fileUrl,
        size: req.file.size,
        mimeType: req.file.mimetype
      }]
    });
    
    // Populate message data
    await message.populate([
      { path: 'sender', select: 'name profileImage' },
      { path: 'recipient', select: 'name profileImage' }
    ]);
    
    // Update thread's last message
    thread.lastMessage = message._id;
    thread.lastMessageAt = message.createdAt;
    thread.stats.totalMessages += 1;
    await thread.save();
    
    // Emit real-time message to recipient
    const io = req.app.get('io');
    if (io) {
      io.to(`user-${recipient}`).emit('newMessage', message);
    }
    
    res.status(201).json({
      success: true,
      message: 'Message with file sent successfully',
      data: message
    });
    
  } catch (error) {
    console.error('Send message with file error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send message with file'
    });
  }
});

// @desc    Get unread message count
// @route   GET /api/messages/unread-count
// @access  Private
router.get('/unread-count', protect, async (req, res) => {
  try {
    const unreadCount = await Message.getUnreadCount(req.user.id);
    
    res.json({
      success: true,
      data: { unreadCount }
    });
    
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve unread count'
    });
  }
});

// @desc    Mark messages as read
// @route   PUT /api/messages/mark-read
// @access  Private
router.put('/mark-read', protect, async (req, res) => {
  try {
    const { senderId } = req.body;
    
    await Message.markAsRead(req.user.id, senderId);
    
    res.json({
      success: true,
      message: 'Messages marked as read'
    });
    
  } catch (error) {
    console.error('Mark messages as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark messages as read'
    });
  }
});

// @desc    Get single message
// @route   GET /api/messages/:id
// @access  Private
router.get('/:id', protect, validateObjectId('id'), async (req, res) => {
  try {
    const message = await Message.findById(req.params.id)
      .populate('sender', 'name profileImage')
      .populate('recipient', 'name profileImage')
      .populate('session', 'title scheduledDate');
    
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }
    
    // Check if user is sender or recipient
    const isSender = message.sender._id.toString() === req.user.id.toString();
    const isRecipient = message.recipient._id.toString() === req.user.id.toString();
    
    if (!isSender && !isRecipient) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this message'
      });
    }
    
    // Mark as read if user is recipient
    if (isRecipient && !message.isRead) {
      await message.markAsRead();
    }
    
    res.json({
      success: true,
      data: message
    });
    
  } catch (error) {
    console.error('Get message error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve message'
    });
  }
});

// @desc    Update message (for reactions, etc.)
// @route   PUT /api/messages/:id
// @access  Private
router.put('/:id', protect, validateObjectId('id'), async (req, res) => {
  try {
    const { action, emoji } = req.body;
    
    const message = await Message.findById(req.params.id);
    
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }
    
    // Check if user is sender or recipient
    const isSender = message.sender.toString() === req.user.id.toString();
    const isRecipient = message.recipient.toString() === req.user.id.toString();
    
    if (!isSender && !isRecipient) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this message'
      });
    }
    
    if (action === 'addReaction') {
      if (!emoji) {
        return res.status(400).json({
          success: false,
          message: 'Emoji is required for reaction'
        });
      }
      await message.addReaction(req.user.id, emoji);
    } else if (action === 'removeReaction') {
      await message.removeReaction(req.user.id);
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid action'
      });
    }
    
    // Emit real-time update
    const io = req.app.get('io');
    if (io) {
      const recipientId = isSender ? message.recipient : message.sender;
      io.to(`user-${recipientId}`).emit('messageUpdated', {
        messageId: message._id,
        reactions: message.getReactionsSummary()
      });
    }
    
    res.json({
      success: true,
      message: 'Message updated successfully',
      data: {
        reactions: message.getReactionsSummary()
      }
    });
    
  } catch (error) {
    console.error('Update message error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update message'
    });
  }
});

// @desc    Delete message
// @route   DELETE /api/messages/:id
// @access  Private
router.delete('/:id', protect, validateObjectId('id'), async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);
    
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }
    
    // Check if user is sender
    if (message.sender.toString() !== req.user.id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the sender can delete this message'
      });
    }
    
    // Soft delete
    await message.softDelete(req.user.id);
    
    // Emit real-time update
    const io = req.app.get('io');
    if (io) {
      io.to(`user-${message.recipient}`).emit('messageDeleted', {
        messageId: message._id
      });
    }
    
    res.json({
      success: true,
      message: 'Message deleted successfully'
    });
    
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete message'
    });
  }
});

// @desc    Create session thread
// @route   POST /api/messages/session-thread/:sessionId
// @access  Private
router.post('/session-thread/:sessionId', protect, validateObjectId('sessionId'), async (req, res) => {
  try {
    const Session = require('../models/Session');
    const session = await Session.findById(req.params.sessionId)
      .populate('teacher', 'name')
      .populate('student', 'name')
      .populate('skill', 'title');
    
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }
    
    // Check if user is part of the session
    const isTeacher = session.teacher._id.toString() === req.user.id.toString();
    const isStudent = session.student._id.toString() === req.user.id.toString();
    
    if (!isTeacher && !isStudent) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to create thread for this session'
      });
    }
    
    // Check if thread already exists
    let thread = await MessageThread.findOne({ session: req.params.sessionId });
    
    if (!thread) {
      thread = await MessageThread.createSessionThread(
        req.params.sessionId,
        session.teacher._id,
        session.student._id
      );
    }
    
    res.status(201).json({
      success: true,
      message: 'Session thread created successfully',
      data: thread
    });
    
  } catch (error) {
    console.error('Create session thread error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create session thread'
    });
  }
});

module.exports = router;
