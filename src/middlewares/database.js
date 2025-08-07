const mongoose = require('mongoose');
const { connectDB } = require('../configs/db');

/**
 * Middleware to ensure database connection in serverless environment
 */
const ensureDbConnection = async (req, res, next) => {
  try {
    console.log('🔧 DB Middleware - connection state:', mongoose.connection.readyState);
    
    // Always force connection for every request in serverless
    if (mongoose.connection.readyState !== 1) {
      console.log('🔧 DB Middleware - forcing new connection...');
      await connectDB();
      
      // Wait a bit for connection to be ready
      let retries = 10;
      while (mongoose.connection.readyState !== 1 && retries > 0) {
        await new Promise(resolve => setTimeout(resolve, 100));
        retries--;
      }
      
      if (mongoose.connection.readyState !== 1) {
        throw new Error('Failed to establish database connection');
      }
    }
    
    console.log('🔧 DB Middleware - connection ready');
    next();
  } catch (error) {
    console.error('Database connection error:', error);
    res.status(503).json({
      error: 'Database connection failed',
      message: 'Service temporarily unavailable. Please try again.'
    });
  }
};

module.exports = {
  ensureDbConnection
};
