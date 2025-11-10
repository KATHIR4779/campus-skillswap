const express = require('express');
const Session = require('../models/Session');
const User = require('../models/User');
const Skill = require('../models/Skill');
const { protect, checkSessionAccess, checkCredits } = require('../middleware/auth');
const { validateSessionRequest, validateSessionUpdate, validatePagination, validateObjectId } = require('../middleware/validation');
const { sendEmail } = require('../utils/email');

// Utility function to format dates consistently as DD/MM/YYYY
function formatDate(date) {
  if (!date) return 'Unknown';
  const d = new Date(date);
  if (isNaN(d.getTime())) return 'Unknown';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

const router = express.Router();

// @desc    Get all sessions for a user
// @route   GET /api/sessions
// @access  Private
router.get('/', protect, validatePagination, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const { status, role = 'both' } = req.query;
    
    let sessions;
    let total;
    
    if (status === 'upcoming') {
      sessions = await Session.getUpcomingSessions(req.user.id, role);
      total = sessions.length;
      sessions = sessions.slice(skip, skip + limit);
    } else if (status === 'history') {
      sessions = await Session.getSessionHistory(req.user.id, role, limit);
      total = await Session.countDocuments({
        $or: [{ teacher: req.user.id }, { student: req.user.id }],
        status: { $in: ['completed', 'cancelled', 'no-show'] }
      });
      
      // Populate reviews for session history
      const Review = require('../models/Review');
      for (let session of sessions) {
        if (session.status === 'completed') {
          session._doc.reviews = await Review.find({ session: session._id })
            .populate('reviewer', 'name profileImage')
            .populate('reviewee', 'name profileImage');
        }
      }
    } else {
      // Get all sessions
      const query = {
        $or: [{ teacher: req.user.id }, { student: req.user.id }]
      };
      
      if (status) {
        query.status = status;
      }
      
      if (role === 'teacher') {
        query.teacher = req.user.id;
      } else if (role === 'student') {
        query.student = req.user.id;
      }
      
      sessions = await Session.find(query)
        .populate('teacher', 'name profileImage')
        .populate('student', 'name profileImage')
        .populate('skill', 'title category')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);
      
      // Populate reviews for completed sessions
      const Review = require('../models/Review');
      for (let session of sessions) {
        if (session.status === 'completed') {
          session._doc.reviews = await Review.find({ session: session._id })
            .populate('reviewer', 'name profileImage')
            .populate('reviewee', 'name profileImage');
        }
      }
      
      total = await Session.countDocuments(query);
    }
    
    res.json({
      success: true,
      count: sessions.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: sessions
    });
    
  } catch (error) {
    console.error('Get sessions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve sessions'
    });
  }
});

// @desc    Get single session
// @route   GET /api/sessions/:id
// @access  Private
router.get('/:id', protect, validateObjectId('id'), checkSessionAccess, async (req, res) => {
  try {
    // Session is already populated by checkSessionAccess middleware
    const session = req.session;
    
    // Populate additional fields
    await session.populate([
      { path: 'teacher', select: 'name profileImage email' },
      { path: 'student', select: 'name profileImage email' },
      { path: 'skill', select: 'title category description' }
    ]);
    
    res.json({
      success: true,
      data: session
    });
    
  } catch (error) {
    console.error('Get session error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve session'
    });
  }
});

// @desc    Request a new session
// @route   POST /api/sessions
// @access  Private
router.post('/', protect, validateSessionRequest, async (req, res) => {
  try {
    const { skill, scheduledDate, startTime, endTime, location, locationDetails, requestMessage } = req.body;
    
    // Get skill details
    const skillData = await Skill.findById(skill);
    if (!skillData || !skillData.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Skill not found or inactive'
      });
    }
    
    // Check if user is trying to request their own skill
    if (skillData.teacher.toString() === req.user.id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot request a session for your own skill'
      });
    }
    
    // Calculate session duration and credits
    const start = new Date(`${scheduledDate}T${startTime}`);
    const end = new Date(`${scheduledDate}T${endTime}`);
    const duration = (end - start) / (1000 * 60); // in minutes
    const totalCredits = Math.ceil((duration / 60) * skillData.creditsPerHour);
    
    // Check if user has sufficient credits
    if (req.user.timeCredits < totalCredits) {
      return res.status(400).json({
        success: false,
        message: `Insufficient credits. Required: ${totalCredits}, Available: ${req.user.timeCredits}`,
        insufficientCredits: true,
        requiredCredits: totalCredits,
        availableCredits: req.user.timeCredits
      });
    }
    
    // Check for scheduling conflicts
    const conflictQuery = {
      teacher: skillData.teacher,
      status: { $in: ['approved', 'confirmed', 'in-progress'] },
      scheduledDate: new Date(scheduledDate),
      $or: [
        {
          startTime: { $lt: endTime },
          endTime: { $gt: startTime }
        }
      ]
    };
    
    const existingSession = await Session.findOne(conflictQuery);
    if (existingSession) {
      return res.status(409).json({
        success: false,
        message: 'Teacher has a scheduling conflict at this time'
      });
    }
    
    // Create session request
    const session = await Session.create({
      title: `${skillData.title} Session`,
      description: `Session for ${skillData.title}`,
      teacher: skillData.teacher,
      student: req.user.id,
      skill: skill,
      creditsPerHour: skillData.creditsPerHour,
      duration: duration,
      totalCredits: totalCredits,
      scheduledDate: new Date(scheduledDate),
      startTime: startTime,
      endTime: endTime,
      location: location,
      locationDetails: locationDetails,
      requestMessage: requestMessage,
      status: 'pending'
    });
    
    // Populate session data
    await session.populate([
      { path: 'teacher', select: 'name profileImage email' },
      { path: 'student', select: 'name profileImage email' },
      { path: 'skill', select: 'title category' }
    ]);
    
    // Create a message for the session request
    try {
      const Message = require('../models/Message');
      const MessageThread = require('../models/MessageThread');
      
      // Find or create message thread between student and teacher
      let thread = await MessageThread.findOne({
        participants: {
          $all: [
            { $elemMatch: { 'user': req.user.id } },
            { $elemMatch: { 'user': skillData.teacher } }
          ]
        },
        type: 'direct'
      });
      
      if (!thread) {
        // Create new thread
        thread = new MessageThread({
          participants: [
            { user: req.user.id },
            { user: skillData.teacher }
          ],
          type: 'direct',
          createdBy: req.user.id
        });
        await thread.save();
      }
      
      // Create message in the thread
      const message = new Message({
        content: `New session request for "${skillData.title}" on ${formatDate(scheduledDate)} at ${startTime}. Message from student: ${requestMessage}`,
        sender: req.user.id,
        recipient: skillData.teacher,
        type: 'session_request',
        session: session._id,
        thread: thread._id,
        metadata: {
          sessionData: {
            sessionId: session._id,
            sessionTitle: session.title,
            scheduledDate: session.scheduledDate,
            location: session.location
          }
        }
      });
      
      await message.save();
      
      // Update thread stats
      thread.lastMessage = message._id;
      thread.lastMessageAt = new Date();
      thread.stats.totalMessages = await Message.countDocuments({ thread: thread._id });
      await thread.save();
    } catch (messageError) {
      console.error('Failed to create session request message:', messageError);
      // Don't fail the session request if message creation fails
    }
    
    // Send notification email to teacher
    try {
      const teacher = await User.findById(skillData.teacher);
      await sendEmail({
        email: teacher.email,
        subject: 'New Session Request - Campus SkillSwap',
        template: 'sessionRequest',
        data: {
          teacherName: teacher.name,
          studentName: req.user.name,
          skillTitle: skillData.title,
          scheduledDate: formatDate(scheduledDate),
          startTime: startTime,
          endTime: endTime,
          location: location,
          credits: totalCredits,
          requestMessage: requestMessage,
          dashboardUrl: `${process.env.FRONTEND_URL}/dashboard`
        }
      });
    } catch (emailError) {
      console.error('Failed to send session request email:', emailError);
      // Don't fail the request if email fails
    }
    
    res.status(201).json({
      success: true,
      message: 'Session request sent successfully',
      data: session
    });
    
  } catch (error) {
    console.error('Create session error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create session request'
    });
  }
});

// @desc    Update session status
// @route   PUT /api/sessions/:id
// @access  Private
router.put('/:id', protect, validateSessionUpdate, validateObjectId('id'), checkSessionAccess, async (req, res) => {
  try {
    // Session is already populated by checkSessionAccess middleware
    const session = req.session;
    
    await session.populate([
      { path: 'teacher', select: 'name email' },
      { path: 'student', select: 'name email' },
      { path: 'skill', select: 'title' }
    ]);
    
    const { status, approvalMessage, actualDuration, completionNotes, cancellationReason } = req.body;
    
    // Handle different status updates based on user role
    if (status === 'approved' && req.sessionRole === 'teacher') {
      await session.approve(req.user.id, approvalMessage);
      
      // Create approval message
      try {
        const Message = require('../models/Message');
        const MessageThread = require('../models/MessageThread');
        
        // Find message thread between student and teacher
        const thread = await MessageThread.findOne({
          participants: {
            $all: [
              { $elemMatch: { 'user': session.student } },
              { $elemMatch: { 'user': session.teacher } }
            ]
          },
          type: 'direct'
        });
        
        if (thread) {
          // Create message in the thread
          const message = new Message({
            content: `Your session request for "${session.skill.title}" has been approved. ${approvalMessage ? 'Message from teacher: ' + approvalMessage : ''}`,
            sender: session.teacher,
            recipient: session.student,
            type: 'session_approval',
            session: session._id,
            thread: thread._id,
            metadata: {
              sessionData: {
                sessionId: session._id,
                sessionTitle: session.title,
                scheduledDate: session.scheduledDate,
                location: session.location
              }
            }
          });
          
          await message.save();
          
          // Update thread stats
          thread.lastMessage = message._id;
          thread.lastMessageAt = new Date();
          thread.stats.totalMessages = await Message.countDocuments({ thread: thread._id });
          await thread.save();
        }
      } catch (messageError) {
        console.error('Failed to create session approval message:', messageError);
        // Don't fail the approval if message creation fails
      }
    } else if (status === 'confirmed' && (req.sessionRole === 'teacher' || req.sessionRole === 'student')) {
      await session.confirm();
    } else if (status === 'in-progress' && (req.sessionRole === 'teacher' || req.sessionRole === 'student')) {
      await session.start();
    } else if (status === 'completed' && (req.sessionRole === 'teacher' || req.sessionRole === 'student')) {
      await session.complete(actualDuration);
      
      // Transfer credits
      try {
        await session.transferCredits();
      } catch (creditError) {
        console.error('Credit transfer failed:', creditError);
        // Continue even if credit transfer fails
      }
    } else if (status === 'cancelled' && (req.sessionRole === 'teacher' || req.sessionRole === 'student')) {
      await session.cancel(req.user.id, cancellationReason);
      
      // Create cancellation message
      try {
        const Message = require('../models/Message');
        const MessageThread = require('../models/MessageThread');
        
        // Find message thread between student and teacher
        const thread = await MessageThread.findOne({
          participants: {
            $all: [
              { $elemMatch: { 'user': session.student } },
              { $elemMatch: { 'user': session.teacher } }
            ]
          },
          type: 'direct'
        });
        
        if (thread) {
          // Determine who cancelled the session
          const canceller = req.sessionRole === 'teacher' ? session.teacher : session.student;
          const recipient = req.sessionRole === 'teacher' ? session.student : session.teacher;
          
          // Create message in the thread
          const message = new Message({
            content: `The session for "${session.skill.title}" has been cancelled. ${cancellationReason ? 'Reason: ' + cancellationReason : ''}`,
            sender: canceller,
            recipient: recipient,
            type: 'session_rejection',
            session: session._id,
            thread: thread._id,
            metadata: {
              sessionData: {
                sessionId: session._id,
                sessionTitle: session.title,
                scheduledDate: session.scheduledDate,
                location: session.location
              }
            }
          });
          
          await message.save();
          
          // Update thread stats
          thread.lastMessage = message._id;
          thread.lastMessageAt = new Date();
          thread.stats.totalMessages = await Message.countDocuments({ thread: thread._id });
          await thread.save();
        }
      } catch (messageError) {
        console.error('Failed to create session cancellation message:', messageError);
        // Don't fail the cancellation if message creation fails
      }
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid status update or insufficient permissions'
      });
    }
    
    // Update completion notes if provided
    if (completionNotes) {
      if (req.sessionRole === 'teacher' && completionNotes.teacher) {
        session.completionNotes.teacher = completionNotes.teacher;
      }
      if (req.sessionRole === 'student' && completionNotes.student) {
        session.completionNotes.student = completionNotes.student;
      }
      await session.save();
    }
    
    // Send appropriate notifications
    try {
      if (status === 'approved') {
        await sendEmail({
          email: session.student.email,
          subject: 'Session Approved - Campus SkillSwap',
          template: 'sessionApproval',
          data: {
            studentName: session.student.name,
            skillTitle: session.skill.title,
            scheduledDate: formatDate(session.scheduledDate),
            startTime: session.startTime,
            teacherMessage: approvalMessage
          }
        });
      } else if (status === 'cancelled') {
        const recipientEmail = req.sessionRole === 'teacher' ? session.student.email : session.teacher.email;
        const recipientName = req.sessionRole === 'teacher' ? session.student.name : session.teacher.name;
        
        await sendEmail({
          email: recipientEmail,
          subject: 'Session Cancelled - Campus SkillSwap',
          template: 'sessionCancellation',
          data: {
            userName: recipientName,
            skillTitle: session.skill.title,
            scheduledDate: formatDate(session.scheduledDate),
            reason: cancellationReason
          }
        });
      }
    } catch (emailError) {
      console.error('Failed to send notification email:', emailError);
      // Don't fail the update if email fails
    }
    
    res.json({
      success: true,
      message: `Session ${status} successfully`,
      data: session
    });
    
  } catch (error) {
    console.error('Update session error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update session'
    });
  }
});

// @desc    Get session statistics
// @route   GET /api/sessions/stats
// @access  Private
router.get('/stats', protect, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const [
      totalSessions,
      upcomingSessions,
      completedSessions,
      cancelledSessions,
      totalCreditsEarned,
      totalCreditsSpent,
      averageRating
    ] = await Promise.all([
      Session.countDocuments({
        $or: [{ teacher: userId }, { student: userId }]
      }),
      Session.countDocuments({
        $or: [{ teacher: userId }, { student: userId }],
        status: { $in: ['approved', 'confirmed'] },
        scheduledDate: { $gte: new Date() }
      }),
      Session.countDocuments({
        $or: [{ teacher: userId }, { student: userId }],
        status: 'completed'
      }),
      Session.countDocuments({
        $or: [{ teacher: userId }, { student: userId }],
        status: 'cancelled'
      }),
      Session.aggregate([
        { $match: { teacher: userId, status: 'completed', creditsTransferred: true } },
        { $group: { _id: null, total: { $sum: '$totalCredits' } } }
      ]),
      Session.aggregate([
        { $match: { student: userId, status: 'completed', creditsTransferred: true } },
        { $group: { _id: null, total: { $sum: '$totalCredits' } } }
      ]),
      Session.aggregate([
        { $match: { teacher: userId, status: 'completed' } },
        {
          $lookup: {
            from: 'reviews',
            localField: '_id',
            foreignField: 'session',
            as: 'reviews'
          }
        },
        { $unwind: '$reviews' },
        { $group: { _id: null, avgRating: { $avg: '$reviews.rating' } } }
      ])
    ]);
    
    res.json({
      success: true,
      data: {
        totalSessions,
        upcomingSessions,
        completedSessions,
        cancelledSessions,
        totalCreditsEarned: totalCreditsEarned[0]?.total || 0,
        totalCreditsSpent: totalCreditsSpent[0]?.total || 0,
        averageRating: averageRating[0]?.avgRating || 0
      }
    });
    
  } catch (error) {
    console.error('Get session stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve session statistics'
    });
  }
});

// @desc    Request session completion (learner)
// @route   POST /api/sessions/:id/request-completion
// @access  Private
router.post('/:id/request-completion', protect, validateObjectId('id'), checkSessionAccess, async (req, res) => {
  try {
    const session = req.session;
    
    // Populate session data
    await session.populate([
      { path: 'teacher', select: 'name email' },
      { path: 'student', select: 'name email' },
      { path: 'skill', select: 'title' }
    ]);
    
    // Only student can request completion
    if (req.sessionRole !== 'student') {
      return res.status(403).json({
        success: false,
        message: 'Only the learner can request session completion'
      });
    }
    
    // Check if session is in valid state for completion request
    if (!['approved', 'confirmed', 'in-progress'].includes(session.status)) {
      return res.status(400).json({
        success: false,
        message: 'Session must be approved, confirmed or in-progress to request completion'
      });
    }
    
    // Check if there's already a pending completion request
    if (session.completionRequest && session.completionRequest.status === 'pending') {
      return res.status(400).json({
        success: false,
        message: 'A completion request is already pending for this session'
      });
    }
    
    // Request completion
    await session.requestCompletion(req.user.id);
    
    // Send email notification to teacher
    try {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
      await sendEmail({
        email: session.teacher.email,
        subject: 'Session Completion Confirmation Request - Campus SkillSwap',
        template: 'sessionCompletionRequest',
        data: {
          teacherName: session.teacher.name,
          studentName: session.student.name,
          skillTitle: session.skill.title,
          scheduledDate: session.scheduledDate.toLocaleDateString(),
          startTime: session.startTime,
          dashboardUrl: `${frontendUrl}/dashboard.html`
        }
      });
    } catch (emailError) {
      console.error('Failed to send completion request email:', emailError);
      // Don't fail the request if email fails
    }
    
    res.json({
      success: true,
      message: 'Completion request sent to teacher successfully',
      data: session
    });
    
  } catch (error) {
    console.error('Request completion error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to request session completion'
    });
  }
});

// @desc    Confirm session completion (teacher)
// @route   POST /api/sessions/:id/confirm-completion
// @access  Private
router.post('/:id/confirm-completion', protect, validateObjectId('id'), checkSessionAccess, async (req, res) => {
  try {
    const session = req.session;
    const { actualDuration } = req.body;
    
    // Populate session data
    await session.populate([
      { path: 'teacher', select: 'name email' },
      { path: 'student', select: 'name email' },
      { path: 'skill', select: 'title' }
    ]);
    
    // Only teacher can confirm completion
    if (req.sessionRole !== 'teacher') {
      return res.status(403).json({
        success: false,
        message: 'Only the teacher can confirm session completion'
      });
    }
    
    // Confirm completion
    await session.confirmCompletion(actualDuration);
    
    // Transfer credits
    try {
      await session.transferCredits();
    } catch (creditError) {
      console.error('Credit transfer failed:', creditError);
      // Continue even if credit transfer fails - will be handled separately
    }
    
    // Send email notification to student for rating/review
    try {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
      await sendEmail({
        email: session.student.email,
        subject: 'Session Completed - Please Rate Your Experience',
        template: 'sessionCompletionConfirmed',
        data: {
          studentName: session.student.name,
          teacherName: session.teacher.name,
          skillTitle: session.skill.title,
          dashboardUrl: `${frontendUrl}/dashboard.html?rateSession=${session._id}`
        }
      });
    } catch (emailError) {
      console.error('Failed to send completion confirmation email:', emailError);
      // Don't fail the confirmation if email fails
    }
    
    res.json({
      success: true,
      message: 'Session completion confirmed successfully',
      data: session,
      requiresReview: true // Indicate that student should be prompted for review
    });
    
  } catch (error) {
    console.error('Confirm completion error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to confirm session completion'
    });
  }
});

// @desc    Reject session completion (teacher)
// @route   POST /api/sessions/:id/reject-completion
// @access  Private
router.post('/:id/reject-completion', protect, validateObjectId('id'), checkSessionAccess, async (req, res) => {
  try {
    const session = req.session;
    const { rejectionReason } = req.body;
    
    // Populate session data
    await session.populate([
      { path: 'teacher', select: 'name email' },
      { path: 'student', select: 'name email' },
      { path: 'skill', select: 'title' }
    ]);
    
    // Only teacher can reject completion
    if (req.sessionRole !== 'teacher') {
      return res.status(403).json({
        success: false,
        message: 'Only the teacher can reject session completion'
      });
    }
    
    // Reject completion
    await session.rejectCompletion(rejectionReason);
    
    // Send email notification to student
    try {
      await sendEmail({
        email: session.student.email,
        subject: 'Session Completion Request Update - Campus SkillSwap',
        template: 'sessionCompletionRejected',
        data: {
          studentName: session.student.name,
          teacherName: session.teacher.name,
          skillTitle: session.skill.title,
          rejectionReason: rejectionReason || 'No reason provided'
        }
      });
    } catch (emailError) {
      console.error('Failed to send completion rejection email:', emailError);
      // Don't fail the rejection if email fails
    }
    
    res.json({
      success: true,
      message: 'Session completion request rejected',
      data: session
    });
    
  } catch (error) {
    console.error('Reject completion error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to reject session completion'
    });
  }
});

// @desc    Delete session
// @route   DELETE /api/sessions/:id
// @access  Private
router.delete('/:id', protect, validateObjectId('id'), checkSessionAccess, async (req, res) => {
  try {
    // Session is already populated by checkSessionAccess middleware
    const session = req.session;
    
    // Only allow deletion of pending sessions
    if (session.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Only pending sessions can be deleted'
      });
    }
    
    await Session.findByIdAndDelete(req.params.id);
    
    res.json({
      success: true,
      message: 'Session deleted successfully'
    });
    
  } catch (error) {
    console.error('Delete session error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete session'
    });
  }
});

module.exports = router;
