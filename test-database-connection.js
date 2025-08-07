const mongoose = require('mongoose');

async function testDatabaseConnection() {
    try {
        console.log('Testing database connection...');
        
        // Test if we can connect to MongoDB
        if (!process.env.MONGODB_URI) {
            throw new Error('MONGODB_URI not found');
        }
        
        console.log('MongoDB URI found, attempting connection...');
        
        await mongoose.connect(process.env.MONGODB_URI, {
            maxPoolSize: 3,
            serverSelectionTimeoutMS: 10000,
            socketTimeoutMS: 30000,
            connectTimeoutMS: 10000,
            bufferCommands: true,
            retryWrites: true,
        });
        
        console.log('✅ Connected to MongoDB');
        
        // Test if we can query the users collection
        const User = mongoose.model('User', new mongoose.Schema({
            email: String,
            password: String,
            role: String
        }));
        
        console.log('Testing users collection...');
        const userCount = await User.countDocuments();
        console.log(`✅ Found ${userCount} users in database`);
        
        // Test specific admin user
        const adminUser = await User.findOne({ email: 'admin@gmail.com' });
        if (adminUser) {
            console.log('✅ Admin user found:', {
                id: adminUser._id,
                email: adminUser.email,
                role: adminUser.role
            });
        } else {
            console.log('❌ Admin user not found');
        }
        
        await mongoose.disconnect();
        console.log('✅ Test completed successfully');
        
    } catch (error) {
        console.error('❌ Database test failed:', error.message);
        process.exit(1);
    }
}

// Load environment variables
require('dotenv').config();

testDatabaseConnection();
