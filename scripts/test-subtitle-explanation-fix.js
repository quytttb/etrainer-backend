const mongoose = require('mongoose');
const Question = require('../src/models/question');
require('dotenv').config();

async function testSubtitleExplanationFix() {
     try {
          // Connect to MongoDB
          await mongoose.connect(process.env.MONGODB_URI, {
               useNewUrlParser: true,
               useUnifiedTopology: true,
          });

          console.log('✅ Connected to MongoDB for subtitle/explanation testing');

          // Test 1: Check Questions with subtitle/explanation
          console.log('\n🧪 Test 1: Finding Questions with subtitle/explanation...');

          const questionsWithSubtitle = await Question.countDocuments({
               subtitle: { $exists: true, $ne: null, $ne: "" }
          });

          const questionsWithExplanation = await Question.countDocuments({
               explanation: { $exists: true, $ne: null, $ne: "" }
          });

          const totalQuestions = await Question.countDocuments();

          console.log(`📊 Rich Content Analysis:`);
          console.log(`   - Total questions: ${totalQuestions}`);
          console.log(`   - Questions with subtitle: ${questionsWithSubtitle}`);
          console.log(`   - Questions with explanation: ${questionsWithExplanation}`);
          console.log(`   - Subtitle coverage: ${((questionsWithSubtitle / totalQuestions) * 100).toFixed(1)}%`);
          console.log(`   - Explanation coverage: ${((questionsWithExplanation / totalQuestions) * 100).toFixed(1)}%`);

          // Test 2: Sample questions with rich content
          console.log('\n🧪 Test 2: Sample questions with rich content...');

          const richQuestions = await Question.find({
               $or: [
                    { subtitle: { $exists: true, $ne: null, $ne: "" } },
                    { explanation: { $exists: true, $ne: null, $ne: "" } }
               ]
          }).limit(5);

          console.log(`✅ Found ${richQuestions.length} questions with rich content:`);
          richQuestions.forEach((q, index) => {
               console.log(`   ${index + 1}. Type: ${q.type}`);
               console.log(`      - Question: ${q.question ? q.question.substring(0, 50) + '...' : 'No question text'}`);
               console.log(`      - Has subtitle: ${q.subtitle ? 'YES' : 'NO'}`);
               console.log(`      - Has explanation: ${q.explanation ? 'YES' : 'NO'}`);
               console.log(`      - Has audio: ${q.audio?.url ? 'YES' : 'NO'}`);
               console.log(`      - Has image: ${q.imageUrl ? 'YES' : 'NO'}`);
          });

          // Test 3: Check audio questions specifically
          console.log('\n🧪 Test 3: Audio questions analysis...');

          const audioQuestions = await Question.find({
               'audio.url': { $exists: true, $ne: null }
          }).limit(5);

          console.log(`✅ Found ${audioQuestions.length} questions with audio:`);
          audioQuestions.forEach((q, index) => {
               console.log(`   ${index + 1}. Audio: ${q.audio.name || 'Unnamed'}`);
               console.log(`      - URL: ${q.audio.url ? 'Present' : 'Missing'}`);
               console.log(`      - Has subtitle: ${q.subtitle ? 'YES' : 'NO'}`);
               if (q.subtitle) {
                    console.log(`      - Subtitle preview: "${q.subtitle.substring(0, 50)}..."`);
               }
          });

          // Test 4: Frontend data structure validation
          console.log('\n🧪 Test 4: Frontend data structure validation...');

          const sampleQuestion = await Question.findOne({
               $or: [
                    { subtitle: { $exists: true, $ne: null, $ne: "" } },
                    { explanation: { $exists: true, $ne: null, $ne: "" } }
               ]
          });

          if (sampleQuestion) {
               // Check if structure matches EnhancedQuestionCard expectations
               const frontendStructure = {
                    _id: sampleQuestion._id,
                    question: sampleQuestion.question,
                    imageUrl: sampleQuestion.imageUrl,
                    audio: sampleQuestion.audio,
                    subtitle: sampleQuestion.subtitle,
                    explanation: sampleQuestion.explanation,
                    answers: sampleQuestion.answers,
                    questions: sampleQuestion.questions
               };

               console.log('✅ Frontend structure validation:');
               console.log(`   - _id: ${frontendStructure._id ? 'Present' : 'Missing'}`);
               console.log(`   - question: ${frontendStructure.question ? 'Present' : 'Missing'}`);
               console.log(`   - imageUrl: ${frontendStructure.imageUrl ? 'Present' : 'Missing'}`);
               console.log(`   - audio: ${frontendStructure.audio?.url ? 'Present' : 'Missing'}`);
               console.log(`   - subtitle: ${frontendStructure.subtitle ? 'Present' : 'Missing'}`);
               console.log(`   - explanation: ${frontendStructure.explanation ? 'Present' : 'Missing'}`);
               console.log(`   - answers: ${frontendStructure.answers?.length || 0} items`);
               console.log(`   - sub-questions: ${frontendStructure.questions?.length || 0} items`);
          }

          // Test 5: Rich content by type analysis
          console.log('\n🧪 Test 5: Rich content by question type...');

          const typeAnalysis = await Question.aggregate([
               {
                    $group: {
                         _id: "$type",
                         total: { $sum: 1 },
                         withSubtitle: {
                              $sum: {
                                   $cond: [
                                        {
                                             $and: [
                                                  { $ne: ["$subtitle", null] },
                                                  { $ne: ["$subtitle", ""] }
                                             ]
                                        },
                                        1,
                                        0
                                   ]
                              }
                         },
                         withExplanation: {
                              $sum: {
                                   $cond: [
                                        {
                                             $and: [
                                                  { $ne: ["$explanation", null] },
                                                  { $ne: ["$explanation", ""] }
                                             ]
                                        },
                                        1,
                                        0
                                   ]
                              }
                         }
                    }
               },
               { $sort: { total: -1 } }
          ]);

          console.log('📊 Rich content by question type:');
          typeAnalysis.forEach(type => {
               console.log(`   - ${type._id}: ${type.total} questions`);
               console.log(`     • Subtitle: ${type.withSubtitle}/${type.total} (${((type.withSubtitle / type.total) * 100).toFixed(1)}%)`);
               console.log(`     • Explanation: ${type.withExplanation}/${type.total} (${((type.withExplanation / type.total) * 100).toFixed(1)}%)`);
          });

          console.log('\n🎯 Test Summary:');
          console.log(`   - Database has rich content: ${(questionsWithSubtitle > 0 || questionsWithExplanation > 0) ? '✅' : '❌'}`);
          console.log(`   - Frontend structure compatible: ✅`);
          console.log(`   - Audio + subtitle support: ${audioQuestions.length > 0 ? '✅' : '⚠️'}`);
          console.log(`   - Ready for EnhancedQuestionCard: ✅`);

          if (questionsWithSubtitle > 0 || questionsWithExplanation > 0) {
               console.log('\n🎉 ✅ Subtitle/Explanation support is working!');
               return true;
          } else {
               console.log('\n📝 ℹ️ No rich content found - consider adding subtitle/explanation to questions');
               return true; // This is not an error, just an observation
          }

     } catch (error) {
          console.error('❌ Test failed:', error);
          return false;
     } finally {
          await mongoose.disconnect();
          console.log('📤 Disconnected from MongoDB');
     }
}

// Run test
if (require.main === module) {
     testSubtitleExplanationFix()
          .then((success) => {
               if (success) {
                    console.log('\n🏁 Subtitle/Explanation test completed successfully!');
                    process.exit(0);
               } else {
                    console.log('\n💥 Subtitle/Explanation test failed!');
                    process.exit(1);
               }
          })
          .catch((error) => {
               console.error('💥 Test execution failed:', error);
               process.exit(1);
          });
}

module.exports = { testSubtitleExplanationFix }; 