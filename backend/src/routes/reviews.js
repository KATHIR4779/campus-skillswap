const express = require('express');
const Review = require('../models/Review');
const Session = require('../models/Session');
const User = require('../models/User');
const { protect, checkReviewPermission } = require('../middleware/auth');
const { validateReviewCreation, validatePagination, validateObjectId } = require('../middleware/validation');

const router = express.Router();

// @desc    Get all reviews
// @route   GET /api/reviews
// @access  Private
router.get('/', protect, validatePagination, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const { reviewee, type, rating, session, skill } = req.query;

    // Build filter object
    const filter = { isPublic: true, isVerified: true };

    if (reviewee) filter.reviewee = reviewee;
    if (type) filter.type = type;
    if (rating) filter.rating = parseInt(rating);
    if (session) {
      filter.session = session;
      // When filtering by session, also allow the reviewer to see their own review
      filter.$or = [
        { isPublic: true, isVerified: true },
        { reviewer: req.user.id }
      ];
      // Remove the redundant isPublic and isVerified from main filter
      delete filter.isPublic;
      delete filter.isVerified;
    }
    if (skill) {
      // Filter reviews by skill - need to populate session.skill and match
      filter['session.skill'] = skill;
    }
    
    const reviews = await Review.find(filter)
      .populate('reviewer', 'name profileImage')
      .populate('reviewee', 'name profileImage')
      .populate('session', 'skill scheduledDate')
      .populate('session.skill', 'title category')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // If filtering by skill, we need to filter after population since MongoDB doesn't support deep filtering directly
    let filteredReviews = reviews;
    if (skill) {
      filteredReviews = reviews.filter(review =>
        review.session && review.session.skill && review.session.skill._id.toString() === skill
      );
    }
    
    // Calculate total count considering skill filter
    let total = await Review.countDocuments(filter);
    if (skill) {
      // For skill filtering, we need to count after filtering since we filter post-population
      const allSkillReviews = await Review.find(filter)
        .populate('session', 'skill')
        .populate('session.skill', '_id');
      total = allSkillReviews.filter(review =>
        review.session && review.session.skill && review.session.skill._id.toString() === skill
      ).length;
    }

    res.json({
      success: true,
      count: filteredReviews.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: filteredReviews
    });
    
  } catch (error) {
    console.error('Get reviews error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve reviews'
    });
  }
});

// @desc    Get single review
// @route   GET /api/reviews/:id
// @access  Private
router.get('/:id', protect, validateObjectId('id'), async (req, res) => {
  try {
    const review = await Review.findById(req.params.id)
      .populate('reviewer', 'name profileImage')
      .populate('reviewee', 'name profileImage')
      .populate('session', 'skill scheduledDate')
      .populate('session.skill', 'title category');
    
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }
    
    res.json({
      success: true,
      data: review
    });
    
  } catch (error) {
    console.error('Get review error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve review'
    });
  }
});

// @desc    Create new review
// @route   POST /api/reviews
// @access  Private
router.post('/', protect, checkReviewPermission, validateReviewCreation, async (req, res) => {
  try {
    const { session, rating, comment, detailedRatings, tags } = req.body;
    
    console.log('Creating review with data:', { session, rating, comment, detailedRatings, tags });
    console.log('User ID:', req.user.id);
    
    // Get session details
    const sessionData = await Session.findById(session)
      .populate('teacher', 'name')
      .populate('student', 'name');
    
    if (!sessionData) {
      console.log('Session not found:', session);
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }
    
    console.log('Session data:', {
      id: sessionData._id,
      teacher: sessionData.teacher,
      student: sessionData.student,
      status: sessionData.status
    });
    
    // Determine review type and reviewee
    const isTeacher = sessionData.teacher._id.toString() === req.user.id.toString();
    const reviewType = isTeacher ? 'student' : 'teacher';
    const reviewee = isTeacher ? sessionData.student._id : sessionData.teacher._id;
    
    console.log('Review info:', { isTeacher, reviewType, reviewee });
    
    // Create review
    const review = await Review.create({
      session: session,
      reviewer: req.user.id,
      reviewee: reviewee,
      type: reviewType,
      rating: rating,
      detailedRatings: detailedRatings,
      comment: comment,
      tags: tags
    });
    
    console.log('Review created:', review._id);
    
    // Update user rating
    const user = await User.findById(reviewee);
    if (user) {
      const { averageRating, totalReviews } = await Review.getAverageRating(reviewee, reviewType);
      user.rating = {
        average: averageRating,
        count: totalReviews
      };
      await user.save();
    }
    
    // Update skill rating if this is a teacher review
    if (reviewType === 'teacher' && sessionData.skill) {
      const Skill = require('../models/Skill');
      const skill = await Skill.findById(sessionData.skill);
      if (skill) {
        // Get all sessions for this teacher and this specific skill
        const skillSessions = await Session.find({ 
          skill: sessionData.skill, 
          teacher: reviewee,
          status: 'completed'
        }).select('_id');
        
        const sessionIds = skillSessions.map(s => s._id);
        
        // Get all reviews for these sessions
        const skillReviews = await Review.find({
          session: { $in: sessionIds },
          type: 'teacher'
        });
        
        if (skillReviews.length > 0) {
          const avgRating = skillReviews.reduce((sum, r) => sum + r.rating, 0) / skillReviews.length;
          skill.rating = {
            average: Math.round(avgRating * 10) / 10,
            count: skillReviews.length
          };
          await skill.save();
        }
      }
    }
    
    // Populate review data
    await review.populate([
      { path: 'reviewer', select: 'name profileImage' },
      { path: 'reviewee', select: 'name profileImage' },
      { path: 'session', select: 'skill scheduledDate' },
      { path: 'session.skill', select: 'title category' }
    ]);
    
    res.status(201).json({
      success: true,
      message: 'Review created successfully',
      data: review
    });
    
  } catch (error) {
    console.error('Create review error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create review'
    });
  }
});

// @desc    Update review
// @route   PUT /api/reviews/:id
// @access  Private
router.put('/:id', protect, validateObjectId('id'), async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }
    
    // Check if user is the reviewer
    if (review.reviewer.toString() !== req.user.id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this review'
      });
    }
    
    // Only allow updates within 24 hours of creation
    const hoursSinceCreation = (Date.now() - review.createdAt.getTime()) / (1000 * 60 * 60);
    if (hoursSinceCreation > 24) {
      return res.status(400).json({
        success: false,
        message: 'Reviews can only be updated within 24 hours of creation'
      });
    }
    
    const { rating, comment, detailedRatings, tags } = req.body;
    
    const updates = {};
    if (rating !== undefined) updates.rating = rating;
    if (comment !== undefined) updates.comment = comment;
    if (detailedRatings !== undefined) updates.detailedRatings = detailedRatings;
    if (tags !== undefined) updates.tags = tags;
    
    const updatedReview = await Review.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).populate([
      { path: 'reviewer', select: 'name profileImage' },
      { path: 'reviewee', select: 'name profileImage' },
      { path: 'session', select: 'skill scheduledDate' },
      { path: 'session.skill', select: 'title category' }
    ]);
    
    // Update user rating if rating changed
    if (rating !== undefined) {
      const user = await User.findById(review.reviewee);
      if (user) {
        const { averageRating, totalReviews } = await Review.getAverageRating(review.reviewee, review.type);
        user.rating = {
          average: averageRating,
          count: totalReviews
        };
        await user.save();
      }
    }
    
    res.json({
      success: true,
      message: 'Review updated successfully',
      data: updatedReview
    });
    
  } catch (error) {
    console.error('Update review error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update review'
    });
  }
});

// @desc    Add helpfulness vote
// @route   POST /api/reviews/:id/helpful
// @access  Private
router.post('/:id/helpful', protect, validateObjectId('id'), async (req, res) => {
  try {
    const { vote } = req.body; // 'helpful' or 'notHelpful'
    
    if (!vote || !['helpful', 'notHelpful'].includes(vote)) {
      return res.status(400).json({
        success: false,
        message: 'Vote must be either "helpful" or "notHelpful"'
      });
    }
    
    const review = await Review.findById(req.params.id);
    
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }
    
    // Check if user is not the reviewer
    if (review.reviewer.toString() === req.user.id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot vote on your own review'
      });
    }
    
    await review.addHelpfulnessVote(req.user.id, vote);
    
    res.json({
      success: true,
      message: 'Vote recorded successfully',
      data: {
        helpful: review.helpfulness.helpful,
        notHelpful: review.helpfulness.notHelpful
      }
    });
    
  } catch (error) {
    console.error('Add helpfulness vote error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to record vote'
    });
  }
});

// @desc    Add response to review
// @route   POST /api/reviews/:id/response
// @access  Private
router.post('/:id/response', protect, validateObjectId('id'), async (req, res) => {
  try {
    const { comment } = req.body;
    
    if (!comment || comment.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Response comment is required'
      });
    }
    
    const review = await Review.findById(req.params.id);
    
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }
    
    // Check if user is the reviewee
    if (review.reviewee.toString() !== req.user.id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the reviewee can respond to this review'
      });
    }
    
    // Check if response already exists
    if (review.response.comment) {
      return res.status(400).json({
        success: false,
        message: 'Response already exists for this review'
      });
    }
    
    await review.addResponse(comment);
    
    res.json({
      success: true,
      message: 'Response added successfully',
      data: review.response
    });
    
  } catch (error) {
    console.error('Add response error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add response'
    });
  }
});

// @desc    Report review
// @route   POST /api/reviews/:id/report
// @access  Private
router.post('/:id/report', protect, validateObjectId('id'), async (req, res) => {
  try {
    const { reason, description } = req.body;
    
    if (!reason || !['inappropriate', 'spam', 'false', 'offensive', 'irrelevant', 'other'].includes(reason)) {
      return res.status(400).json({
        success: false,
        message: 'Valid report reason is required'
      });
    }
    
    const review = await Review.findById(req.params.id);
    
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }
    
    // Check if user already reported this review
    const existingReport = review.reports.find(report => 
      report.reportedBy.toString() === req.user.id.toString()
    );
    
    if (existingReport) {
      return res.status(400).json({
        success: false,
        message: 'You have already reported this review'
      });
    }
    
    await review.reportReview(req.user.id, reason, description);
    
    res.json({
      success: true,
      message: 'Review reported successfully'
    });
    
  } catch (error) {
    console.error('Report review error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to report review'
    });
  }
});

// @desc    Delete review
// @route   DELETE /api/reviews/:id
// @access  Private
router.delete('/:id', protect, validateObjectId('id'), async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }
    
    // Check if user is the reviewer or admin
    if (review.reviewer.toString() !== req.user.id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this review'
      });
    }
    
    // Only allow deletion within 24 hours of creation
    const hoursSinceCreation = (Date.now() - review.createdAt.getTime()) / (1000 * 60 * 60);
    if (hoursSinceCreation > 24 && req.user.role !== 'admin') {
      return res.status(400).json({
        success: false,
        message: 'Reviews can only be deleted within 24 hours of creation'
      });
    }
    
    await Review.findByIdAndDelete(req.params.id);
    
    // Update user rating
    const user = await User.findById(review.reviewee);
    if (user) {
      const { averageRating, totalReviews } = await Review.getAverageRating(review.reviewee, review.type);
      user.rating = {
        average: averageRating,
        count: totalReviews
      };
      await user.save();
    }
    
    res.json({
      success: true,
      message: 'Review deleted successfully'
    });
    
  } catch (error) {
    console.error('Delete review error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete review'
    });
  }
});

// @desc    Get user's reviews
// @route   GET /api/reviews/user/:userId
// @access  Private
router.get('/user/:userId', protect, validateObjectId('userId'), validatePagination, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const { type = 'all' } = req.query;
    
    const reviews = await Review.getUserReviews(req.params.userId, type, { limit, skip });
    const total = await Review.countDocuments({
      reviewee: req.params.userId,
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

module.exports = router;
