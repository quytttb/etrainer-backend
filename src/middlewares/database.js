const serverlessDB = require('../configs/serverlessDB');
const { isServerless } = require('../configs/serverless');
const logger = require('../utils/logger');

/**
 * Middleware to ensure database connection in serverless environment
 */
const ensureDbConnection = async (req, res, next) => {
  // Only apply in serverless environment
  if (!isServerless) {
    return next();
  }

  try {
    // Ensure database connection before processing request
    await serverlessDB.connect();
    next();
  } catch (error) {
    logger.error('❌ Database connection failed in middleware:', error.message);
    res.status(503).json({
      error: 'Database connection failed',
      message: 'Service temporarily unavailable. Please try again.'
    });
  }
};

module.exports = {
  ensureDbConnection
};
