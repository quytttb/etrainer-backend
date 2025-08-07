const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb+srv://touyen:touyen@danentang.ilfodv9.mongodb.net/etrainer?retryWrites=true&w=majority&serverSelectionTimeoutMS=30000&socketTimeoutMS=45000&connectTimeoutMS=30000&maxPoolSize=5&minPoolSize=1';

async function testMongoConnection() {
  console.log('🔍 Testing MongoDB connection from local machine...\n');
  
  try {
    console.log('🔌 Attempting to connect to MongoDB...');
    console.log('URI:', MONGODB_URI.replace(/\/\/[^:]+:[^@]+@/, '//***:***@'));
    
    await mongoose.connect(MONGODB_URI, {
      maxPoolSize: 5,
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 30000,
      bufferCommands: true,
      retryWrites: true,
    });
    
    console.log('✅ MongoDB connection successful!');
    console.log('📊 Connection details:');
    console.log('   - Ready State:', mongoose.connection.readyState);
    console.log('   - Host:', mongoose.connection.host);
    console.log('   - Database:', mongoose.connection.name);
    console.log('   - Collections:', Object.keys(mongoose.connection.collections).length);
    
    // Test a simple query
    console.log('\n🔍 Testing database query...');
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('✅ Found collections:', collections.map(c => c.name));
    
    // Try to find users collection
    if (collections.find(c => c.name === 'users')) {
      console.log('\n👥 Testing users collection...');
      const User = mongoose.model('User', new mongoose.Schema({}), 'users');
      const userCount = await User.countDocuments();
      console.log('✅ Users collection accessible, count:', userCount);
      
      // Try to find the admin user
      const adminUser = await User.findOne({ email: 'admin@gmail.com' });
      if (adminUser) {
        console.log('✅ Admin user found:', {
          id: adminUser._id,
          email: adminUser.email,
          role: adminUser.role
        });
      } else {
        console.log('⚠️ Admin user not found');
      }
    }
    
    console.log('\n🎉 Local test SUCCESSFUL! Database is accessible.');
    
  } catch (error) {
    console.error('❌ MongoDB connection failed:');
    console.error('Error type:', error.name);
    console.error('Error message:', error.message);
    
    if (error.message.includes('authentication failed')) {
      console.error('🔐 Issue: Invalid username/password');
    } else if (error.message.includes('connection refused')) {
      console.error('🌐 Issue: Network/firewall blocking connection');
    } else if (error.message.includes('timeout')) {
      console.error('⏰ Issue: Connection timeout');
    } else if (error.message.includes('not found')) {
      console.error('📍 Issue: Server/cluster not found');
    }
    
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log('\n🔒 Connection closed');
    }
  }
}

testMongoConnection();
