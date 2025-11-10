const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const { validateUniversityEmail } = require('../config/emailDomains');

// Validation result handler
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => ({
      field: error.path,
      message: error.msg,
      value: error.value
    }));
    
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errorMessages
    });
  }
  
  next();
};

// User validation rules
const validateUserRegistration = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address')
    .custom((value) => {
      if (!validateUniversityEmail(value)) {
        throw new Error('Only university email addresses are allowed for registration. Please use your university email (e.g., @hicet.ac.in, @annauniv.edu)');
      }
      return true;
    }),
  
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  
  body('university')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('University name must be between 2 and 100 characters'),
  
  body('major')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Major must be between 2 and 100 characters'),
  
  body('year')
    .isIn(['1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year', 'Postgraduate'])
    .withMessage('Invalid year of study'),
  
  handleValidationErrors
];

const validateUserLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  
  handleValidationErrors
];

const validateUserUpdate = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  
  body('bio')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Bio cannot exceed 500 characters'),
  
  body('interests')
    .optional()
    .isArray({ max: 10 })
    .withMessage('Maximum 10 interests allowed'),
  
  body('interests.*')
    .optional()
    .trim()
    .isLength({ min: 2, max: 30 })
    .withMessage('Each interest must be between 2 and 30 characters'),
  
  body('teachingPreferences.location')
    .optional()
    .isIn(['campus-library', 'campus-cafeteria', 'study-rooms', 'online', 'flexible'])
    .withMessage('Invalid location preference'),
  
  body('teachingPreferences.availableDays')
    .optional()
    .isArray()
    .withMessage('Available days must be an array'),
  
  body('teachingPreferences.availableDays.*')
    .optional()
    .isIn(['weekdays', 'weekends', 'evenings'])
    .withMessage('Invalid available day'),
  
  body('teachingPreferences.sessionDuration')
    .optional()
    .isIn(['30min', '1hour', '2hours', 'flexible'])
    .withMessage('Invalid session duration'),
  
  handleValidationErrors
];

// Skill validation rules
const validateSkillCreation = [
  body('title')
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Skill title must be between 3 and 100 characters'),
  
  body('description')
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Description must be between 10 and 1000 characters'),
  
  body('category')
    .isIn(['Technology', 'Academics', 'Arts', 'Language', 'Life Skills', 'Sports', 'Music', 'Other'])
    .withMessage('Invalid category'),
  
  body('creditsPerHour')
    .isInt({ min: 1, max: 10 })
    .withMessage('Credits per hour must be between 1 and 10'),
  
  body('level')
    .optional()
    .isIn(['Beginner', 'Intermediate', 'Advanced'])
    .withMessage('Invalid skill level'),
  
  body('tags')
    .optional()
    .isArray({ max: 10 })
    .withMessage('Maximum 10 tags allowed'),
  
  body('tags.*')
    .optional()
    .trim()
    .isLength({ min: 2, max: 20 })
    .withMessage('Each tag must be between 2 and 20 characters'),
  
  body('location')
    .optional()
    .isIn(['campus-library', 'campus-cafeteria', 'study-rooms', 'online', 'flexible'])
    .withMessage('Invalid location'),
  
  handleValidationErrors
];

const validateSkillUpdate = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Skill title must be between 3 and 100 characters'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Description must be between 10 and 1000 characters'),
  
  body('creditsPerHour')
    .optional()
    .isInt({ min: 1, max: 10 })
    .withMessage('Credits per hour must be between 1 and 10'),
  
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean value'),
  
  handleValidationErrors
];

// Session validation rules
const validateSessionRequest = [
  body('skill')
    .isMongoId()
    .withMessage('Valid skill ID is required'),
  
  body('scheduledDate')
    .isISO8601()
    .withMessage('Valid scheduled date is required'),
  
  body('startTime')
    .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Valid start time format is required (HH:MM)'),
  
  body('endTime')
    .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Valid end time format is required (HH:MM)'),
  
  body('location')
    .isIn(['campus-library', 'campus-cafeteria', 'study-rooms', 'online', 'flexible'])
    .withMessage('Invalid location'),
  
  body('requestMessage')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Request message cannot exceed 500 characters'),
  
  handleValidationErrors
];

const validateSessionUpdate = [
  body('status')
    .optional()
    .isIn(['pending', 'approved', 'confirmed', 'in-progress', 'completed', 'cancelled', 'no-show', 'disputed'])
    .withMessage('Invalid session status'),
  
  body('actualDuration')
    .optional()
    .isInt({ min: 0, max: 180 })
    .withMessage('Actual duration must be between 0 and 180 minutes'),
  
  body('completionNotes.teacher')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Teacher notes cannot exceed 1000 characters'),
  
  body('completionNotes.student')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Student notes cannot exceed 1000 characters'),
  
  handleValidationErrors
];

// Review validation rules
const validateReviewCreation = [
  body('session')
    .isMongoId()
    .withMessage('Valid session ID is required'),
  
  body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),
  
  body('comment')
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Comment must be between 10 and 1000 characters'),
  
  body('detailedRatings.teachingQuality')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Teaching quality rating must be between 1 and 5'),
  
  body('detailedRatings.communication')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Communication rating must be between 1 and 5'),
  
  body('detailedRatings.punctuality')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Punctuality rating must be between 1 and 5'),
  
  body('detailedRatings.preparation')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Preparation rating must be between 1 and 5'),
  
  body('tags')
    .optional()
    .isArray({ max: 5 })
    .withMessage('Maximum 5 tags allowed'),
  
  body('tags.*')
    .optional()
    .trim()
    .isLength({ min: 2, max: 20 })
    .withMessage('Each tag must be between 2 and 20 characters'),
  
  handleValidationErrors
];

// Message validation rules
const validateMessageCreation = [
  body('recipient')
    .isMongoId()
    .withMessage('Valid recipient ID is required'),
  
  body('content')
    .trim()
    .isLength({ min: 1, max: 2000 })
    .withMessage('Message content must be between 1 and 2000 characters'),
  
  body('type')
    .optional()
    .isIn(['text', 'image', 'file', 'session_request', 'session_approval', 'session_rejection'])
    .withMessage('Invalid message type'),
  
  body('priority')
    .optional()
    .isIn(['low', 'normal', 'high', 'urgent'])
    .withMessage('Invalid priority level'),
  
  handleValidationErrors
];

// Parameter validation rules
const validateObjectId = (paramName) => [
  param(paramName)
    .isMongoId()
    .withMessage(`Valid ${paramName} ID is required`),
  
  handleValidationErrors
];

const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  query('sort')
    .optional()
    .isIn(['createdAt', 'updatedAt', 'rating', 'creditsPerHour', 'scheduledDate'])
    .withMessage('Invalid sort field'),
  
  query('order')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Order must be asc or desc'),
  
  handleValidationErrors
];

const validateSearch = [
  query('q')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Search query must be between 2 and 100 characters'),
  
  query('category')
    .optional()
    .isIn(['Technology', 'Academics', 'Arts', 'Language', 'Life Skills', 'Sports', 'Music', 'Other'])
    .withMessage('Invalid category'),
  
  query('level')
    .optional()
    .isIn(['Beginner', 'Intermediate', 'Advanced'])
    .withMessage('Invalid level'),
  
  query('location')
    .optional()
    .isIn(['campus-library', 'campus-cafeteria', 'study-rooms', 'online', 'flexible'])
    .withMessage('Invalid location'),
  
  query('minCredits')
    .optional()
    .isInt({ min: 1, max: 10 })
    .withMessage('Minimum credits must be between 1 and 10'),
  
  query('maxCredits')
    .optional()
    .isInt({ min: 1, max: 10 })
    .withMessage('Maximum credits must be between 1 and 10'),
  
  handleValidationErrors
];

module.exports = {
  handleValidationErrors,
  validateUserRegistration,
  validateUserLogin,
  validateUserUpdate,
  validateSkillCreation,
  validateSkillUpdate,
  validateSessionRequest,
  validateSessionUpdate,
  validateReviewCreation,
  validateMessageCreation,
  validateObjectId,
  validatePagination,
  validateSearch
};