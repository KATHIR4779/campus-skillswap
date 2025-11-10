const express = require('express');
// const multer = require('multer');
const path = require('path');
const fs = require('fs');
// const sharp = require('sharp');
const Skill = require('../models/Skill');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');
const { validateSkillCreation, validateSkillUpdate, validatePagination, validateSearch, validateObjectId } = require('../middleware/validation');

const router = express.Router();

// Configure multer for skill images (commented out for now)
// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     const uploadPath = path.join(__dirname, '../../uploads/skills');
//     if (!fs.existsSync(uploadPath)) {
//       fs.mkdirSync(uploadPath, { recursive: true });
//     }
//     cb(null, uploadPath);
//   },
//   filename: function (req, file, cb) {
//     const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
//     cb(null, `skill-${uniqueSuffix}${path.extname(file.originalname)}`);
//   }
// });

// const fileFilter = (req, file, cb) => {
//   if (file.mimetype.startsWith('image/')) {
//     cb(null, true);
//   } else {
//     cb(new Error('Only image files are allowed'), false);
//   }
// };

// const upload = multer({
//   storage: storage,
//   limits: {
//     fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024 // 5MB
//   },
//   fileFilter: fileFilter
// });

// @desc    Get all skills
// @route   GET /api/skills
// @access  Public
router.get('/', validateSearch, validatePagination, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;
    
    const {
      q: searchQuery,
      category,
      level,
      location,
      minCredits,
      maxCredits,
      sort = 'createdAt',
      order = 'desc'
    } = req.query;
    
    // Build filter object
    const filter = { isActive: true };
    
    if (category) filter.category = category;
    if (level) filter.level = level;
    if (location) filter.location = location;
    if (minCredits || maxCredits) {
      filter.creditsPerHour = {};
      if (minCredits) filter.creditsPerHour.$gte = parseInt(minCredits);
      if (maxCredits) filter.creditsPerHour.$lte = parseInt(maxCredits);
    }
    
    // Build sort object
    const sortObj = {};
    sortObj[sort] = order === 'desc' ? -1 : 1;
    
    let skills;
    let total;
    
    if (searchQuery) {
      // Use text search
      const result = await Skill.searchSkills(searchQuery, filter);
      skills = result.slice(skip, skip + limit);
      total = result.length;
    } else {
      // Regular query
      skills = await Skill.find(filter)
        .populate('teacher', 'name profileImage rating.average university major')
        .sort(sortObj)
        .skip(skip)
        .limit(limit);
      
      total = await Skill.countDocuments(filter);
    }
    
    res.json({
      success: true,
      count: skills.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: skills
    });
    
  } catch (error) {
    console.error('Get skills error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve skills'
    });
  }
});

// @desc    Get featured skills
// @route   GET /api/skills/featured
// @access  Public
router.get('/featured', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 6;
    
    const skills = await Skill.find({ 
      isActive: true, 
      isFeatured: true 
    })
    .populate('teacher', 'name profileImage rating.average university major')
    .sort({ 'rating.average': -1, createdAt: -1 })
    .limit(limit);
    
    res.json({
      success: true,
      count: skills.length,
      data: skills
    });
    
  } catch (error) {
    console.error('Get featured skills error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve featured skills'
    });
  }
});

// @desc    Get skill categories
// @route   GET /api/skills/categories
// @access  Public
router.get('/categories', async (req, res) => {
  try {
    const categories = await Skill.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          avgRating: { $avg: '$rating.average' }
        }
      },
      { $sort: { count: -1 } }
    ]);
    
    res.json({
      success: true,
      data: categories
    });
    
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve categories'
    });
  }
});

// @desc    Get user's skills
// @route   GET /api/skills/my-skills
// @access  Private
router.get('/my-skills', protect, async (req, res) => {
  try {
    // Basic validation for query parameters
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 10, 100); // Cap at 100
    const skip = (page - 1) * limit;
    
    const { isActive } = req.query;
    
    const filter = { teacher: req.user.id };
    if (isActive !== undefined) {
      filter.isActive = isActive === 'true';
    }
    
    const skills = await Skill.find(filter)
      .populate('teacher', 'name profileImage rating.average')
      .sort({ createdAt: -1 })
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
    console.error('Get my skills error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve your skills'
    });
  }
});

// @desc    Get single skill
// @route   GET /api/skills/:id
// @access  Public
router.get('/:id', validateObjectId('id'), async (req, res) => {
  try {
    const skill = await Skill.findById(req.params.id)
      .populate('teacher', 'name profileImage rating.average university major bio');
    
    if (!skill || !skill.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Skill not found'
      });
    }
    
    // Get teacher's other skills (limit 3)
    let teacherOtherSkills = [];
    if (skill.teacher && skill.teacher._id) {
      teacherOtherSkills = await Skill.find({
        teacher: skill.teacher._id,
        _id: { $ne: skill._id },
        isActive: true
      })
      .select('title category rating.average')
      .limit(3);
    }
    
    // Get related skills (same category)
    const relatedSkills = await Skill.find({
      _id: { $ne: skill._id },
      category: skill.category,
      isActive: true
    })
    .populate('teacher', 'name profileImage rating.average')
    .limit(4);
    
    res.json({
      success: true,
      data: {
        skill,
        teacherOtherSkills,
        relatedSkills
      }
    });
    
  } catch (error) {
    console.error('Get skill error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve skill',
      error: error.message
    });
  }
});

// @desc    Create new skill
// @route   POST /api/skills
// @access  Private
router.post('/', protect, validateSkillCreation, async (req, res) => {
  try {
    // Add teacher to request body
    req.body.teacher = req.user.id;
    
    const skill = await Skill.create(req.body);
    
    // Populate teacher data
    await skill.populate('teacher', 'name profileImage rating.average university major');
    
    res.status(201).json({
      success: true,
      message: 'Skill created successfully',
      data: skill
    });
    
  } catch (error) {
    console.error('Create skill error:', error);
    console.error('Error details:', {
      message: error.message,
      name: error.name,
      errors: error.errors,
      stack: error.stack
    });
    res.status(500).json({
      success: false,
      message: 'Failed to create skill',
      error: error.message
    });
  }
});

// @desc    Update skill
// @route   PUT /api/skills/:id
// @access  Private
router.put('/:id', protect, validateSkillUpdate, validateObjectId('id'), async (req, res) => {
  try {
    const skill = await Skill.findById(req.params.id);
    
    if (!skill) {
      return res.status(404).json({
        success: false,
        message: 'Skill not found'
      });
    }
    
    // Check if user owns the skill or is admin
    if (skill.teacher.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this skill'
      });
    }
    
    const allowedUpdates = [
      'title', 'description', 'creditsPerHour', 'level', 'location',
      'sessionDuration', 'maxStudents', 'isActive', 'availableDays',
      'availableTimes', 'prerequisites', 'learningOutcomes', 'materialsRequired'
    ];
    
    const updates = {};
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });
    
    const updatedSkill = await Skill.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).populate('teacher', 'name profileImage rating.average university major');
    
    res.json({
      success: true,
      message: 'Skill updated successfully',
      data: updatedSkill
    });
    
  } catch (error) {
    console.error('Update skill error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update skill'
    });
  }
});

// @desc    Upload skill images (commented out - requires multer and sharp)
// @route   POST /api/skills/:id/images
// @access  Private
// router.post('/:id/images', protect, upload.array('images', 5), validateObjectId('id'), async (req, res) => {
//   // File upload functionality commented out until dependencies are installed
//   res.status(501).json({
//     success: false,
//     message: 'File upload feature not yet implemented'
//   });
// });

// @desc    Set primary skill image (commented out - requires file operations)
// @route   PUT /api/skills/:id/images/:imageId/primary
// @access  Private
// router.put('/:id/images/:imageId/primary', protect, validateObjectId('id'), async (req, res) => {
//   // Image management functionality commented out until dependencies are installed
//   res.status(501).json({
//     success: false,
//     message: 'Image management feature not yet implemented'
//   });
// });

// @desc    Delete skill image (commented out - requires file operations)
// @route   DELETE /api/skills/:id/images/:imageId
// @access  Private
// router.delete('/:id/images/:imageId', protect, validateObjectId('id'), async (req, res) => {
//   // Image deletion functionality commented out until dependencies are installed
//   res.status(501).json({
//     success: false,
//     message: 'Image deletion feature not yet implemented'
//   });
// });

// @desc    Delete skill
// @route   DELETE /api/skills/:id
// @access  Private
router.delete('/:id', protect, validateObjectId('id'), async (req, res) => {
  try {
    const skill = await Skill.findById(req.params.id);
    
    if (!skill) {
      return res.status(404).json({
        success: false,
        message: 'Skill not found'
      });
    }
    
    // Check if user owns the skill or is admin
    if (skill.teacher.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this skill'
      });
    }
    
    // Soft delete - deactivate instead of removing
    skill.isActive = false;
    await skill.save();
    
    res.json({
      success: true,
      message: 'Skill deleted successfully'
    });
    
  } catch (error) {
    console.error('Delete skill error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete skill'
    });
  }
});

// @desc    Toggle skill featured status (Admin only)
// @route   PUT /api/skills/:id/featured
// @access  Private/Admin
router.put('/:id/featured', protect, authorize('admin'), validateObjectId('id'), async (req, res) => {
  try {
    const skill = await Skill.findById(req.params.id);
    
    if (!skill) {
      return res.status(404).json({
        success: false,
        message: 'Skill not found'
      });
    }
    
    skill.isFeatured = !skill.isFeatured;
    await skill.save();
    
    res.json({
      success: true,
      message: `Skill ${skill.isFeatured ? 'featured' : 'unfeatured'} successfully`,
      data: skill
    });
    
  } catch (error) {
    console.error('Toggle featured skill error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update featured status'
    });
  }
});

module.exports = router;
