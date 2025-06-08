const mongoose = require('mongoose');

const uri = 'mongodb+srv://touyen:touyen@danentang.ilfodv9.mongodb.net/etrainer';

mongoose.connect(uri).then(async () => {
     console.log('Connected to MongoDB');

     // Check all user journeys
     const UserJourney = mongoose.model('userJourneys', new mongoose.Schema({}, { strict: false }));
     const journeys = await UserJourney.find({}, { user: 1, stages: 1, state: 1 }).limit(10);

     console.log('\n=== USER JOURNEYS DEBUG ===');
     journeys.forEach((j, i) => {
          console.log(`Journey ${i + 1}: user=${j.user}, stages=${j.stages?.length || 0}, state=${j.state}`);
     });

     // Check stages count distribution  
     const stageCounts = await UserJourney.aggregate([
          { $project: { stageCount: { $size: '$stages' } } },
          { $group: { _id: '$stageCount', count: { $sum: 1 } } },
          { $sort: { _id: 1 } }
     ]);

     console.log('\n=== STAGE COUNT DISTRIBUTION ===');
     stageCounts.forEach(s => console.log(`${s._id} stages: ${s.count} journeys`));

     // Check stage templates
     const Stage = mongoose.model('stages', new mongoose.Schema({}, { strict: false }));
     const stages = await Stage.find({}, { targetScore: 1, minScore: 1 });

     console.log('\n=== STAGE TEMPLATES ===');
     stages.forEach((s, i) => {
          console.log(`Stage ${i + 1}: id=${s._id}, target=${s.targetScore}, min=${s.minScore}`);
     });

     process.exit(0);
}).catch(err => {
     console.error('Connection error:', err);
     process.exit(1);
}); 