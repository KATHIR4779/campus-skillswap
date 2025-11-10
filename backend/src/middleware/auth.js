const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes - verify JWT token
const protect = async (req, res, next) => {
  try {
    let token;
    
    // Get token from header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    
    // Make sure token exists
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    }
    
    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Get user from token
      const user = await User.findById(decoded.id);
      
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'No user found with this token'
        });
      }
      
      if (!user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'User account is deactivated'
        });
      }
      
      req.user = user;
      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error in authentication'
    });
  }
};

// Grant access to specific roles
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role ${req.user.role} is not authorized to access this route`
      });
    }
    
    next();
  };
};

// Optional authentication - doesn't fail if no token
const optionalAuth = async (req, res, next) => {
  try {
    let token;
    
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
      
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);
        
        if (user && user.isActive) {
          req.user = user;
        }
      } catch (error) {
        // Token is invalid, but we don't fail
        console.log('Invalid token in optional auth:', error.message);
      }
    }
    
    next();
  } catch (error) {
    console.error('Optional auth middleware error:', error);
    next(); // Continue even if there's an error
  }
};

// Check if user owns resource
const checkOwnership = (resourceUserIdField = 'user') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    }
    
    // Admin can access everything
    if (req.user.role === 'admin') {
      return next();
    }
    
    // Check if user owns the resource
    const resourceUserId = req.resource ? req.resource[resourceUserIdField] : null;
    
    if (!resourceUserId) {
      return res.status(404).json({
        success: false,
        message: 'Resource not found'
      });
    }
    
    if (resourceUserId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this resource'
      });
    }
    
    next();
  };
};

// Verify email verification
const requireEmailVerification = (req, res, next) => {
  if (!req.user.isVerified) {
    return res.status(403).json({
      success: false,
      message: 'Email verification required to access this resource',
      requiresVerification: true
    });
  }
  
  next();
};

// Check if user has sufficient credits
const checkCredits = (requiredCredits) => {
  return (req, res, next) => {
    if (req.user.timeCredits < requiredCredits) {
      return res.status(400).json({
        success: false,
        message: `Insufficient credits. Required: ${requiredCredits}, Available: ${req.user.timeCredits}`,
        insufficientCredits: true
      });
    }
    
    next();
  };
};

// Check if user can access session
const checkSessionAccess = async (req, res, next) => {
  try {
    // If session is not already populated, fetch it
    if (!req.session) {
      const Session = require('../models/Session');
      const session = await Session.findById(req.params.id || req.params.sessionId);
      
      if (!session) {
        return res.status(404).json({
          success: false,
          message: 'Session not found'
        });
      }
      
      req.session = session;
    }
    
    // Check if user is teacher or student in this session
    const isTeacher = req.session.teacher.toString() === req.user._id.toString();
    const isStudent = req.session.student.toString() === req.user._id.toString();
    
    if (!isTeacher && !isStudent && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this session'
      });
    }
    
    req.sessionRole = isTeacher ? 'teacher' : 'student';
    next();
  } catch (error) {
    console.error('Session access check error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error checking session access'
    });
  }
};

// Check if user can review session
const checkReviewPermission = async (req, res, next) => {
  try {
    const sessionId = req.params.sessionId || req.body.session;
    const Review = require('../models/Review');
    
    if (!sessionId) {
      return res.status(400).json({
        success: false,
        message: 'Session ID is required'
      });
    }
    
    const { canReview, reason } = await Review.canUserReview(sessionId, req.user._id);
    
    if (!canReview) {
      return res.status(403).json({
        success: false,
        message: `Cannot review this session: ${reason}`
      });
    }
    
    next();
  } catch (error) {
    console.error('Review permission check error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error checking review permissions'
    });
  }
};

module.exports = {
  protect,
  authorize,
  optionalAuth,
  checkOwnership,
  requireEmailVerification,
  checkCredits,
  checkSessionAccess,
  checkReviewPermission
};