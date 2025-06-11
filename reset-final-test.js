const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
async function connectDB() {
     try {
          await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/etrainer');
          console.log('✅ Connected to MongoDB');
     } catch (error) {
          console.error('❌ MongoDB connection error:', error);
          process.exit(1);
     }
}

// Import models
const UserJourney = require('./src/models/userJourney');

async function resetStageFinalTest(userId, stageIndex = 0) {
     try {
          console.log(`🔄 Resetting final test for user: ${userId}, stage: ${stageIndex}`);

          // Find user journey
          const userJourney = await UserJourney.findOne({
               user: userId,
               state: { $in: ["NOT_STARTED", "IN_PROGRESS", "COMPLETED"] }
          });

          if (!userJourney) {
               console.log('❌ No user journey found');
               return;
          }

          console.log(`📋 Found journey: ${userJourney._id}`);
          console.log(`📊 Current stages: ${userJourney.stages.length}`);

          if (stageIndex >= userJourney.stages.length) {
               console.log(`❌ Stage index ${stageIndex} is out of range`);
               return;
          }

          const stage = userJourney.stages[stageIndex];
          console.log(`🎯 Current final test status:`, {
               unlocked: stage.finalTest.unlocked,
               started: stage.finalTest.started,
               completed: stage.finalTest.completed,
               passed: stage.finalTest.passed,
               score: stage.finalTest.score
          });

          // Reset final test
          stage.finalTest.started = false;
          stage.finalTest.completed = false;
          stage.finalTest.passed = false;
          stage.finalTest.startedAt = null;
          stage.finalTest.completedAt = null;
          stage.finalTest.score = null;

          // Save changes
          await userJourney.save();

          console.log(`✅ Final test reset successfully!`);
          console.log(`🎯 New final test status:`, {
               unlocked: stage.finalTest.unlocked,
               started: stage.finalTest.started,
               completed: stage.finalTest.completed,
               passed: stage.finalTest.passed,
               score: stage.finalTest.score
          });

     } catch (error) {
          console.error('❌ Error resetting final test:', error);
     }
}

async function main() {
     await connectDB();

     // Get user ID from command line or use default
     const userId = process.argv[2] || '6843e20d6091eee664c7b0b0'; // User ID từ log
     const stageIndex = parseInt(process.argv[3]) || 0; // Stage index (default: 0)

     console.log(`🎯 Target: User ${userId}, Stage ${stageIndex}`);

     await resetStageFinalTest(userId, stageIndex);

     console.log('🏁 Reset completed!');
     process.exit(0);
}

// Run if called directly
if (require.main === module) {
     main().catch(console.error);
}

module.exports = { resetStageFinalTest }; 