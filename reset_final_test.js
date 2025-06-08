const mongoose = require('mongoose');
const UserJourney = require('./src/models/userJourney');

mongoose.connect('mongodb+srv://touyen:touyen@danentang.ilfodv9.mongodb.net/etrainer');

async function resetFinalTest() {
     try {
          console.log('🔄 Resetting Stage 1 Final Test for user@gmail.com...');

          const userId = '6843e20d6091eee664c7b0b0'; // user@gmail.com
          const stageIndex = 1; // Stage 1 (index 1)

          const userJourney = await UserJourney.findOne({
               user: userId,
               state: { $in: ["NOT_STARTED", "IN_PROGRESS"] }
          });

          if (!userJourney) {
               console.log('❌ No active journey found');
               return;
          }

          console.log('📋 Before Reset:', {
               currentStageIndex: userJourney.currentStageIndex,
               stage1: userJourney.stages[stageIndex].finalTest
          });

          // Reset final test status
          userJourney.stages[stageIndex].finalTest = {
               unlocked: true,
               started: false,    // Reset to false
               completed: false,  // Reset to false
               startedAt: null,
               completedAt: null,
               score: null,
               passed: false
          };

          await userJourney.save();

          console.log('✅ Reset Complete:', {
               stage1: userJourney.stages[stageIndex].finalTest
          });

          console.log('\n🎯 Now you can test final test again on Stage 1!');

     } catch (error) {
          console.error('❌ Error:', error);
     } finally {
          mongoose.disconnect();
     }
}

resetFinalTest(); 