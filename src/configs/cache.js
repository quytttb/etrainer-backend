const Redis = require('ioredis');
const NodeCache = require('node-cache');
const logger = require('../utils/logger');

// Redis configuration
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3,
  lazyConnect: true,
  connectTimeout: 10000,
  commandTimeout: 5000,
};

// Initialize Redis client
let redisClient = null;
try {
  redisClient = new Redis(redisConfig);

  redisClient.on('connect', () => {
    logger.info('✅ Redis connected successfully');
  });

  redisClient.on('error', (err) => {
    logger.error('❌ Redis connection error:', err.message);
  });

  redisClient.on('close', () => {
    logger.warn('⚠️ Redis connection closed');
  });
} catch (error) {
  logger.error('❌ Redis initialization failed:', error.message);
}

// Memory cache for frequently accessed data (fallback when Redis unavailable)
const memoryCache = new NodeCache({
  stdTTL: 300, // Default 5 minutes
  checkperiod: 60, // Check for expired keys every 60 seconds
  useClones: false // Better performance
});

// Cache utility functions
const cache = {
  // Get from cache (Redis first, fallback to memory)
  async get(key) {
    try {
      if (redisClient && redisClient.status === 'ready') {
        const value = await redisClient.get(key);
        return value ? JSON.parse(value) : null;
      }
    } catch (error) {
      logger.warn('Redis get failed, using memory cache:', error.message);
    }

    // Fallback to memory cache
    return memoryCache.get(key) || null;
  },

  // Set to cache (both Redis and memory)
  async set(key, value, ttl = 300) {
    const stringValue = JSON.stringify(value);

    try {
      if (redisClient && redisClient.status === 'ready') {
        await redisClient.setex(key, ttl, stringValue);
      }
    } catch (error) {
      logger.warn('Redis set failed:', error.message);
    }

    // Always set in memory cache as fallback
    memoryCache.set(key, value, ttl);
    return true;
  },

  // Delete from cache
  async del(key) {
    try {
      if (redisClient && redisClient.status === 'ready') {
        await redisClient.del(key);
      }
    } catch (error) {
      logger.warn('Redis delete failed:', error.message);
    }

    memoryCache.del(key);
    return true;
  },

  // Clear all cache
  async flush() {
    try {
      if (redisClient && redisClient.status === 'ready') {
        await redisClient.flushdb();
      }
    } catch (error) {
      logger.warn('Redis flush failed:', error.message);
    }

    memoryCache.flushAll();
    return true;
  },

  // Get cache statistics
  getStats() {
    const memStats = memoryCache.getStats();
    return {
      memory: {
        keys: memStats.keys,
        hits: memStats.hits,
        misses: memStats.misses,
        hitRate: memStats.hits / (memStats.hits + memStats.misses) || 0
      },
      redis: {
        status: redisClient ? redisClient.status : 'disconnected'
      }
    };
  }
};

// Cache middleware factory
const cacheMiddleware = (ttl = 300, keyGenerator = null) => {
  return async (req, res, next) => {
    // Generate cache key
    const key = keyGenerator
      ? keyGenerator(req)
      : `cache:${req.method}:${req.originalUrl}:${JSON.stringify(req.query)}`;

    try {
      // Try to get from cache
      const cached = await cache.get(key);
      if (cached) {
        logger.debug(`Cache HIT: ${key}`);
        return res.json(cached);
      }

      logger.debug(`Cache MISS: ${key}`);

      // Override res.json to cache the response
      const originalJson = res.json;
      res.json = function (data) {
        // Cache successful responses only
        if (res.statusCode === 200) {
          cache.set(key, data, ttl).catch(err =>
            logger.warn('Failed to cache response:', err.message)
          );
        }
        return originalJson.call(this, data);
      };

    } catch (error) {
      logger.warn('Cache middleware error:', error.message);
    }

    next();
  };
};

// Predefined cache keys
const CACHE_KEYS = {
  USER_PROFILE: (userId) => `user:profile:${userId}`,
  VOCABULARY_TOPICS: 'vocabulary:topics:all',
  GRAMMAR_RULES: 'grammar:rules:all',
  QUESTIONS_BY_CATEGORY: (category) => `questions:category:${category}`,
  EXAM_QUESTIONS: (examId) => `exam:questions:${examId}`,
  USER_JOURNEY: (userId) => `user:journey:${userId}`,
  LEADERBOARD: 'leaderboard:top',
  SYSTEM_STATS: 'system:stats'
};

module.exports = {
  cache,
  cacheMiddleware,
  CACHE_KEYS,
  redisClient,
  memoryCache
};
