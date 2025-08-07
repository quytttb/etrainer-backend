const mongoose = require('mongoose');
const { connectDB } = require('../configs/db');

/**
 * Middleware to ensure database connection in serverless environment
 */
const ensureDbConnection = async (req, res, next) => {
  try {
    // Check if already connected
    if (mongoose.connection.readyState === 1) {
      return next();
    }
    
    // If not connected, connect now
    if (mongoose.connection.readyState === 0) {
      await connectDB();
    }
    
    // Wait for connection to be ready if still connecting
    if (mongoose.connection.readyState === 2) {
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
