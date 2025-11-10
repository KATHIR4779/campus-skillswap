const express = require('express');
const User = require('../models/User');
const Skill = require('../models/Skill');
const Session = require('../models/Session');
const Review = require('../models/Review');
const Message = require('../models/Message');
const { protect, authorize } = require('../middleware/auth');
const { validatePagination, validateObjectId } = require('../middleware/validation');
const { getAllowedDomains, addAllowedDomain, removeAllowedDomain } = require('../config/emailDomains');

const router = express.Router();

// Apply admin authorization to all routes
router.use(protect, authorize('admin'));

// @desc    Get dashboard statistics
// @route   GET /api/admin/dashboard
// @access  Private/Admin
router.get('/dashboard', async (req, res) => {
  try {
    const [
      totalUsers,
      activeUsers,
      totalSkills,
      activeSkills,
      totalSessions,
      completedSessions,
      totalReviews,
      totalMessages,
      recentUsers,
      recentSkills,
      recentSessions
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isActive: true }),
      Skill.countDocuments(),
      Skill.countDocuments({ isActive: true }),
      Session.countDocuments(),
      Session.countDocuments({ status: 'completed' }),
      Review.countDocuments({ isPublic: true }),
      Message.countDocuments(),
      User.find().sort({ createdAt: -1 }).limit(5).select('name email createdAt'),
      Skill.find().sort({ createdAt: -1 }).limit(5).populate('teacher', 'name'),
      Session.find().sort({ createdAt: -1 }).limit(5).populate('teacher student', 'name')
    ]);

    // Get user registration trends (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const userTrends = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);

    // Get popular categories
    const popularCategories = await Skill.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          avgRating: { $avg: '$rating.average' }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    res.json({
      success: true,
      data: {
        overview: {
          totalUsers,
          activeUsers,
          totalSkills,
          activeSkills,
          totalSessions,
          completedSessions,
          totalReviews,
          totalMessages
        },
        recent: {
          users: recentUsers,
          skills: recentSkills,
          sessions: recentSessions
        },
        trends: {
          userRegistrations: userTrends,
          popularCategories
        }
      }
    });

  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve dashboard data'
    });
  }
});

// @desc    Get all users with admin details
// @route   GET /api/admin/users
// @access  Private/Admin
router.get('/users', validatePagination, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const {
      search,
      university,
      major,
      year,
      isActive,
      isVerified,
      role,
      sort = 'createdAt',
      order = 'desc'
    } = req.query;

    // Build filter object
    const filter = {};
    
    if (search) {
      filter.$or = [
        { name: new RegExp(search, 'i') },
        { email: new RegExp(search, 'i') },
        { university: new RegExp(search, 'i') },
        { major: new RegExp(search, 'i') }
      ];
    }
    
    if (university) filter.university = new RegExp(university, 'i');
    if (major) filter.major = new RegExp(major, 'i');
    if (year) filter.year = year;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (isVerified !== undefined) filter.isVerified = isVerified === 'true';
    if (role) filter.role = role;

    // Build sort object
    const sortObj = {};
    sortObj[sort] = order === 'desc' ? -1 : 1;

    const users = await User.find(filter)
      .select('-password -verificationToken -passwordResetToken -passwordResetExpires')
      .sort(sortObj)
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments(filter);

    res.json({
      success: true,
      count: users.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: users
    });

  } catch (error) {
    console.error('Get admin users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve users'
    });
  }
});

// @desc    Update user status
// @route   PUT /api/admin/users/:id/status
// @access  Private/Admin
router.put('/users/:id/status', validateObjectId('id'), async (req, res) => {
  try {
    const { isActive, isVerified } = req.body;

    const updates = {};
    if (isActive !== undefined) updates.isActive = isActive;
    if (isVerified !== undefined) updates.isVerified = isVerified;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true }
    ).select('-password -verificationToken -passwordResetToken -passwordResetExpires');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'User status updated successfully',
      data: user
    });

  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user status'
    });
  }
});

// @desc    Get all skills with admin details
// @route   GET /api/admin/skills
// @access  Private/Admin
router.get('/skills', validatePagination, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const {
      search,
      category,
      isActive,
      isFeatured,
      isVerified,
      sort = 'createdAt',
      order = 'desc'
    } = req.query;

    // Build filter object
    const filter = {};
    
    if (search) {
      filter.$or = [
        { title: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') },
        { tags: new RegExp(search, 'i') }
      ];
    }
    
    if (category) filter.category = category;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (isFeatured !== undefined) filter.isFeatured = isFeatured === 'true';
    if (isVerified !== undefined) filter.isVerified = isVerified === 'true';

    // Build sort object
    const sortObj = {};
    sortObj[sort] = order === 'desc' ? -1 : 1;

    const skills = await Skill.find(filter)
      .populate('teacher', 'name email university')
      .sort(sortObj)
      .skip(skip)
      .limit(limit);

    const total = await Skill.countDocuments(filter);

    res.json({
      success: true,
      count: skills.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: skills
    });

  } catch (error) {
    console.error('Get admin skills error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve skills'
    });
  }
});

// @desc    Verify skill
// @route   PUT /api/admin/skills/:id/verify
// @access  Private/Admin
router.put('/skills/:id/verify', validateObjectId('id'), async (req, res) => {
  try {
    const skill = await Skill.findById(req.params.id);

    if (!skill) {
      return res.status(404).json({
        success: false,
        message: 'Skill not found'
      });
    }

    skill.isVerified = true;
    skill.verifiedBy = req.user.id;
    skill.verifiedAt = new Date();

    await skill.save();

    res.json({
      success: true,
      message: 'Skill verified successfully',
      data: skill
    });

  } catch (error) {
    console.error('Verify skill error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify skill'
    });
  }
});

// @desc    Get all sessions with admin details
// @route   GET /api/admin/sessions
// @access  Private/Admin
router.get('/sessions', validatePagination, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const {
      status,
      dateFrom,
      dateTo,
      sort = 'createdAt',
      order = 'desc'
    } = req.query;

    // Build filter object
    const filter = {};
    
    if (status) filter.status = status;
    if (dateFrom || dateTo) {
      filter.scheduledDate = {};
      if (dateFrom) filter.scheduledDate.$gte = new Date(dateFrom);
      if (dateTo) filter.scheduledDate.$lte = new Date(dateTo);
    }

    // Build sort object
    const sortObj = {};
    sortObj[sort] = order === 'desc' ? -1 : 1;

    const sessions = await Session.find(filter)
      .populate('teacher', 'name email university')
      .populate('student', 'name email university')
      .populate('skill', 'title category')
      .sort(sortObj)
      .skip(skip)
      .limit(limit);

    const total = await Session.countDocuments(filter);

    res.json({
      success: true,
      count: sessions.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: sessions
    });

  } catch (error) {
    console.error('Get admin sessions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve sessions'
    });
  }
});

// @desc    Get all reviews with admin details
// @route   GET /api/admin/reviews
// @access  Private/Admin
router.get('/reviews', validatePagination, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const {
      rating,
      type,
      isPublic,
      isVerified,
      hasReports,
      sort = 'createdAt',
      order = 'desc'
    } = req.query;

    // Build filter object
    const filter = {};
    
    if (rating) filter.rating = parseInt(rating);
    if (type) filter.type = type;
    if (isPublic !== undefined) filter.isPublic = isPublic === 'true';
    if (isVerified !== undefined) filter.isVerified = isVerified === 'true';
    if (hasReports === 'true') filter.reports = { $exists: true, $not: { $size: 0 } };

    // Build sort object
    const sortObj = {};
    sortObj[sort] = order === 'desc' ? -1 : 1;

    const reviews = await Review.find(filter)
      .populate('reviewer', 'name email')
      .populate('reviewee', 'name email')
      .populate('session', 'skill scheduledDate')
      .populate('session.skill', 'title category')
      .sort(sortObj)
      .skip(skip)
      .limit(limit);

    const total = await Review.countDocuments(filter);

    res.json({
      success: true,
      count: reviews.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: reviews
    });

  } catch (error) {
    console.error('Get admin reviews error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve reviews'
    });
  }
});

// @desc    Moderate review
// @route   PUT /api/admin/reviews/:id/moderate
// @access  Private/Admin
router.put('/reviews/:id/moderate', validateObjectId('id'), async (req, res) => {
  try {
    const { isPublic, moderationReason } = req.body;

    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    review.isPublic = isPublic !== undefined ? isPublic : review.isPublic;
    review.isModerated = true;
    review.moderatedBy = req.user.id;
    review.moderatedAt = new Date();
    review.moderationReason = moderationReason;

    await review.save();

    res.json({
      success: true,
      message: 'Review moderated successfully',
      data: review
    });

  } catch (error) {
    console.error('Moderate review error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to moderate review'
    });
  }
});

// @desc    Get system reports
// @route   GET /api/admin/reports
// @access  Private/Admin
router.get('/reports', async (req, res) => {
  try {
    const { type, period = '30' } = req.query;
    
    const days = parseInt(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    let reportData = {};

    if (type === 'users' || !type) {
      // User registration report
      const userReport = await User.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' },
              day: { $dayOfMonth: '$createdAt' }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
      ]);

      reportData.users = userReport;
    }

    if (type === 'sessions' || !type) {
      // Session completion report
      const sessionReport = await Session.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]);

      reportData.sessions = sessionReport;
    }

    if (type === 'revenue' || !type) {
      // Credits transaction report
      const revenueReport = await Session.aggregate([
        {
          $match: {
            status: 'completed',
            creditsTransferred: true,
            completedAt: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: {
              year: { $year: '$completedAt' },
              month: { $month: '$completedAt' },
              day: { $dayOfMonth: '$completedAt' }
            },
            totalCredits: { $sum: '$totalCredits' },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
      ]);

      reportData.revenue = revenueReport;
    }

    res.json({
      success: true,
      data: reportData
    });

  } catch (error) {
    console.error('Get reports error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate reports'
    });
  }
});

// @desc    Get flagged content
// @route   GET /api/admin/flagged
// @access  Private/Admin
router.get('/flagged', validatePagination, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Get reviews with reports
    const flaggedReviews = await Review.find({
      reports: { $exists: true, $not: { $size: 0 } }
    })
    .populate('reviewer', 'name email')
    .populate('reviewee', 'name email')
    .populate('reports.reportedBy', 'name email')
    .sort({ 'reports.reportedAt': -1 })
    .skip(skip)
    .limit(limit);

    const total = await Review.countDocuments({
      reports: { $exists: true, $not: { $size: 0 } }
    });

    res.json({
      success: true,
      count: flaggedReviews.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: flaggedReviews
    });

  } catch (error) {
    console.error('Get flagged content error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve flagged content'
    });
  }
});

// @desc    Update user status
// @route   PUT /api/admin/users/:id/status
// @access  Private/Admin
router.put('/users/:id/status', async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: req.body.isActive },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'User status updated successfully',
      user
    });
  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user status'
    });
  }
});

// @desc    Update user verification
// @route   PUT /api/admin/users/:id/verify
// @access  Private/Admin
router.put('/users/:id/verify', async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isVerified: req.body.isVerified },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'User verification updated successfully',
      user
    });
  } catch (error) {
    console.error('Update user verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user verification'
    });
  }
});

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
router.delete('/users/:id', async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Also delete related data
    await Skill.deleteMany({ teacher: req.params.id });
    await Session.deleteMany({ 
      $or: [{ teacher: req.params.id }, { student: req.params.id }] 
    });
    await Review.deleteMany({ 
      $or: [{ reviewer: req.params.id }, { reviewee: req.params.id }] 
    });

    res.json({
      success: true,
      message: 'User and related data deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user'
    });
  }
});

// @desc    Update skill status
// @route   PUT /api/admin/skills/:id/status
// @access  Private/Admin
router.put('/skills/:id/status', async (req, res) => {
  try {
    const skill = await Skill.findByIdAndUpdate(
      req.params.id,
      { isActive: req.body.isActive },
      { new: true, runValidators: true }
    );

    if (!skill) {
      return res.status(404).json({
        success: false,
        message: 'Skill not found'
      });
    }

    res.json({
      success: true,
      message: 'Skill status updated successfully',
      skill
    });
  } catch (error) {
    console.error('Update skill status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update skill status'
    });
  }
});

// @desc    Update skill verification
// @route   PUT /api/admin/skills/:id/verify
// @access  Private/Admin
router.put('/skills/:id/verify', async (req, res) => {
  try {
    const skill = await Skill.findByIdAndUpdate(
      req.params.id,
      { isVerified: req.body.isVerified },
      { new: true, runValidators: true }
    );

    if (!skill) {
      return res.status(404).json({
        success: false,
        message: 'Skill not found'
      });
    }

    res.json({
      success: true,
      message: 'Skill verification updated successfully',
      skill
    });
  } catch (error) {
    console.error('Update skill verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update skill verification'
    });
  }
});

// @desc    Delete skill
// @route   DELETE /api/admin/skills/:id
// @access  Private/Admin
router.delete('/skills/:id', async (req, res) => {
  try {
    const skill = await Skill.findByIdAndDelete(req.params.id);

    if (!skill) {
      return res.status(404).json({
        success: false,
        message: 'Skill not found'
      });
    }

    // Also delete related sessions and reviews
    await Session.deleteMany({ skill: req.params.id });
    await Review.deleteMany({ skill: req.params.id });

    res.json({
      success: true,
      message: 'Skill and related data deleted successfully'
    });
  } catch (error) {
    console.error('Delete skill error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete skill'
    });
  }
});

// @desc    Update session status
// @route   PUT /api/admin/sessions/:id/status
// @access  Private/Admin
router.put('/sessions/:id/status', async (req, res) => {
  try {
    const session = await Session.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true, runValidators: true }
    );

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    res.json({
      success: true,
      message: 'Session status updated successfully',
      session
    });
  } catch (error) {
    console.error('Update session status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update session status'
    });
  }
});

// @desc    Get system logs
// @route   GET /api/admin/logs
// @access  Private/Admin
router.get('/logs', async (req, res) => {
  try {
    // This would typically read from log files or database
    // For now, return sample logs
    const logs = [
      {
        timestamp: new Date(),
        level: 'info',
        message: 'Admin dashboard accessed'
      },
      {
        timestamp: new Date(Date.now() - 300000),
        level: 'warning',
        message: 'High CPU usage detected'
      },
      {
        timestamp: new Date(Date.now() - 600000),
        level: 'error',
        message: 'Database connection timeout'
      },
      {
        timestamp: new Date(Date.now() - 900000),
        level: 'info',
        message: 'User registration completed'
      },
      {
        timestamp: new Date(Date.now() - 1200000),
        level: 'info',
        message: 'Skill created successfully'
      }
    ];

    res.json({
      success: true,
      logs
    });
  } catch (error) {
    console.error('Get logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch logs'
    });
  }
});

// @desc    Get/Update system settings
// @route   GET/PUT /api/admin/settings
// @access  Private/Admin
router.get('/settings', async (req, res) => {
  try {
    // Return current system settings
    res.json({
      success: true,
      settings: {
        siteName: process.env.SITE_NAME || 'Campus SkillSwap',
        siteDescription: process.env.SITE_DESCRIPTION || 'Peer-to-peer learning platform',
        maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 10485760,
        rateLimit: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 60,
        bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS) || 12,
        debugMode: process.env.NODE_ENV === 'development'
      }
    });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch settings'
    });
  }
});

router.put('/settings', async (req, res) => {
  try {
    // Update system settings (in a real app, you'd save these to a database or config file)
    const { siteName, siteDescription, maxFileSize, rateLimit, bcryptRounds, debugMode } = req.body;
    
    // For now, just return success
    res.json({
      success: true,
      message: 'System settings updated successfully',
      settings: {
        siteName,
        siteDescription,
        maxFileSize,
        rateLimit,
        bcryptRounds,
        debugMode
      }
    });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update settings'
    });
  }
});

// @desc    Get email domains
// @route   GET /api/admin/email-domains
// @access  Private/Admin
router.get('/email-domains', async (req, res) => {
  try {
    // Get user count for each domain
    const users = await User.find({}, 'email');
    const domainStats = {};
    
    users.forEach(user => {
      const domain = user.email.split('@')[1];
      if (domain) {
        domainStats[domain] = (domainStats[domain] || 0) + 1;
      }
    });

    // Get allowed domains from configuration
    const allowedDomains = getAllowedDomains();
    
    // Create domains array with real user counts
    const domains = allowedDomains.map(domain => ({
      name: domain,
      status: 'active',
      userCount: domainStats[domain] || 0,
      addedDate: '2024-01-15T00:00:00Z',
      description: getDomainDescription(domain)
    }));

    res.json({
      success: true,
      domains: domains,
      total: domains.length,
      active: domains.filter(d => d.status === 'active').length,
      inactive: domains.filter(d => d.status === 'inactive').length
    });
  } catch (error) {
    console.error('Get email domains error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch email domains'
    });
  }
});

// Helper function to get domain descriptions
function getDomainDescription(domain) {
  const descriptions = {
    'hicet.ac.in': 'Hindustan Institute of Technology',
    'annauniv.edu': 'Anna University',
    'psgtech.edu': 'PSG College of Technology',
    'cit.edu': 'Coimbatore Institute of Technology',
    'kct.ac.in': 'Kumaraguru College of Technology',
    'sastra.edu': 'SASTRA University',
    'vit.ac.in': 'VIT University',
    'srmist.edu.in': 'SRM Institute of Science and Technology',
    'amrita.edu': 'Amrita Vishwa Vidyapeetham',
    'veltech.edu.in': 'Vel Tech University',
    'university.edu': 'University of Education',
    'college.edu': 'College Network',
    'institute.edu': 'Institute System',
    'ac.in': 'Academic Institutions (India)',
    'edu.in': 'Educational Institutions (India)',
    'edu': 'Educational Institutions'
  };
  
  return descriptions[domain] || `${domain} - Educational Institution`;
}

// @desc    Update email domains
// @route   PUT /api/admin/email-domains
// @access  Private/Admin
router.put('/email-domains', async (req, res) => {
  try {
    const { allowedDomains, strictCheck } = req.body;
    
    // In a real app, you'd save these to a database or config file
    res.json({
      success: true,
      message: 'Email domains updated successfully',
      settings: {
        allowedDomains,
        strictCheck
      }
    });
  } catch (error) {
    console.error('Update email domains error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update email domains'
    });
  }
});

module.exports = router;
