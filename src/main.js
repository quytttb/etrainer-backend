const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const compression = require("compression");
const connectDB = require("./configs/db");
const atlasManager = require("./configs/atlas");
const serverlessDB = require("./configs/serverlessDB");
const { initializeFirebase } = require("./configs/firebase");
const cloudinaryManager = require("./configs/cloudinary");
const jobScheduler = require("./configs/jobScheduler");
const router = require("./routes");
const { sanitizeInput } = require("./middlewares/validation");
const { logRateLimitHit } = require("./middlewares/security");
const { performanceMonitor } = require("./middlewares/performance");
const { ensureDbConnection } = require("./middlewares/database");
const { cache } = require("./configs/cache");
const dbOptimization = require("./utils/dbOptimization");
const logger = require("./utils/logger");
const { isServerless } = require("./configs/serverless");
require("dotenv").config();

const app = express();

// 🔒 Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// 🚦 Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: "Too many requests from this IP, please try again later."
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 auth requests per windowMs
  message: {
    error: "Too many authentication attempts, please try again later."
  },
  skipSuccessfulRequests: true,
});

// Strict rate limiter for sensitive operations
const strictLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // limit each IP to 5 requests per hour
  message: {
    error: "Too many sensitive operations, please try again later."
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// File upload rate limiter
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // limit each IP to 20 uploads per windowMs
  message: {
    error: "Too many uploads, please try again later."
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' })); // Add URL encoded support
app.use(morgan("combined"));

// Global input sanitization
app.use(sanitizeInput);

// Security logging
app.use(logRateLimitHit);

// Performance monitoring
app.use(performanceMonitor);

// 🔧 SECURITY FIX: Use environment variables for CORS configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ["http://localhost:5173", "http://localhost:8081"];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
    optionsSuccessStatus: 200
  })
);

// Initialize services
async function initializeServices() {
  try {
    // Database connection - simplified for serverless
    if (isServerless) {
      logger.info('🔧 Serverless environment - using direct connection...');
      if (process.env.MONGODB_URI) {
        try {
          await connectDB();
          logger.info('✅ Direct MongoDB connection established');
        } catch (dbError) {
          logger.warn('⚠️ MongoDB connection failed:', dbError.message);
        }
      } else {
        logger.warn('⚠️ MONGODB_URI not found in environment');
      }
    } else {
      // Traditional environment - try Atlas first, fallback to local
      if (process.env.MONGODB_ATLAS_URI || process.env.MONGODB_ATLAS_CLUSTER) {
        logger.info('🌍 Attempting MongoDB Atlas connection...');
        try {
          await atlasManager.connect();
          logger.info('✅ Connected to MongoDB Atlas');
        } catch (atlasError) {
          logger.warn('⚠️ Atlas connection failed, falling back to local MongoDB:', atlasError.message);
          connectDB();
        }
      } else {
        connectDB();
      }
    }

    // Initialize Firebase
    initializeFirebase();

    // Initialize job scheduler (only if not serverless)
    if (!isServerless) {
      await jobScheduler.initialize();
    } else {
      logger.info('⚠️ Skipping job scheduler in serverless environment');
    }

    // Initialize database indexes
    dbOptimization.createIndexes().catch(err =>
      logger.error('Failed to create database indexes:', err.message)
    );

    logger.info('✅ All services initialized successfully');
  } catch (error) {
    logger.error('❌ Service initialization failed:', error.message);
    throw error;
  }
}

initializeServices();

// Health check route
app.get("/", (req, res) => {
  res.json({
    message: "ETrainer Backend API is running!",
    timestamp: new Date().toISOString(),
    status: "healthy"
  });
});

app.get("/health", async (req, res) => {
  try {
    // Get database stats - use serverless manager in serverless environment
    const dbStats = isServerless ?
      serverlessDB.getConnectionStatus() :
      dbOptimization.getConnectionStats();

    const healthChecks = [
      Promise.resolve(dbStats),
      cache.getStats()
    ];

    // Only check job scheduler if not serverless
    if (!isServerless) {
      healthChecks.push(jobScheduler.healthCheck().catch(() => ({ status: 'error' })));
    }

    // Only check cloudinary if configured
    if (process.env.CLOUDINARY_CLOUD_NAME) {
      healthChecks.push(cloudinaryManager.healthCheck().catch(() => ({ status: 'error' })));
    }

    const [finalDbStats, cacheStats, jobStats, cloudinaryHealth] = await Promise.all(healthChecks);

    res.json({
      status: "OK",
      message: "Server is healthy",
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      environment: isServerless ? 'serverless' : 'traditional',
      services: {
        database: finalDbStats,
        cache: cacheStats,
        jobScheduler: !isServerless ? jobStats : { status: 'disabled', reason: 'serverless' },
        cloudinary: process.env.CLOUDINARY_CLOUD_NAME ? cloudinaryHealth : { status: 'not_configured' }
      },
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024)
      },
      cluster: process.env.ENABLE_CLUSTERING === 'true' ? {
        worker_id: process.env.CLUSTER_WORKER_ID || 'single',
        pid: process.pid
      } : null
    });
  } catch (error) {
    logger.error('Health check failed:', error.message);
    res.status(503).json({
      status: "ERROR",
      message: "Health check failed",
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Apply auth rate limiter to auth routes
app.use("/api/auth", authLimiter);

// Apply database connection middleware to all API routes
app.use("/api", ensureDbConnection);

app.use("/api", router);

// Global error handler
app.use((error, req, res, _next) => {
  logger.error("🚨 Unhandled error:", {
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  res.status(500).json({
    error: "Internal server error",
    message: process.env.NODE_ENV === 'production' ? 'Something went wrong' : error.message
  });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    error: "Route not found",
    message: `Cannot ${req.method} ${req.originalUrl}`
  });
});

const PORT = process.env.PORT || 8080;

const server = app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown
const gracefulShutdown = async () => {
  console.log('\n🔄 Received shutdown signal, starting graceful shutdown...');

  try {
    // Stop accepting new connections
    server.close(async (err) => {
      if (err) {
        console.error('❌ Error during server shutdown:', err);
        process.exit(1);
      }

      console.log('🔒 HTTP server closed');

      // Shutdown services
      try {
        if (!isServerless && jobScheduler) {
          await jobScheduler.shutdown();
        }
        if (atlasManager.isConnected) {
          await atlasManager.disconnect();
        }
        console.log('✅ All services shut down gracefully');
        process.exit(0);
      } catch (serviceError) {
        console.error('❌ Error shutting down services:', serviceError);
        process.exit(1);
      }
    });
  } catch (error) {
    console.error('❌ Error during graceful shutdown:', error);
    process.exit(1);
  }

  // Force shutdown after 30 seconds
  setTimeout(() => {
    console.error('⏰ Forced shutdown after 30 seconds');
    process.exit(1);
  }, 30000);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

module.exports = app;
