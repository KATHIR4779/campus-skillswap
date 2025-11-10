const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Skip detailed logging for common browser requests
  const skipDetailedLogging = [
    '/favicon.ico',
    '/robots.txt',
    '/sitemap.xml'
  ].includes(req.originalUrl);

  // Log error for debugging (but reduce noise for browser requests)
  if (skipDetailedLogging && err.statusCode === 404) {
    // Just log a simple message for browser requests
    console.log(`Browser request: ${req.method} ${req.originalUrl} - 404`);
  } else {
    console.error('Error:', err);
  }

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Resource not found';
    error = { message, statusCode: 404 };
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    let message = 'Duplicate field value entered';
    
    // Extract field name from error
    const field = Object.keys(err.keyValue)[0];
    if (field === 'email') {
      message = 'Email already exists';
    } else if (field === 'googleId') {
      message = 'Google account already linked';
    } else {
      message = `${field} already exists`;
    }
    
    error = { message, statusCode: 400 };
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    error = { message, statusCode: 400 };
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token';
    error = { message, statusCode: 401 };
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Token expired';
    error = { message, statusCode: 401 };
  }

  // Multer errors (file upload)
  if (err.code === 'LIMIT_FILE_SIZE') {
    const message = 'File too large';
    error = { message, statusCode: 400 };
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    const message = 'Unexpected file field';
    error = { message, statusCode: 400 };
  }

  // Rate limiting errors
  if (err.statusCode === 429) {
    const message = 'Too many requests, please try again later';
    error = { message, statusCode: 429 };
  }

  // Permission errors
  if (err.name === 'ForbiddenError') {
    const message = 'Insufficient permissions';
    error = { message, statusCode: 403 };
  }

  // Not found errors
  if (err.name === 'NotFoundError') {
    const message = 'Resource not found';
    error = { message, statusCode: 404 };
  }

  // Business logic errors
  if (err.name === 'InsufficientCreditsError') {
    const message = 'Insufficient time credits';
    error = { message, statusCode: 400, insufficientCredits: true };
  }

  if (err.name === 'SessionConflictError') {
    const message = 'Session time conflict';
    error = { message, statusCode: 409 };
  }

  if (err.name === 'EmailNotVerifiedError') {
    const message = 'Email verification required';
    error = { message, statusCode: 403, requiresVerification: true };
  }

  // Default error
  const statusCode = error.statusCode || 500;
  const message = error.message || 'Server Error';

  res.status(statusCode).json({
    success: false,
    message: message,
    ...(process.env.NODE_ENV === 'development' && {
      stack: err.stack,
      error: err
    })
  });
};

module.exports = errorHandler;
