const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const MONGODB_URI = 'mongodb+srv://touyen:touyen@danentang.ilfodv9.mongodb.net/etrainer?retryWrites=true&w=majority&serverSelectionTimeoutMS=30000&socketTimeoutMS=45000&connectTimeoutMS=30000&maxPoolSize=5&minPoolSize=1';

// Define User schema to match the actual model
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  role: String,
  phone: String,
  avatarUrl: String,
  registrationMethod: String,
}, { timestamps: true });

async function testAdminUser() {
  console.log('🔍 Testing admin user authentication...\n');
  
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    const User = mongoose.model('User', userSchema, 'users');
    
    // Find admin user by ID
    const adminUser = await User.findById('68033a77d3a5025056165bea');
    console.log('👤 Admin user details:');
    console.log('   - ID:', adminUser?._id);
    console.log('   - Name:', adminUser?.name);
    console.log('   - Email:', adminUser?.email);
    console.log('   - Role:', adminUser?.role);
    console.log('   - Registration Method:', adminUser?.registrationMethod);
    console.log('   - Has Password:', !!adminUser?.password);
    
    if (adminUser?.email && adminUser?.password) {
      console.log('\n🔐 Testing password verification...');
      
      // Test with provided credentials
      const testPassword = 'admin@123';
      const isPasswordValid = await bcrypt.compare(testPassword, adminUser.password);
      
      console.log('✅ Password test result:', isPasswordValid ? 'VALID' : 'INVALID');
      
      if (isPasswordValid) {
        console.log('🎉 AUTHENTICATION WOULD SUCCEED!');
        console.log('   ✅ Email: admin@gmail.com');
        console.log('   ✅ Password: admin@123');
        console.log('   ✅ Role: ADMIN');
      } else {
        console.log('❌ Password does not match');
      }
    } else {
      console.log('⚠️ Missing email or password data');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔒 Connection closed');
  }
}

testAdminUser();
