const mongoose = require('mongoose');

const uri = 'mongodb+srv://touyen:touyen@danentang.ilfodv9.mongodb.net/etrainer';

mongoose.connect(uri).then(async () => {
     console.log('Connected to MongoDB');

     const User = mongoose.model('users', new mongoose.Schema({}, { strict: false }));
     const UserJourney = mongoose.model('userJourneys', new mongoose.Schema({}, { strict: false }));

     // Check frontend user
     const frontendUser = await User.findById('6843e20d6091eee664c7b0b0');
     console.log(`\n=== FRONTEND USER ===`);
     console.log(`User ID: ${frontendUser._id}`);
     console.log(`Email: ${frontendUser.email}`);
     console.log(`Role: ${frontendUser.role}`);

     // Check active journey for frontend user
     const activeJourney = await UserJourney.findOne({
          user: frontendUser._id,
          state: { $in: ["NOT_STARTED", "IN_PROGRESS"] }
     });

     console.log(`\n=== FRONTEND USER ACTIVE JOURNEY ===`);
     if (activeJourney) {
          console.log(`Journey ID: ${activeJourney._id}`);
          console.log(`Stages: ${activeJourney.stages.length}`);
          console.log(`Current Stage Index: ${activeJourney.currentStageIndex}`);
          console.log(`State: ${activeJourney.state}`);

          activeJourney.stages.forEach((stage, i) => {
               console.log(`Stage ${i}: target=${stage.targetScore}, state=${stage.state}`);
          });
     } else {
          console.log('No active journey');

          // Check completed journeys
          const completedJourneys = await UserJourney.find({
               user: frontendUser._id,
               state: "COMPLETED"
          }).sort({ completedAt: -1 }).limit(3);

          console.log(`\n=== LATEST COMPLETED JOURNEYS ===`);
          completedJourneys.forEach((j, i) => {
               console.log(`Journey ${i + 1}: ${j._id}, stages=${j.stages.length}, completed=${j.completedAt}`);
          });
     }

     process.exit(0);
}).catch(err => {
     console.error('Connection error:', err);
     process.exit(1);
}); 