const { MongoClient } = require('mongodb');

// URI cluster mới 
const NEW_URI = 'mongodb+srv://etrainer_user:user%401234@cluster0.lo5cyua.mongodb.net/etrainer?retryWrites=true&w=majority&serverSelectionTimeoutMS=30000&socketTimeoutMS=45000&connectTimeoutMS=30000&maxPoolSize=5&minPoolSize=1&appName=Cluster0';

async function testNewCluster() {
  let client;
  
  try {
    console.log('🔌 Testing connection to new cluster...');
    client = new MongoClient(NEW_URI);
    await client.connect();
    console.log('✅ Connected to new cluster successfully');
    
    // Test database access
    const db = client.db('etrainer');
    console.log('📊 Testing database access...');
    
    // Test admin user
    const usersCollection = db.collection('users');
    const adminUser = await usersCollection.findOne({ email: 'admin@gmail.com' });
    
    if (adminUser) {
      console.log('✅ Admin user found:');
      console.log(`   - ID: ${adminUser._id}`);
      console.log(`   - Email: ${adminUser.email}`);
      console.log(`   - Role: ${adminUser.role}`);
      console.log(`   - Password hash: ${adminUser.password ? 'EXISTS' : 'MISSING'}`);
    } else {
      console.log('❌ Admin user not found');
    }
    
    // Count collections
    const collections = await db.listCollections().toArray();
    console.log(`📋 Found ${collections.length} collections in database`);
    
    // Count total documents
    let totalDocs = 0;
    for (const collection of collections) {
      const count = await db.collection(collection.name).countDocuments();
      console.log(`   - ${collection.name}: ${count} documents`);
      totalDocs += count;
    }
    console.log(`📊 Total documents: ${totalDocs}`);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    if (client) {
      await client.close();
      console.log('🔒 Connection closed');
    }
  }
}

testNewCluster();
