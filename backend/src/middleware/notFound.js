const notFound = (req, res, next) => {
  // Skip logging for common browser requests that are not API endpoints
  const skipLogging = [
    '/favicon.ico',
    '/robots.txt',
    '/sitemap.xml'
  ].includes(req.originalUrl);

  const error = new Error(`Not Found - ${req.originalUrl}`);
  error.statusCode = 404;
  
  // Don't log common browser requests to reduce console noise
  if (!skipLogging) {
    console.log(`404 Not Found: ${req.method} ${req.originalUrl}`);
  }
  
  next(error);
};

module.exports = notFound;
