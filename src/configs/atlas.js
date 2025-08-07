const mongoose = require('mongoose');
const logger = require('../utils/logger');

// Force set global default for bufferCommands
mongoose.set('bufferCommands', true);

class AtlasConnectionManager {
  constructor() {
    this.isConnected = false;
    this.connectionString = this.buildConnectionString();
    this.options = this.getOptimizedOptions();
  }

  buildConnectionString() {
    const {
      MONGODB_ATLAS_URI,
      MONGODB_ATLAS_USER,
      MONGODB_ATLAS_PASSWORD,
      MONGODB_ATLAS_CLUSTER,
      MONGODB_ATLAS_DATABASE
    } = process.env;

    // If full URI is provided, use it
    if (MONGODB_ATLAS_URI) {
      return MONGODB_ATLAS_URI;
    }

    // Build URI from components
    if (MONGODB_ATLAS_USER && MONGODB_ATLAS_PASSWORD && MONGODB_ATLAS_CLUSTER) {
      return `mongodb+srv://${MONGODB_ATLAS_USER}:${MONGODB_ATLAS_PASSWORD}@${MONGODB_ATLAS_CLUSTER}/${MONGODB_ATLAS_DATABASE || 'etrainer'}?retryWrites=true&w=majority`;
    }

    // Fallback to local MongoDB
    return process.env.MONGODB_URI || 'mongodb://localhost:27017/etrainer';
  }

  getOptimizedOptions() {
    const isServerless = process.env.VERCEL || process.env.NETLIFY || process.env.AWS_LAMBDA_FUNCTION_NAME;
    
    return {
      // Connection Pool Settings - optimized for serverless
      maxPoolSize: isServerless ? 5 : parseInt(process.env.MONGODB_MAX_POOL_SIZE) || 20,
      minPoolSize: isServerless ? 1 : parseInt(process.env.MONGODB_MIN_POOL_SIZE) || 5,
      maxIdleTimeMS: 30000,
      serverSelectionTimeoutMS: isServerless ? 30000 : 5000, // Increase for serverless
      socketTimeoutMS: 45000,
      connectTimeoutMS: isServerless ? 30000 : 10000, // Add connection timeout

      // Heartbeat Settings
      heartbeatFrequencyMS: isServerless ? 30000 : 10000, // Reduce frequency for serverless

      // Write Concern
      writeConcern: {
        w: 'majority',
        j: true,
        wtimeout: 10000
      },

      // Read Preference
      readPreference: 'secondaryPreferred',
      readConcern: { level: 'majority' },

      // Buffer Settings - enable for serverless compatibility
      bufferMaxEntries: 0,
      bufferCommands: true, // Enable buffering for serverless

      // Compression
      compressors: ['snappy', 'zlib'],

      // SSL/TLS (required for Atlas)
      ssl: this.connectionString.includes('mongodb+srv'),

      // Auto Index
      autoIndex: process.env.NODE_ENV !== 'production',

      // Connection Events
      useNewUrlParser: true,
      useUnifiedTopology: true
    };
  }

  async connect() {
    try {
      logger.info('🔌 Connecting to MongoDB Atlas...');

      // Set up connection event listeners
      mongoose.connection.on('connected', () => {
        this.isConnected = true;
        logger.info('✅ MongoDB Atlas connected successfully');
      });

      mongoose.connection.on('error', (err) => {
        logger.error('❌ MongoDB Atlas connection error:', err.message);
        this.isConnected = false;
      });

      mongoose.connection.on('disconnected', () => {
        logger.warn('⚠️ MongoDB Atlas disconnected');
        this.isConnected = false;
      });

      mongoose.connection.on('reconnected', () => {
        logger.info('🔄 MongoDB Atlas reconnected');
        this.isConnected = true;
      });

      // Connect with retry logic
      await this.connectWithRetry();

      // Set up monitoring
      this.setupMonitoring();

      return mongoose.connection;
    } catch (error) {
      logger.error('🚨 Failed to connect to MongoDB Atlas:', error.message);
      throw error;
    }
  }

  async connectWithRetry(retries = 5) {
    for (let i = 0; i < retries; i++) {
      try {
        await mongoose.connect(this.connectionString, this.options);
        return;
      } catch (error) {
        logger.warn(`⚠️ MongoDB Atlas connection attempt ${i + 1} failed:`, error.message);

        if (i === retries - 1) {
          throw error;
        }

        // Exponential backoff
        const delay = Math.min(1000 * Math.pow(2, i), 30000);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  setupMonitoring() {
    // Monitor connection pool
    setInterval(() => {
      if (this.isConnected) {
        const poolStats = this.getPoolStats();
        logger.debug('📊 MongoDB Atlas Pool Stats:', poolStats);
      }
    }, 60000); // Every minute

    // Health check
    setInterval(async () => {
      try {
        await this.healthCheck();
      } catch (error) {
        logger.error('💔 MongoDB Atlas health check failed:', error.message);
      }
    }, 30000); // Every 30 seconds
  }

  getPoolStats() {
    const connection = mongoose.connection;
    return {
      readyState: connection.readyState,
      host: connection.host,
      port: connection.port,
      name: connection.name,
      // Connection pool info would be available in newer versions
    };
  }

  async healthCheck() {
    if (!this.isConnected) {
      throw new Error('Not connected to MongoDB Atlas');
    }

    const admin = mongoose.connection.db.admin();
    const result = await admin.ping();

    if (result.ok !== 1) {
      throw new Error('MongoDB Atlas ping failed');
    }

    return {
      status: 'healthy',
      ping: result,
      timestamp: new Date().toISOString()
    };
  }

  async getClusterInfo() {
    try {
      const admin = mongoose.connection.db.admin();
      const [serverStatus, buildInfo, replSetStatus] = await Promise.all([
        admin.serverStatus(),
        admin.buildInfo(),
        admin.replSetGetStatus().catch(() => null) // May not be available
      ]);

      return {
        server: {
          version: buildInfo.version,
          uptime: serverStatus.uptime,
          connections: serverStatus.connections
        },
        replica_set: replSetStatus ? {
          set: replSetStatus.set,
          members: replSetStatus.members?.length || 0
        } : null,
        memory: serverStatus.mem,
        opcounters: serverStatus.opcounters
      };
    } catch (error) {
      logger.error('Failed to get cluster info:', error.message);
      return null;
    }
  }

  async disconnect() {
    if (this.isConnected) {
      logger.info('🔌 Disconnecting from MongoDB Atlas...');
      await mongoose.disconnect();
      this.isConnected = false;
      logger.info('✅ MongoDB Atlas disconnected');
    }
  }

  // Utility methods for Atlas-specific operations
  async createReadOnlyUser(username, password, database = 'etrainer') {
    try {
      const admin = mongoose.connection.db.admin();
      await admin.command({
        createUser: username,
        pwd: password,
        roles: [
          { role: 'read', db: database }
        ]
      });
      logger.info(`✅ Read-only user '${username}' created for database '${database}'`);
    } catch (error) {
      logger.error('Failed to create read-only user:', error.message);
      throw error;
    }
  }

  async enableSharding(database, collection) {
    try {
      const admin = mongoose.connection.db.admin();

      // Enable sharding for database
      await admin.command({ enableSharding: database });

      // Shard collection
      await admin.command({
        shardCollection: `${database}.${collection}`,
        key: { _id: 1 } // Default shard key
      });

      logger.info(`✅ Sharding enabled for ${database}.${collection}`);
    } catch (error) {
      logger.error('Failed to enable sharding:', error.message);
      throw error;
    }
  }
}

module.exports = new AtlasConnectionManager();
