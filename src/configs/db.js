const { default: mongoose } = require("mongoose");

// Connection options optimized for serverless environment
const mongooseOptions = {
  maxPoolSize: 3, // Further reduce pool size for serverless
  serverSelectionTimeoutMS: 10000, // Reduce timeout for faster fail
  socketTimeoutMS: 30000, // Reduce socket timeout
  connectTimeoutMS: 10000, // Reduce connection timeout
  bufferCommands: true, // CRITICAL: Enable buffering to avoid connection issues in serverless
  retryWrites: true,
};

const connectDB = async (retries = 5) => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI environment variable is not defined");
    }

    await mongoose.connect(process.env.MONGODB_URI, mongooseOptions);
    console.log("✅ MongoDB connected successfully");

    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error("❌ MongoDB connection error:", err);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn("⚠️ MongoDB disconnected. Attempting to reconnect...");
    });

    mongoose.connection.on('reconnected', () => {
      console.log("✅ MongoDB reconnected");
    });

  } catch (error) {
    console.error(`❌ MongoDB connection failed (${6 - retries}/5):`, error.message);

    if (retries > 0) {
      console.log(`🔄 Retrying connection in 5 seconds...`);
      await new Promise(resolve => setTimeout(resolve, 5000));
      return connectDB(retries - 1);
    } else {
      console.error("🚨 Failed to connect to MongoDB after 5 attempts.");
      // Don't exit in serverless environment - throw error instead
      if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
        throw new Error('MongoDB connection failed after 5 attempts');
      } else {
        process.exit(1);
      }
    }
  }
};

// Graceful shutdown
const gracefulShutdown = async () => {
  try {
    await mongoose.connection.close();
    console.log("🔒 MongoDB connection closed gracefully");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error during graceful shutdown:", error);
    process.exit(1);
  }
};

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

module.exports = connectDB;
module.exports.connectDB = connectDB;
