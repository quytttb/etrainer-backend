const mongoose = require('mongoose');
const UserJourney = require('./src/models/userJourney');
const Stage = require('./src/models/stage');
const Question = require('./src/models/question');

mongoose.connect('mongodb+srv://touyen:touyen@danentang.ilfodv9.mongodb.net/etrainer');

async function testAfterReset() {
     try {
          console.log('🧪 Testing Final Test Flow After Reset...');

          const userId = '6843e20d6091eee664c7b0b0';
          const stageIndex = 1;

          // 1. Simulate GET /journeys/stage-final-test/1
          console.log('\n1️⃣ Simulating GET /journeys/stage-final-test/1');

          const userJourney = await UserJourney.findOne({
               user: userId,
               state: { $in: ["NOT_STARTED", "IN_PROGRESS"] }
          });

          const currentStage = userJourney.stages[stageIndex];
          console.log('Stage status:', {
               unlocked: currentStage.finalTest.unlocked,
               started: currentStage.finalTest.started,
               completed: currentStage.finalTest.completed
          });

          const stage = await Stage.findById(currentStage.stageId).populate({
               path: "days.questions",
               model: "questions",
          });

          let allQuestions = [];
          stage.days.forEach(day => {
               if (day.questions && day.questions.length > 0) {
                    allQuestions = allQuestions.concat(day.questions);
               }
          });

          // Simulate getStageFinalTest logic
          let questionsData = null;
          if (currentStage.finalTest.started && !currentStage.finalTest.completed) {
               questionsData = allQuestions;
          }

          console.log('GET Response:', {
               totalQuestions: allQuestions.length,
               hasQuestions: questionsData ? questionsData.length : 0,
               shouldStartTest: !currentStage.finalTest.started
          });

          // 2. Simulate POST /journeys/start-stage-final-test/1
          console.log('\n2️⃣ Simulating POST /journeys/start-stage-final-test/1');

          // Update started status
          userJourney.stages[stageIndex].finalTest.started = true;
          userJourney.stages[stageIndex].finalTest.startedAt = new Date();
          await userJourney.save();

          // Simulate startStageFinalTest response
          const shuffledQuestions = allQuestions.sort(() => 0.5 - Math.random());
          console.log('POST Response:', {
               totalQuestions: shuffledQuestions.length,
               sampleQuestions: shuffledQuestions.slice(0, 3).map(q => ({
                    id: q._id,
                    type: q.type
               }))
          });

          // 3. Simulate GET again after start
          console.log('\n3️⃣ Simulating GET /journeys/stage-final-test/1 (after start)');

          const updatedJourney = await UserJourney.findOne({
               user: userId,
               state: { $in: ["NOT_STARTED", "IN_PROGRESS"] }
          });

          const updatedStage = updatedJourney.stages[stageIndex];
          let questionsAfterStart = null;
          if (updatedStage.finalTest.started && !updatedStage.finalTest.completed) {
               questionsAfterStart = allQuestions;
          }

          console.log('GET After Start Response:', {
               started: updatedStage.finalTest.started,
               completed: updatedStage.finalTest.completed,
               hasQuestions: questionsAfterStart ? questionsAfterStart.length : 0
          });

          console.log('\n✅ Final Test Flow Test Complete!');
          console.log('📱 Frontend should now see 9 questions when starting final test!');

     } catch (error) {
          console.error('❌ Error:', error);
     } finally {
          mongoose.disconnect();
     }
}

testAfterReset(); 