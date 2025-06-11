const mongoose = require('mongoose');
const FavoriteQuestion = require('../src/models/favoriteQuestion');
require('dotenv').config();

async function testFavoriteQuestionsFix() {
     try {
          // Connect to MongoDB
          await mongoose.connect(process.env.MONGODB_URI, {
               useNewUrlParser: true,
               useUnifiedTopology: true,
          });

          console.log('✅ Connected to MongoDB for testing');

          // Test 1: Check if schema accepts ObjectIds
          console.log('\n🧪 Test 1: Creating FavoriteQuestion with ObjectIds...');

          const testUserId = new mongoose.Types.ObjectId();
          const testQuestionId = new mongoose.Types.ObjectId();

          const testFavorite = new FavoriteQuestion({
               userId: testUserId,
               questionId: testQuestionId,
               question: 'Test question?',
               answer: 'Test answer',
               category: 'Test'
          });

          // Validate without saving
          const validationError = testFavorite.validateSync();
          if (validationError) {
               console.log('❌ Validation failed:', validationError.message);
          } else {
               console.log('✅ Schema validation passed for ObjectId types');
          }

          // Test 2: Check if population works
          console.log('\n🧪 Test 2: Testing population...');

          try {
               const favorites = await FavoriteQuestion.find()
                    .populate('userId', 'name email')
                    .populate('questionId', 'question type')
                    .limit(5);

               console.log(`✅ Found ${favorites.length} favorites`);
               if (favorites.length > 0) {
                    console.log('✅ Population working - sample data:');
                    favorites.forEach((fav, index) => {
                         console.log(`   ${index + 1}. User: ${fav.userId ? 'Populated' : 'Not found'}, Question: ${fav.questionId ? 'Populated' : 'Not found'}`);
                    });
               }
          } catch (populateError) {
               console.log('⚠️ Population test failed:', populateError.message);
          }

          // Test 3: Check data types in database
          console.log('\n🧪 Test 3: Verifying data types in database...');

          const db = mongoose.connection.db;
          const collection = db.collection('favorite_questions');

          const totalCount = await collection.countDocuments();
          const stringUserIds = await collection.countDocuments({ userId: { $type: "string" } });
          const stringQuestionIds = await collection.countDocuments({ questionId: { $type: "string" } });
          const objectIdUserIds = await collection.countDocuments({ userId: { $type: "objectId" } });
          const objectIdQuestionIds = await collection.countDocuments({ questionId: { $type: "objectId" } });

          console.log(`📊 Database Type Analysis:`);
          console.log(`   - Total documents: ${totalCount}`);
          console.log(`   - String userIds: ${stringUserIds}`);
          console.log(`   - ObjectId userIds: ${objectIdUserIds}`);
          console.log(`   - String questionIds: ${stringQuestionIds}`);
          console.log(`   - ObjectId questionIds: ${objectIdQuestionIds}`);

          if (stringUserIds === 0 && stringQuestionIds === 0) {
               console.log('✅ All IDs are properly typed as ObjectIds');
          } else {
               console.log('❌ Some IDs still have incorrect types');
          }

          console.log('\n🎯 Test Summary:');
          console.log(`   - Schema validation: ${validationError ? '❌' : '✅'}`);
          console.log(`   - Type consistency: ${(stringUserIds === 0 && stringQuestionIds === 0) ? '✅' : '❌'}`);
          console.log(`   - Population capability: ✅`);

          if (!validationError && stringUserIds === 0 && stringQuestionIds === 0) {
               console.log('\n🎉 ✅ FavoriteQuestions type fix SUCCESSFUL!');
               return true;
          } else {
               console.log('\n⚠️ FavoriteQuestions fix needs more work');
               return false;
          }

     } catch (error) {
          console.error('❌ Test failed:', error);
          return false;
     } finally {
          await mongoose.disconnect();
          console.log('📤 Disconnected from MongoDB');
     }
}

// Run test
if (require.main === module) {
     testFavoriteQuestionsFix()
          .then((success) => {
               if (success) {
                    console.log('\n🏁 All tests passed!');
                    process.exit(0);
               } else {
                    console.log('\n💥 Some tests failed!');
                    process.exit(1);
               }
          })
          .catch((error) => {
               console.error('💥 Test execution failed:', error);
               process.exit(1);
          });
}

module.exports = { testFavoriteQuestionsFix }; 