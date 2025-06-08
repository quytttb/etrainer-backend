const mongoose = require('mongoose');
require('dotenv').config();

const UserJourney = require('./src/models/userJourney');

const resetStage2Test = async () => {
     try {
          await mongoose.connect(process.env.MONGODB_URI);
          console.log('✅ Connected to MongoDB');

          // Journey ID từ log
          const journeyId = '6845b447e868eb34cff7237b';

          const userJourney = await UserJourney.findById(journeyId);

          if (!userJourney) {
               console.log('❌ Journey not found');
               return;
          }

          if (!userJourney.stages[1]) {
               console.log('❌ Stage 2 not found');
               return;
          }

          console.log('🔍 Current Stage 2 status:', {
               started: userJourney.stages[1].finalTest.started,
               completed: userJourney.stages[1].finalTest.completed,
               passed: userJourney.stages[1].finalTest.passed,
               score: userJourney.stages[1].finalTest.score
          });

          // Reset Stage 2 final test
          userJourney.stages[1].finalTest.started = false;
          userJourney.stages[1].finalTest.completed = false;
          userJourney.stages[1].finalTest.passed = false;
          userJourney.stages[1].finalTest.score = 0;
          userJourney.stages[1].finalTest.startedAt = null;
          userJourney.stages[1].finalTest.completedAt = null;

          await userJourney.save();

          console.log('✅ Stage 2 final test reset successfully');
          console.log('🔍 New Stage 2 status:', {
               started: userJourney.stages[1].finalTest.started,
               completed: userJourney.stages[1].finalTest.completed,
               passed: userJourney.stages[1].finalTest.passed,
               score: userJourney.stages[1].finalTest.score
          });

     } catch (error) {
          console.error('❌ Error:', error);
     } finally {
          mongoose.connection.close();
          console.log('🔚 Database connection closed');
     }
};

resetStage2Test(); 