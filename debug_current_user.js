const mongoose = require('mongoose');

const uri = 'mongodb+srv://touyen:touyen@danentang.ilfodv9.mongodb.net/etrainer';

mongoose.connect(uri).then(async () => {
     console.log('Connected to MongoDB');

     // Find current user (admin@gmail.com)
     const User = mongoose.model('users', new mongoose.Schema({}, { strict: false }));
     const user = await User.findOne({ email: 'admin@gmail.com' });

     console.log(`\n=== CURRENT USER ===`);
     console.log(`User ID: ${user._id}`);
     console.log(`Email: ${user.email}`);

     // Find all journeys for this user
     const UserJourney = mongoose.model('userJourneys', new mongoose.Schema({}, { strict: false }));
     const journeys = await UserJourney.find({ user: user._id }).sort({ createdAt: -1 });

     console.log(`\n=== USER JOURNEYS (${journeys.length} total) ===`);
     journeys.forEach((j, i) => {
          console.log(`Journey ${i + 1}: id=${j._id}, stages=${j.stages?.length}, state=${j.state}, created=${j.createdAt}`);
          if (j.stages) {
               j.stages.forEach((stage, si) => {
                    console.log(`  Stage ${si}: target=${stage.targetScore}, state=${stage.state}`);
               });
          }
     });

     // Find active journey
     const activeJourney = await UserJourney.findOne({
          user: user._id,
          state: { $in: ["NOT_STARTED", "IN_PROGRESS"] }
     });

     console.log(`\n=== ACTIVE JOURNEY ===`);
     if (activeJourney) {
          console.log(`Active Journey ID: ${activeJourney._id}`);
          console.log(`Stages: ${activeJourney.stages.length}`);
          console.log(`Current Stage Index: ${activeJourney.currentStageIndex}`);
          console.log(`State: ${activeJourney.state}`);

          activeJourney.stages.forEach((stage, i) => {
               console.log(`Stage ${i}: id=${stage.stageId}, target=${stage.targetScore}, state=${stage.state}`);
          });
     } else {
          console.log('No active journey found');
     }

     process.exit(0);
}).catch(err => {
     console.error('Connection error:', err);
     process.exit(1);
}); 