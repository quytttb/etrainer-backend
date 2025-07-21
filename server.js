#!/usr/bin/env node
/**
 * ETrainer Backend - Scalable Entry Point
 * This file initializes the application with load balancing and cluster support
 */

const { optimizeForServerless } = require('./src/configs/serverless');
const loadBalancer = require('./src/configs/loadBalancer');
const logger = require('./src/utils/logger');

// Apply serverless optimizations
optimizeForServerless();

// Check if we should run in cluster mode (disabled for serverless)
const shouldCluster = (process.env.NODE_ENV === 'production' || process.env.ENABLE_CLUSTERING === 'true')
  && !process.env.VERCEL && !process.env.NETLIFY && !process.env.AWS_LAMBDA_FUNCTION_NAME;

async function startApplication() {
  try {
    if (shouldCluster) {
      // Run with load balancing
      const isMaster = loadBalancer.start();

      if (isMaster) {
        // Master process - just manage workers
        logger.info('🎛️ Master process started, managing workers...');

        // Log cluster stats periodically
        setInterval(() => {
          const stats = loadBalancer.getStats();
          logger.info('📊 Cluster Stats:', stats);
        }, 60000); // Every minute

        return;
      }
    }

    // Worker process or single-process mode
    logger.info('🚀 Starting ETrainer Backend worker...');

    // Import and start the main application
    const app = require('./src/main');

    // Worker health reporting
    if (shouldCluster) {
      setInterval(() => {
        loadBalancer.sendHealthCheck();
      }, 30000); // Every 30 seconds
    }

  } catch (error) {
    logger.error('💥 Failed to start application:', error);
    process.exit(1);
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('💥 Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the application
startApplication();
