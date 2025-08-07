const mongoose = require('mongoose');

// Test với URI cluster mới (giống như trên Vercel)
const MONGODB_URI = 'mongodb+srv://etrainer_user:user%401234@cluster0.lo5cyua.mongodb.net/etrainer?retryWrites=true&w=majority&serverSelectionTimeoutMS=30000&socketTimeoutMS=45000&connectTimeoutMS=30000&maxPoolSize=5&minPoolSize=1&appName=Cluster0';

// Mongoose options giống như production
const mongooseOptions = {
  maxPoolSize: 5,
  serverSelectionTimeoutMS: 30000,
  socketTimeoutMS: 45000,
  connectTimeoutMS: 30000,
  bufferCommands: true,
  retryWrites: true,
  heartbeatFrequencyMS: 30000,
};

async function testProductionConnection() {
  try {
    console.log('🔌 Testing production-like connection...');
    
    await mongoose.connect(MONGODB_URI, mongooseOptions);
    console.log('✅ Connected successfully with mongoose');
    
    // Test User model (như auth endpoint)
    const User = mongoose.model('User', new mongoose.Schema({
      email: String,
      password: String,
      role: String
    }));
    
    console.log('🔍 Testing User.findOne()...');
    const startTime = Date.now();
    
    const adminUser = await User.findOne({ email: 'admin@gmail.com' });
    const duration = Date.now() - startTime;
    
    if (adminUser) {
      console.log(`✅ Found admin user in ${duration}ms:`);
      console.log(`   - ID: ${adminUser._id}`);
      console.log(`   - Email: ${adminUser.email}`);
      console.log(`   - Role: ${adminUser.role}`);
    } else {
      console.log('❌ Admin user not found');
    }
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔒 Disconnected');
  }
}

testProductionConnection();
