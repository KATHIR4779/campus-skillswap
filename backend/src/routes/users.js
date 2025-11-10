const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');
const { validateUserUpdate, validatePagination, validateObjectId } = require('../middleware/validation');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '../../uploads/profiles');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `profile-${req.user.id}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024 // 5MB
  },
  fileFilter: fileFilter
});

// @desc    Get all users (Admin only)
// @route   GET /api/users
// @access  Private/Admin
router.get('/', protect, authorize('admin'), validatePagination, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const { university, major, year, isActive, isVerified } = req.query;
    
    // Build filter object
    const filter = {};
    if (university) filter.university = new RegExp(university, 'i');
    if (major) filter.major = new RegExp(major, 'i');
    if (year) filter.year = year;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (isVerified !== undefined) filter.isVerified = isVerified === 'true';
    
    const users = await User.find(filter)
      .select('-password -verificationToken -passwordResetToken -passwordResetExpires')
      .sort({ createdAt: -1 })
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
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve users'
    });
  }
});

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Private
router.get('/:id', protect, validateObjectId('id'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password -verificationToken -passwordResetToken -passwordResetExpires');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.json({
      success: true,
      data: user
    });
    
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve user'
    });
  }
});

// @desc    Get current user profile
// @route   GET /api/users/me/profile
// @access  Private
router.get('/me/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('-password -verificationToken -passwordResetToken -passwordResetExpires');
    
    res.json({
      success: true,
      data: user
    });
    
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve profile'
    });
  }
});

// @desc    Update user profile
// @route   PUT /api/users/me
// @access  Private
router.put('/me', protect, validateUserUpdate, async (req, res) => {
  try {
    const allowedUpdates = [
      'name', 'bio', 'interests', 'teachingPreferences', 'notifications'
    ];
    
    const updates = {};
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });
    
    const user = await User.findByIdAndUpdate(
      req.user.id,
      updates,
      { new: true, runValidators: true }
    ).select('-password -verificationToken -passwordResetToken -passwordResetExpires');
    
    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: user
    });
    
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile'
    });
  }
});

// @desc    Upload profile image
// @route   POST /api/users/me/avatar
// @access  Private
router.post('/me/avatar', protect, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }
    
    // Delete old profile image if exists
    const user = await User.findById(req.user.id);
    if (user.profileImage) {
      const oldImagePath = path.join(__dirname, '../../uploads/profiles', path.basename(user.profileImage));
      if (fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath);
      }
    }
    
    // Update user profile image path
    const imageUrl = `/uploads/profiles/${req.file.filename}`;
    user.profileImage = imageUrl;
    await user.save();
    
    res.json({
      success: true,
      message: 'Profile image uploaded successfully',
      data: {
        profileImage: imageUrl
      }
    });
    
  } catch (error) {
    console.error('Upload avatar error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload profile image'
    });
  }
});

// @desc    Delete profile image
// @route   DELETE /api/users/me/avatar
// @access  Private
router.delete('/me/avatar', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (user.profileImage) {
      // Delete the file
      const imagePath = path.join(__dirname, '../../uploads/profiles', path.basename(user.profileImage));
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
      
      // Update user profile
      user.profileImage = '';
      await user.save();
    }
    
    res.json({
      success: true,
      message: 'Profile image deleted successfully'
    });
    
  } catch (error) {
    console.error('Delete avatar error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete profile image'
    });
  }
});

// @desc    Get user stats
// @route   GET /api/users/me/stats
// @access  Private
router.get('/me/stats', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('stats rating timeCredits');
    
    // Get additional stats from other collections
    const Session = require('../models/Session');
    const Review = require('../models/Review');
    const Skill = require('../models/Skill');
    
    const [
      totalSessionsAsTeacher,
      totalSessionsAsStudent,
      totalReviews,
      totalSkills,
      recentSessions
    ] = await Promise.all([
      Session.countDocuments({ teacher: req.user.id, status: 'completed' }),
      Session.countDocuments({ student: req.user.id, status: 'completed' }),
      Review.countDocuments({ reviewee: req.user.id, isPublic: true }),
      Skill.countDocuments({ teacher: req.user.id, isActive: true }),
      Session.find({
        $or: [{ teacher: req.user.id }, { student: req.user.id }],
        status: { $in: ['approved', 'confirmed'] },
        scheduledDate: { $gte: new Date() }
      })
      .populate('skill', 'title')
      .populate('teacher', 'name profileImage')
      .populate('student', 'name profileImage')
      .sort({ scheduledDate: 1 })
      .limit(5)
    ]);
    
    res.json({
      success: true,
      data: {
        basic: {
          timeCredits: user.timeCredits,
          rating: user.rating,
          stats: user.stats
        },
        detailed: {
          totalSessionsAsTeacher,
          totalSessionsAsStudent,
          totalReviews,
          totalSkills,
          recentSessions
        }
      }
    });
    
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve user stats'
    });
  }
});

// @desc    Get user reviews
// @route   GET /api/users/:id/reviews
// @access  Private
router.get('/:id/reviews', protect, validateObjectId('id'), validatePagination, async (req, res) => {
  try {
    const Review = require('../models/Review');
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const { type = 'all' } = req.query;
    
    const reviews = await Review.getUserReviews(req.params.id, type, { limit, skip });
    const total = await Review.countDocuments({
      reviewee: req.params.id,
      isPublic: true,
      isVerified: true,
      ...(type !== 'all' && { type })
    });
    
    res.json({
      success: true,
      count: reviews.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: reviews
    });
    
  } catch (error) {
    console.error('Get user reviews error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve user reviews'
    });
  }
});

// @desc    Get user skills
// @route   GET /api/users/:id/skills
// @access  Private
router.get('/:id/skills', protect, validateObjectId('id'), validatePagination, async (req, res) => {
  try {
    const Skill = require('../models/Skill');
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const skills = await Skill.find({ teacher: req.params.id, isActive: true })
      .populate('teacher', 'name profileImage rating.average')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await Skill.countDocuments({ teacher: req.params.id, isActive: true });
    
    res.json({
      success: true,
      count: skills.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: skills
    });
    
  } catch (error) {
    console.error('Get user skills error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve user skills'
    });
  }
});

// @desc    Deactivate user account
// @route   PUT /api/users/me/deactivate
// @access  Private
router.put('/me/deactivate', protect, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { isActive: false },
      { new: true }
    ).select('-password -verificationToken -passwordResetToken -passwordResetExpires');
    
    res.json({
      success: true,
      message: 'Account deactivated successfully',
      data: user
    });
    
  } catch (error) {
    console.error('Deactivate account error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to deactivate account'
    });
  }
});

// @desc    Delete user account (Admin only)
// @route   DELETE /api/users/:id
// @access  Private/Admin
router.delete('/:id', protect, authorize('admin'), validateObjectId('id'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Soft delete - deactivate instead of removing
    user.isActive = false;
    await user.save();
    
    res.json({
      success: true,
      message: 'User account deactivated successfully'
    });
    
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user account'
    });
  }
});

module.exports = router;
