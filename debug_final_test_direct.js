const mongoose = require('mongoose');

// Import models
const Stage = require('./src/models/stage');
const Question = require('./src/models/question');
const UserJourney = require('./src/models/userJourney');

mongoose.connect('mongodb+srv://touyen:touyen@danentang.ilfodv9.mongodb.net/etrainer');

async function testFinalTestLogic() {
     try {
          console.log('🧪 Testing Final Test Logic Directly...');

          // Get frontend user journey
          const userId = '6843e20d6091eee664c7b0b0'; // user@gmail.com
          const userJourney = await UserJourney.findOne({
               user: userId,
               state: { $in: ["NOT_STARTED", "IN_PROGRESS"] }
          });

          if (!userJourney) {
               console.log('❌ No active journey found');
               return;
          }

          console.log('📋 User Journey:', {
               currentStageIndex: userJourney.currentStageIndex,
               totalStages: userJourney.stages.length,
               stageIds: userJourney.stages.map(s => s.stageId)
          });

          // Test Stage 1 (index 1)
          const stageIndex = 1;
          const currentStage = userJourney.stages[stageIndex];

          console.log('🎯 Testing Stage:', {
               stageIndex,
               stageId: currentStage.stageId,
               state: currentStage.state,
               finalTestStatus: currentStage.finalTest
          });

          // Load stage with questions (mimic backend logic)
          console.log(`🔍 Loading stage: ${currentStage.stageId}`);
          const stage = await Stage.findById(currentStage.stageId).populate({
               path: "days.questions",
               model: "questions",
          });

          console.log(`📋 Stage loaded:`, {
               stageId: stage._id,
               targetScore: stage.targetScore,
               totalDays: stage.days.length,
               daysData: stage.days.map(day => ({
                    dayNumber: day.dayNumber,
                    questionsCount: day.questions?.length || 0,
                    questionIds: day.questions?.map(q => q._id) || []
               }))
          });

          // Collect all questions (mimic backend logic)
          let allQuestions = [];
          stage.days.forEach(day => {
               if (day.questions && day.questions.length > 0) {
                    console.log(`📅 Day ${day.dayNumber}: adding ${day.questions.length} questions`);
                    allQuestions = allQuestions.concat(day.questions);
               } else {
                    console.log(`📅 Day ${day.dayNumber}: no questions found`);
               }
          });

          console.log(`🎯 Total questions collected: ${allQuestions.length}`);

          if (allQuestions.length === 0) {
               console.error(`❌ No questions found for stage ${currentStage.stageId}`);
          } else {
               console.log('✅ Final test should work! Sample questions:',
                    allQuestions.slice(0, 3).map(q => ({
                         id: q._id,
                         type: q.type,
                         question: q.question?.slice(0, 50) + '...'
                    }))
               );
          }

     } catch (error) {
          console.error('❌ Error:', error);
     } finally {
          mongoose.disconnect();
     }
}

testFinalTestLogic(); 