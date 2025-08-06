const serverlessDB = require('../configs/serverlessDB');
const { isServerless } = require('../configs/serverless');
const mongoose = require('mongoose');

/**
 * Middleware to ensure database connection in serverless environment
 */
const ensureDbConnection = async (req, res, next) => {
  // Temporarily disabled for debugging
  next();
};

module.exports = {
  ensureDbConnection
};
