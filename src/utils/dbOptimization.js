const mongoose = require('mongoose');
const logger = require('../utils/logger');

// Database optimization utilities
const dbOptimization = {
  // Create indexes for better query performance
  async createIndexes() {
    try {
      const collections = mongoose.connection.collections;

      // User indexes
      if (collections.users) {
        await collections.users.createIndex({ email: 1 }, { unique: true });
        await collections.users.createIndex({ createdAt: -1 });
        await collections.users.createIndex({ lastActive: -1 });
        logger.info('✅ User indexes created');
      }

      // Question indexes
      if (collections.questions) {
        await collections.questions.createIndex({ category: 1, difficulty: 1 });
        await collections.questions.createIndex({ tags: 1 });
        await collections.questions.createIndex({ createdAt: -1 });
        logger.info('✅ Question indexes created');
      }

      // Practice History indexes
      if (collections.practicehistories) {
        await collections.practicehistories.createIndex({ user: 1, endTime: -1 });
        await collections.practicehistories.createIndex({ user: 1, category: 1 });
        await collections.practicehistories.createIndex({ endTime: -1 });
        logger.info('✅ Practice History indexes created');
      }

      // Exam History indexes
      if (collections.examhistories) {
        await collections.examhistories.createIndex({ user: 1, endTime: -1 });
        await collections.examhistories.createIndex({ exam: 1, user: 1 });
        await collections.examhistories.createIndex({ endTime: -1 });
        logger.info('✅ Exam History indexes created');
      }

      // User Journey indexes
      if (collections.userjourneys) {
        await collections.userjourneys.createIndex({ user: 1 }, { unique: true });
        await collections.userjourneys.createIndex({ 'stages.currentDay': 1 });
        await collections.userjourneys.createIndex({ updatedAt: -1 });
        logger.info('✅ User Journey indexes created');
      }

      // Notification indexes
      if (collections.notifications) {
        await collections.notifications.createIndex({ user: 1, createdAt: -1 });
        await collections.notifications.createIndex({ user: 1, read: 1 });
        await collections.notifications.createIndex({ createdAt: -1 });
        logger.info('✅ Notification indexes created');
      }

      // Vocabulary Topic indexes
      if (collections.vocabularytopics) {
        await collections.vocabularytopics.createIndex({ name: 1 });
        await collections.vocabularytopics.createIndex({ level: 1 });
        logger.info('✅ Vocabulary Topic indexes created');
      }

      // Grammar indexes
      if (collections.grammars) {
        await collections.grammars.createIndex({ title: 1 });
        await collections.grammars.createIndex({ level: 1 });
        logger.info('✅ Grammar indexes created');
      }

      logger.info('🚀 All database indexes created successfully');

    } catch (error) {
      logger.error('❌ Error creating indexes:', error.message);
    }
  },

  // Pagination utility
  paginate(page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    return {
      skip: Math.max(0, skip),
      limit: Math.min(limit, 100) // Max 100 items per page
    };
  },

  // Optimized aggregation pipeline for stats
  getUserStatsAggregation(userId) {
    return [
      { $match: { user: mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: null,
          totalPractices: { $sum: 1 },
          averageScore: { $avg: '$score' },
          totalTimeSpent: { $sum: '$timeSpent' },
          lastPractice: { $max: '$endTime' }
        }
      }
    ];
  },

  // Optimized leaderboard aggregation
  getLeaderboardAggregation(limit = 50) {
    return [
      {
        $group: {
          _id: '$user',
          totalScore: { $sum: '$score' },
          practiceCount: { $sum: 1 },
          averageScore: { $avg: '$score' },
          lastActive: { $max: '$endTime' }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'userInfo'
        }
      },
      { $unwind: '$userInfo' },
      {
        $project: {
          userId: '$_id',
          fullName: '$userInfo.fullName',
          email: '$userInfo.email',
          totalScore: 1,
          practiceCount: 1,
          averageScore: { $round: ['$averageScore', 2] },
          lastActive: 1
        }
      },
      { $sort: { totalScore: -1, averageScore: -1 } },
      { $limit: limit }
    ];
  },

  // Connection pool monitoring
  getConnectionStats() {
    const db = mongoose.connection;
    return {
      readyState: db.readyState,
      name: db.name,
      host: db.host,
      port: db.port,
      collections: Object.keys(db.collections).length
    };
  }
};

module.exports = dbOptimization;
