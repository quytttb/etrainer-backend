const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;

async function fixFavoriteQuestionsTypes() {
     try {
          // Connect to MongoDB
          await mongoose.connect(MONGODB_URI, {
               useNewUrlParser: true,
               useUnifiedTopology: true,
          });

          console.log('✅ Connected to MongoDB');

          const db = mongoose.connection.db;
          const collection = db.collection('favorite_questions');

          // Check current data
          const totalCount = await collection.countDocuments();
          console.log(`📊 Total FavoriteQuestions: ${totalCount}`);

          if (totalCount === 0) {
               console.log('🎯 No FavoriteQuestions to migrate');
               return;
          }

          // Find documents with String type userIds
          const stringUserIds = await collection.find({
               userId: { $type: "string" }
          }).toArray();

          console.log(`🔍 Found ${stringUserIds.length} documents with String userId`);

          if (stringUserIds.length > 0) {
               console.log('🔧 Processing String userIds...');
               let converted = 0;
               let deleted = 0;

               for (const doc of stringUserIds) {
                    try {
                         // Try to convert to ObjectId
                         const objectId = new mongoose.Types.ObjectId(doc.userId);
                         await collection.updateOne(
                              { _id: doc._id },
                              { $set: { userId: objectId } }
                         );
                         converted++;
                    } catch (error) {
                         // If can't convert, delete the invalid document
                         console.warn(`⚠️ Cannot convert userId ${doc.userId}, deleting document`);
                         await collection.deleteOne({ _id: doc._id });
                         deleted++;
                    }
               }

               console.log(`✅ Converted ${converted} userIds, deleted ${deleted} invalid documents`);
          }

          // Find documents with String type questionIds
          const stringQuestionIds = await collection.find({
               questionId: { $type: "string" }
          }).toArray();

          console.log(`🔍 Found ${stringQuestionIds.length} documents with String questionId`);

          if (stringQuestionIds.length > 0) {
               console.log('🔧 Processing String questionIds...');
               let converted = 0;
               let deleted = 0;

               for (const doc of stringQuestionIds) {
                    try {
                         // Try to convert to ObjectId
                         const objectId = new mongoose.Types.ObjectId(doc.questionId);
                         await collection.updateOne(
                              { _id: doc._id },
                              { $set: { questionId: objectId } }
                         );
                         converted++;
                    } catch (error) {
                         // If can't convert, delete the invalid document
                         console.warn(`⚠️ Cannot convert questionId ${doc.questionId}, deleting document`);
                         await collection.deleteOne({ _id: doc._id });
                         deleted++;
                    }
               }

               console.log(`✅ Converted ${converted} questionIds, deleted ${deleted} invalid documents`);
          }

          // Verify the fix
          const remainingStringUserIds = await collection.countDocuments({
               userId: { $type: "string" }
          });
          const remainingStringQuestionIds = await collection.countDocuments({
               questionId: { $type: "string" }
          });

          console.log(`🎯 Migration Results:`);
          console.log(`   - Remaining String userIds: ${remainingStringUserIds}`);
          console.log(`   - Remaining String questionIds: ${remainingStringQuestionIds}`);

          if (remainingStringUserIds === 0 && remainingStringQuestionIds === 0) {
               console.log('🎉 ✅ All FavoriteQuestions type inconsistencies fixed!');
          } else {
               console.log('⚠️ Some type inconsistencies remain - check invalid ObjectId strings');
          }

     } catch (error) {
          console.error('❌ Migration failed:', error);
          throw error;
     } finally {
          await mongoose.disconnect();
          console.log('📤 Disconnected from MongoDB');
     }
}

// Run migration
if (require.main === module) {
     fixFavoriteQuestionsTypes()
          .then(() => {
               console.log('🏁 Migration completed successfully');
               process.exit(0);
          })
          .catch((error) => {
               console.error('💥 Migration failed:', error);
               process.exit(1);
          });
}

module.exports = { fixFavoriteQuestionsTypes }; 