const express = require("express");
const { checkLogin, isAdmin } = require("../middlewares/auth");
const { cache } = require("../configs/cache");
const dbOptimization = require("../utils/dbOptimization");
const { logSensitiveOperation } = require("../middlewares/security");
const loadBalancer = require("../configs/loadBalancer");
const jobScheduler = require("../configs/jobScheduler");
const cloudinaryManager = require("../configs/cloudinary");
const logger = require("../utils/logger");

const systemRouter = express.Router();

// Cache management endpoints (Admin only)
systemRouter.get("/cache/stats", checkLogin, isAdmin, (req, res) => {
  const stats = cache.getStats();
  res.json(stats);
});

systemRouter.post("/cache/clear",
  checkLogin,
  isAdmin,
  logSensitiveOperation("CACHE_CLEAR"),
  async (req, res) => {
    try {
      await cache.flush();
      res.json({
        success: true,
        message: "Cache cleared successfully"
      });
    } catch (error) {
      res.status(500).json({
        error: "Failed to clear cache",
        message: error.message
      });
    }
  }
);

// Database statistics
systemRouter.get("/database/stats", checkLogin, isAdmin, (req, res) => {
  const stats = dbOptimization.getConnectionStats();
  res.json(stats);
});

// System performance metrics
systemRouter.get("/performance", checkLogin, isAdmin, (req, res) => {
  const memUsage = process.memoryUsage();
  const cpuUsage = process.cpuUsage();

  res.json({
    memory: {
      rss: Math.round(memUsage.rss / 1024 / 1024), // MB
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024), // MB
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
      external: Math.round(memUsage.external / 1024 / 1024), // MB
      heapUsagePercent: Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100)
    },
    cpu: {
      user: cpuUsage.user,
      system: cpuUsage.system
    },
    uptime: Math.round(process.uptime()),
    pid: process.pid,
    nodeVersion: process.version,
    platform: process.platform,
    arch: process.arch
  });
});

// Generate leaderboard (cached for 5 minutes)
systemRouter.get("/leaderboard", async (req, res) => {
  try {
    const PracticeHistory = require("../models/practiceHistory");
    const limit = parseInt(req.query.limit) || 50;

    // Try to get from cache first
    const cacheKey = `leaderboard:${limit}`;
    let leaderboard = await cache.get(cacheKey);

    if (!leaderboard) {
      // Generate leaderboard using optimized aggregation
      const pipeline = dbOptimization.getLeaderboardAggregation(limit);
      leaderboard = await PracticeHistory.aggregate(pipeline);

      // Cache for 5 minutes
      await cache.set(cacheKey, leaderboard, 300);
    }

    res.json({
      data: leaderboard,
      cached: !!leaderboard.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    res.status(500).json({
      error: "Failed to generate leaderboard",
      message: error.message
    });
  }
});

// Cluster status endpoint
systemRouter.get("/cluster/status", checkLogin, isAdmin, (req, res) => {
  try {
    const clusterStats = loadBalancer.getStats();

    res.json({
      message: "Cluster status retrieved",
      cluster: clusterStats,
      clustering_enabled: process.env.ENABLE_CLUSTERING === 'true',
      worker_id: process.env.CLUSTER_WORKER_ID || 'single',
      process_id: process.pid,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Cluster status failed:', error.message);
    res.status(500).json({
      error: 'Failed to get cluster status',
      message: error.message
    });
  }
});

// Job scheduler endpoints
systemRouter.get("/jobs/stats", checkLogin, isAdmin, async (req, res) => {
  try {
    const [stats, health] = await Promise.all([
      jobScheduler.getJobStats(),
      jobScheduler.healthCheck()
    ]);

    res.json({
      message: "Job statistics retrieved",
      health,
      stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Job stats failed:', error.message);
    res.status(500).json({
      error: 'Failed to get job statistics',
      message: error.message
    });
  }
});

systemRouter.post("/jobs/schedule", checkLogin, isAdmin, async (req, res) => {
  try {
    const { name, data = {}, when = 'now' } = req.body;

    if (!name) {
      return res.status(400).json({
        error: 'Job name is required'
      });
    }

    const job = await jobScheduler.scheduleJob(name, data, when);
    logger.info(`📅 Job scheduled: ${name} by user ${req.user.id}`);

    res.json({
      message: 'Job scheduled successfully',
      job: {
        name: job.attrs.name,
        data: job.attrs.data,
        scheduled_for: job.attrs.nextRunAt,
        created_at: job.attrs.createdAt
      }
    });
  } catch (error) {
    logger.error('Job scheduling failed:', error.message);
    res.status(500).json({
      error: 'Failed to schedule job',
      message: error.message
    });
  }
});

// Cloudinary management
systemRouter.get("/cloudinary/usage", checkLogin, isAdmin, async (req, res) => {
  try {
    const usage = await cloudinaryManager.getUsageStats();

    res.json({
      message: 'Cloudinary usage retrieved',
      usage,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Cloudinary usage failed:', error.message);
    res.status(500).json({
      error: 'Failed to get Cloudinary usage',
      message: error.message
    });
  }
});

// Performance metrics
systemRouter.get("/metrics", checkLogin, isAdmin, async (req, res) => {
  try {
    const metrics = {
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: {
        heap_used_mb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        heap_total_mb: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        external_mb: Math.round(process.memoryUsage().external / 1024 / 1024),
        usage_percent: Math.round((process.memoryUsage().heapUsed / process.memoryUsage().heapTotal) * 100)
      },
      cpu: process.cpuUsage(),
      cluster: loadBalancer.getStats(),
      event_loop_lag: await new Promise(resolve => {
        const start = process.hrtime.bigint();
        setImmediate(() => {
          const lag = Number(process.hrtime.bigint() - start) / 1000000;
          resolve(lag);
        });
      })
    };

    res.json({
      message: 'Performance metrics retrieved',
      metrics
    });
  } catch (error) {
    logger.error('Metrics retrieval failed:', error.message);
    res.status(500).json({
      error: 'Failed to retrieve metrics',
      message: error.message
    });
  }
});

// Health check endpoint (duplicate of root /health for system namespace)
systemRouter.get("/health", async (req, res) => {
  try {
    const dbStats = require("../configs/db").readyState || 1;
    const cacheStats = cache.getStats();

    res.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      services: {
        database: dbStats === 1 ? "connected" : "disconnected",
        cache: cacheStats ? "active" : "inactive",
        memory_usage: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
        uptime: `${Math.round(process.uptime())}s`
      }
    });
  } catch (error) {
    res.status(500).json({
      status: "unhealthy",
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

// System status endpoint  
systemRouter.get("/status", async (req, res) => {
  try {
    const packageJson = require("../../package.json");

    res.json({
      status: "operational",
      timestamp: new Date().toISOString(),
      version: packageJson.version,
      environment: process.env.NODE_ENV || "development",
      system: {
        node_version: process.version,
        platform: process.platform,
        architecture: process.arch,
        uptime_seconds: Math.round(process.uptime()),
        memory_usage_mb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        cpu_usage: process.cpuUsage()
      },
      services: {
        database: "connected",
        cache: "active",
        file_storage: process.env.CLOUDINARY_CLOUD_NAME ? "cloudinary" : "local"
      }
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

module.exports = systemRouter;
