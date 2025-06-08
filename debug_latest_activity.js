const mongoose = require('mongoose');

const uri = 'mongodb+srv://touyen:touyen@danentang.ilfodv9.mongodb.net/etrainer';

mongoose.connect(uri).then(async () => {
     console.log('Connected to MongoDB');

     const User = mongoose.model('users', new mongoose.Schema({}, { strict: false }));
     const UserJourney = mongoose.model('userJourneys', new mongoose.Schema({}, { strict: false }));

     // Check all users to see if there's confusion
     const users = await User.find({ email: { $regex: /admin/i } }, { email: 1 });
     console.log(`\n=== ADMIN USERS ===`);
     users.forEach(u => console.log(`${u._id}: ${u.email}`));

     // Check journeys created in last 24 hours
     const yesterday = new Date();
     yesterday.setDate(yesterday.getDate() - 1);

     const recentJourneys = await UserJourney.find({
          createdAt: { $gte: yesterday }
     }).sort({ createdAt: -1 });

     console.log(`\n=== RECENT JOURNEYS (last 24h) ===`);
     recentJourneys.forEach(j => {
          console.log(`Journey: ${j._id}, user: ${j.user}, stages: ${j.stages?.length}, state: ${j.state}, created: ${j.createdAt}`);
     });

     // Check journeys with 3 stages specifically
     const threeStageJourneys = await UserJourney.find({
          'stages.2': { $exists: true }, // Has 3rd stage (index 2)
          'stages.3': { $exists: false } // But no 4th stage
     }).sort({ createdAt: -1 }).limit(5);

     console.log(`\n=== 3-STAGE JOURNEYS ===`);
     threeStageJourneys.forEach(j => {
          console.log(`Journey: ${j._id}, user: ${j.user}, state: ${j.state}, created: ${j.createdAt}`);
          j.stages.forEach((s, i) => {
               console.log(`  Stage ${i}: target=${s.targetScore}, state=${s.state}`);
          });
     });

     // Check specific journey ID from frontend log
     const specificJourney = await UserJourney.findById('684560ff7bb933a1ad4c5e56');
     if (specificJourney) {
          console.log(`\n=== SPECIFIC JOURNEY (from frontend log) ===`);
          console.log(`Journey: ${specificJourney._id}, user: ${specificJourney.user}, stages: ${specificJourney.stages?.length}, state: ${specificJourney.state}`);
     } else {
          console.log(`\n=== SPECIFIC JOURNEY NOT FOUND ===`);
     }

     process.exit(0);
}).catch(err => {
     console.error('Connection error:', err);
     process.exit(1);
}); 