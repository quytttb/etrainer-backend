const { MongoClient } = require('mongodb');

// Source (current problematic cluster)
const SOURCE_URI = 'mongodb+srv://touyen:touyen@danentang.ilfodv9.mongodb.net/etrainer?retryWrites=true&w=majority';

// Destination (your new cluster) - URL encoded password
const DEST_URI = 'mongodb+srv://etrainer_user:user%401234@cluster0.lo5cyua.mongodb.net/etrainer?retryWrites=true&w=majority&appName=Cluster0';

async function migrateData() {
     let sourceClient, destClient;

     try {
          // Connect to source database
          console.log('🔌 Connecting to source database...');
          sourceClient = new MongoClient(SOURCE_URI);
          await sourceClient.connect();
          console.log('✅ Connected to source database');

          // Connect to destination database  
          console.log('🔌 Connecting to destination database...');
          destClient = new MongoClient(DEST_URI);
          await destClient.connect();
          console.log('✅ Connected to destination database');

          // Get databases
          const sourceDb = sourceClient.db('etrainer');
          const destDb = destClient.db('etrainer');

          // Get list of collections from source
          const collections = await sourceDb.listCollections().toArray();
          console.log(`\n📋 Found ${collections.length} collections to migrate:`);
          collections.forEach(col => console.log(`   - ${col.name}`));

          // Migrate each collection
          for (const collection of collections) {
               const collectionName = collection.name;
               console.log(`\n📦 Migrating collection: ${collectionName}`);

               // Get source collection
               const sourceCollection = sourceDb.collection(collectionName);
               const destCollection = destDb.collection(collectionName);

               // Count documents
               const docCount = await sourceCollection.countDocuments();
               console.log(`   📊 Documents to migrate: ${docCount}`);

               if (docCount > 0) {
                    // Get all documents
                    const documents = await sourceCollection.find({}).toArray();

                    // Insert into destination (batch insert)
                    await destCollection.insertMany(documents, { ordered: false });
                    console.log(`   ✅ Migrated ${documents.length} documents`);

                    // Verify count
                    const newCount = await destCollection.countDocuments();
                    console.log(`   ✅ Verified: ${newCount} documents in destination`);
               } else {
                    console.log(`   ⚠️ No documents to migrate`);
               }
          }

          console.log('\n🎉 Migration completed successfully!');

          // Verify admin user in new database
          console.log('\n👤 Verifying admin user in new database...');
          const usersCollection = destDb.collection('users');
          const adminUser = await usersCollection.findOne({ email: 'admin@gmail.com' });

          if (adminUser) {
               console.log('✅ Admin user found in new database:');
               console.log(`   - ID: ${adminUser._id}`);
               console.log(`   - Email: ${adminUser.email}`);
               console.log(`   - Role: ${adminUser.role}`);
          } else {
               console.log('❌ Admin user not found in new database');
          }

     } catch (error) {
          console.error('❌ Migration failed:', error.message);
          throw error;
     } finally {
          if (sourceClient) {
               await sourceClient.close();
               console.log('\n🔒 Source connection closed');
          }
          if (destClient) {
               await destClient.close();
               console.log('🔒 Destination connection closed');
          }
     }
}

migrateData().catch(console.error);
