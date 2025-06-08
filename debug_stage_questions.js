const mongoose = require('mongoose');

mongoose.connect('mongodb+srv://touyen:touyen@danentang.ilfodv9.mongodb.net/etrainer');

// Use proper models
const Stage = require('./src/models/stage');
const Question = require('./src/models/question');

async function checkStageQuestions() {
     try {
          console.log('🔍 Checking Stage 2 questions...');

          // Stage 2 của user frontend: 682b6b6e4d4d085071e1226e
          const stage = await Stage.findById('682b6b6e4d4d085071e1226e');

          if (!stage) {
               console.log('❌ Stage not found!');
               return;
          }

          console.log('📋 Stage Info:', {
               _id: stage._id,
               targetScore: stage.targetScore,
               minScore: stage.minScore,
               totalDays: stage.days.length
          });

          // Check days structure without populate first
          console.log('📅 Days structure (unpopulated):');
          stage.days.forEach((day, index) => {
               console.log(`Day ${day.dayNumber}:`, {
                    questionsCount: day.questions?.length || 0,
                    questionIds: day.questions || []
               });
          });

          // Now try populate with proper models registered
          console.log('\n🔍 Trying to populate questions...');
          const populatedStage = await Stage.findById('682b6b6e4d4d085071e1226e').populate({
               path: 'days.questions',
               model: 'questions'
          });

          let totalQuestions = 0;
          populatedStage.days.forEach((day, index) => {
               const questionCount = day.questions?.length || 0;
               console.log(`📅 Day ${day.dayNumber} (populated):`, {
                    questionsCount: questionCount,
                    questionSample: questionCount > 0 ? {
                         id: day.questions[0]._id,
                         type: day.questions[0].type
                    } : 'No questions'
               });
               totalQuestions += questionCount;
          });

          console.log(`🎯 Total questions in stage: ${totalQuestions}`);

          if (totalQuestions === 0) {
               console.log('❌ NO QUESTIONS FOUND! This explains why final test is empty.');
          } else {
               console.log('✅ Questions found! Final test should work.');

               // Test the exact logic from startStageFinalTest
               console.log('\n🔧 Testing startStageFinalTest logic...');
               let allQuestions = [];
               populatedStage.days.forEach(day => {
                    if (day.questions && day.questions.length > 0) {
                         allQuestions = allQuestions.concat(day.questions);
                    }
               });

               console.log(`📤 allQuestions collected: ${allQuestions.length}`);
               console.log(`📤 Sample question:`, {
                    id: allQuestions[0]?._id,
                    type: allQuestions[0]?.type,
                    content: allQuestions[0]?.question?.slice(0, 100) + '...'
               });
          }

     } catch (error) {
          console.error('❌ Error:', error);
     } finally {
          mongoose.disconnect();
     }
}

checkStageQuestions(); 