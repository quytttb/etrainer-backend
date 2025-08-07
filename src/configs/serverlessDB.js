const mongoose = require('mongoose');

class ServerlessDBManager {
  constructor() {
    this.isConnected = false;
    this.connectionPromise = null;
  }

  async connect() {
    // If already connected, return the existing connection
    if (this.isConnected && mongoose.connection.readyState === 1) {
      return mongoose.connection;
    }

    // If connection is in progress, wait for it
    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    // Create new connection promise
    this.connectionPromise = this.createConnection();
    return this.connectionPromise;
  }

  async createConnection() {
    try {
      if (!process.env.MONGODB_URI) {
        console.error('❌ MONGODB_URI environment variable is not defined');
        throw new Error('MONGODB_URI environment variable is not defined');
      }

      const options = {
        // Serverless optimized options
        maxPoolSize: 5,
        minPoolSize: 1,
        serverSelectionTimeoutMS: 30000,
        socketTimeoutMS: 45000,
        connectTimeoutMS: 30000,
        bufferCommands: true,
        bufferMaxEntries: 0,
        retryWrites: true,
        heartbeatFrequencyMS: 30000,
        // Use majority read/write concern for consistency
        readPreference: 'primary',
        writeConcern: { w: 'majority', j: true },
      };

      console.log('🔌 Connecting to MongoDB...');

      if (mongoose.connection.readyState === 0) {
        await mongoose.connect(process.env.MONGODB_URI, options);
      }

      this.isConnected = true;
      console.log('✅ MongoDB connected successfully');

      // Set up event listeners
      mongoose.connection.on('error', (err) => {
        console.error('❌ MongoDB connection error:', err.message);
        this.isConnected = false;
        this.connectionPromise = null;
      });

      mongoose.connection.on('disconnected', () => {
        console.warn('⚠️ MongoDB disconnected');
        this.isConnected = false;
        this.connectionPromise = null;
      });

      return mongoose.connection;

    } catch (error) {
      console.error('❌ MongoDB connection failed:', error.message);
      this.isConnected = false;
      this.connectionPromise = null;
      throw error;
    }
  }

  async ensureConnection() {
    const maxRetries = 3;
    let attempts = 0;

    while (attempts < maxRetries) {
      try {
        await this.connect();
        return;
      } catch (error) {
        attempts++;
        console.warn(`🔄 Connection attempt ${attempts}/${maxRetries} failed:`, error.message);

        if (attempts < maxRetries) {
          const delay = Math.min(1000 * Math.pow(2, attempts), 5000); // Exponential backoff
          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          throw error;
        }
      }
    }
  }

  getConnectionStatus() {
    return {
      readyState: mongoose.connection.readyState,
      isConnected: this.isConnected,
      collections: Object.keys(mongoose.connection.collections).length
    };
  }
}

module.exports = new ServerlessDBManager();
