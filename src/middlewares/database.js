const serverlessDB = require('../configs/serverlessDB');
const { isServerless } = require('../configs/serverless');
const mongoose = require('mongoose');

/**
 * Middleware to ensure database connection in serverless environment
 */
const ensureDbConnection = async (req, res, next) => {
  // Only apply in serverless environment
  if (!isServerless) {
    return next();
  }

  try {
    // Simple direct connection approach
    if (mongoose.connection.readyState === 0) {
      if (!process.env.MONGODB_URI) {
        throw new Error('MONGODB_URI not found');
      }
      
      console.log('🔌 Attempting direct MongoDB connection...');
      await mongoose.connect(process.env.MONGODB_URI, {
        maxPoolSize: 5,
        serverSelectionTimeoutMS: 10000,
        socketTimeoutMS: 45000,
        bufferCommands: true,
        retryWrites: true,
      });
      console.log('✅ Direct MongoDB connection successful');
    }
    
    next();
  } catch (error) {
    console.error('❌ Database connection failed in middleware:', error.message);
    res.status(503).json({
      error: 'Database connection failed',
      message: 'Service temporarily unavailable. Please try again.',
      debug: error.message
    });
  }
};

module.exports = {
  ensureDbConnection
};
