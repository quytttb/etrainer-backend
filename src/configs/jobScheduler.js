const Agenda = require('agenda');
const logger = require('../utils/logger');

class JobScheduler {
  constructor() {
    this.agenda = null;
    this.isStarted = false;
    this.jobs = new Map();
  }

  async initialize() {
    try {
      // Use MongoDB connection for Agenda
      const mongoConnectionString = process.env.MONGODB_URI || 'mongodb://localhost:27017/etrainer';

      this.agenda = new Agenda({
        db: {
          address: mongoConnectionString,
          collection: 'agendaJobs',
          options: {
            useNewUrlParser: true,
            useUnifiedTopology: true
          }
        },
        processEvery: '10 seconds',
        maxConcurrency: 10,
        defaultConcurrency: 5,
        defaultLockLifetime: 10 * 60 * 1000 // 10 minutes
      });

      // Set up event listeners
      this.setupEventListeners();

      // Define all jobs
      this.defineJobs();

      // Start the agenda
      await this.agenda.start();
      this.isStarted = true;

      logger.info('✅ Job Scheduler (Agenda) initialized and started');

      // Schedule recurring jobs
      await this.scheduleRecurringJobs();

    } catch (error) {
      logger.error('❌ Failed to initialize Job Scheduler:', error.message);
      throw error;
    }
  }

  setupEventListeners() {
    this.agenda.on('ready', () => {
      logger.info('📅 Agenda ready');
    });

    this.agenda.on('start', (job) => {
      logger.info(`🚀 Job started: ${job.attrs.name} (${job.attrs._id})`);
    });

    this.agenda.on('complete', (job) => {
      logger.info(`✅ Job completed: ${job.attrs.name} (${job.attrs._id})`);
    });

    this.agenda.on('success', (job) => {
      logger.info(`🎉 Job succeeded: ${job.attrs.name} (${job.attrs._id})`);
    });

    this.agenda.on('fail', (error, job) => {
      logger.error(`❌ Job failed: ${job.attrs.name} (${job.attrs._id})`, error.message);
    });
  }

  defineJobs() {
    // Example: Send daily notifications
    this.agenda.define('send daily notifications', async (job) => {
      const { data } = job.attrs;
      logger.info('📱 Sending daily notifications...');

      try {
        // Import notification service
        const notificationService = require('../utils/pushNotificationService');

        // Get users who should receive notifications
        const User = require('../models/users');
        const users = await User.find({
          notificationsEnabled: true,
          dailyNotifications: true
        }).select('fcmToken');

        let sentCount = 0;
        for (const user of users) {
          if (user.fcmToken) {
            try {
              await notificationService.sendToUser(user.fcmToken, {
                title: 'Daily English Practice',
                body: 'Time for your daily English lesson! 📚',
                data: { type: 'daily_reminder' }
              });
              sentCount++;
            } catch (error) {
              logger.error(`Failed to send notification to user ${user._id}:`, error.message);
            }
          }
        }

        logger.info(`📱 Sent ${sentCount} daily notifications`);
        job.attrs.result = { sentCount, totalUsers: users.length };
      } catch (error) {
        logger.error('❌ Daily notification job failed:', error.message);
        throw error;
      }
    });

    // Example: Clean up old exam histories
    this.agenda.define('cleanup old exam histories', async (job) => {
      logger.info('🧹 Cleaning up old exam histories...');

      try {
        const ExamHistory = require('../models/examHistory');

        // Delete exam histories older than 6 months
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const result = await ExamHistory.deleteMany({
          createdAt: { $lt: sixMonthsAgo },
          isImportant: { $ne: true } // Keep important exam histories
        });

        logger.info(`🧹 Cleaned up ${result.deletedCount} old exam histories`);
        job.attrs.result = { deletedCount: result.deletedCount };
      } catch (error) {
        logger.error('❌ Cleanup job failed:', error.message);
        throw error;
      }
    });

    // Example: Generate weekly reports
    this.agenda.define('generate weekly reports', async (job) => {
      logger.info('📊 Generating weekly reports...');

      try {
        const User = require('../models/users');
        const ExamHistory = require('../models/examHistory');

        // Get stats for the past week
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

        const [userCount, examCount, activeUsers] = await Promise.all([
          User.countDocuments({ createdAt: { $gte: oneWeekAgo } }),
          ExamHistory.countDocuments({ createdAt: { $gte: oneWeekAgo } }),
          User.countDocuments({ lastActive: { $gte: oneWeekAgo } })
        ]);

        const report = {
          week: oneWeekAgo.toISOString().split('T')[0],
          newUsers: userCount,
          examsCompleted: examCount,
          activeUsers: activeUsers,
          generatedAt: new Date().toISOString()
        };

        // Save report (you could save to database or send via email)
        logger.info('📊 Weekly report generated:', report);
        job.attrs.result = report;
      } catch (error) {
        logger.error('❌ Weekly report job failed:', error.message);
        throw error;
      }
    });

    // Example: Update user streaks
    this.agenda.define('update user streaks', async (job) => {
      logger.info('🔥 Updating user streaks...');

      try {
        const User = require('../models/users');
        const users = await User.find({ streak: { $exists: true } });

        let updatedCount = 0;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (const user of users) {
          const lastActive = new Date(user.lastActive);
          lastActive.setHours(0, 0, 0, 0);

          const daysDiff = Math.floor((today - lastActive) / (1000 * 60 * 60 * 24));

          if (daysDiff === 1) {
            // User was active yesterday, maintain streak
            continue;
          } else if (daysDiff > 1) {
            // User missed a day, reset streak
            await User.findByIdAndUpdate(user._id, {
              streak: { count: 0, lastUpdated: today }
            });
            updatedCount++;
          }
        }

        logger.info(`🔥 Updated ${updatedCount} user streaks`);
        job.attrs.result = { updatedCount };
      } catch (error) {
        logger.error('❌ Update streaks job failed:', error.message);
        throw error;
      }
    });

    // Example: Backup critical data
    this.agenda.define('backup critical data', async (job) => {
      logger.info('💾 Starting critical data backup...');

      try {
        // This would typically backup to cloud storage
        const collections = ['users', 'exams', 'questions', 'lessons'];
        const backupResults = [];

        for (const collection of collections) {
          try {
            const Model = require(`../models/${collection === 'users' ? 'users' : collection.slice(0, -1)}`);
            const count = await Model.countDocuments();
            backupResults.push({ collection, count });
            logger.info(`💾 Backed up ${count} documents from ${collection}`);
          } catch (error) {
            logger.error(`Failed to backup ${collection}:`, error.message);
          }
        }

        job.attrs.result = { backupResults, timestamp: new Date().toISOString() };
      } catch (error) {
        logger.error('❌ Backup job failed:', error.message);
        throw error;
      }
    });

    logger.info('📝 All background jobs defined');
  }

  async scheduleRecurringJobs() {
    try {
      // Cancel existing jobs to avoid duplicates
      await this.agenda.cancel({});

      // Schedule daily notifications at 9 AM
      await this.agenda.every('0 9 * * *', 'send daily notifications');

      // Schedule cleanup every Sunday at 2 AM
      await this.agenda.every('0 2 * * 0', 'cleanup old exam histories');

      // Schedule weekly reports every Monday at 8 AM
      await this.agenda.every('0 8 * * 1', 'generate weekly reports');

      // Schedule streak updates every day at midnight
      await this.agenda.every('0 0 * * *', 'update user streaks');

      // Schedule backup every day at 3 AM
      await this.agenda.every('0 3 * * *', 'backup critical data');

      logger.info('⏰ Recurring jobs scheduled');
    } catch (error) {
      logger.error('❌ Failed to schedule recurring jobs:', error.message);
      throw error;
    }
  }

  // Method to schedule one-time jobs
  async scheduleJob(name, data = {}, when = 'now') {
    try {
      const job = this.agenda.create(name, data);

      if (when === 'now') {
        await job.schedule('now').save();
      } else {
        await job.schedule(when).save();
      }

      logger.info(`📅 Scheduled job: ${name} for ${when}`);
      return job;
    } catch (error) {
      logger.error(`❌ Failed to schedule job ${name}:`, error.message);
      throw error;
    }
  }

  // Method to cancel jobs
  async cancelJob(query) {
    try {
      const numRemoved = await this.agenda.cancel(query);
      logger.info(`🗑️ Cancelled ${numRemoved} jobs`);
      return numRemoved;
    } catch (error) {
      logger.error('❌ Failed to cancel jobs:', error.message);
      throw error;
    }
  }

  // Get job statistics
  async getJobStats() {
    try {
      const jobs = await this.agenda.jobs({});
      const stats = {
        total: jobs.length,
        scheduled: jobs.filter(job => job.attrs.nextRunAt).length,
        running: jobs.filter(job => job.attrs.lockedAt && !job.attrs.lastFinishedAt).length,
        completed: jobs.filter(job => job.attrs.lastFinishedAt).length,
        failed: jobs.filter(job => job.attrs.failedAt).length
      };

      return stats;
    } catch (error) {
      logger.error('❌ Failed to get job stats:', error.message);
      throw error;
    }
  }

  // Health check
  async healthCheck() {
    try {
      if (!this.isStarted) {
        throw new Error('Job scheduler not started');
      }

      const stats = await this.getJobStats();

      return {
        status: 'healthy',
        isStarted: this.isStarted,
        stats,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('💔 Job scheduler health check failed:', error.message);
      throw error;
    }
  }

  // Graceful shutdown
  async shutdown() {
    try {
      if (this.agenda && this.isStarted) {
        logger.info('🔄 Shutting down job scheduler...');
        await this.agenda.stop();
        this.isStarted = false;
        logger.info('✅ Job scheduler shut down');
      }
    } catch (error) {
      logger.error('❌ Error during job scheduler shutdown:', error.message);
      throw error;
    }
  }
}

module.exports = new JobScheduler();
