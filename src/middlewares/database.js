const serverlessDB = require('../configs/serverlessDB');
const { isServerless } = require('../configs/serverless');
const mongoose = require('mongoose');

/**
 * Middleware to ensure database connection in serverless environment
 */
const ensureDbConnection = async (req, res, next) => {
  try {
    // Check if already connected
    if (mongoose.connection.readyState === 1) {
      return next();
    }
    
    // If not connected, wait for connection
    if (mongoose.connection.readyState === 0) {
      // Import and connect if needed
      const connectDB = require('../configs/db');
      await connectDB();
    }
    
    // Wait for connection to be ready
    if (mongoose.connection.readyState !== 1) {
      await new Promise((resolve, reject) => {
        mongoose.connection.once('connected', resolve);
        mongoose.connection.once('error', reject);
        
        // Timeout after 10 seconds
        setTimeout(() => reject(new Error('Database connection timeout')), 10000);
      });
    }
    
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
