const mongoose = require('mongoose');
require('dotenv').config();

const Stage = require('./src/models/stage');
const Question = require('./src/models/question');
const UserJourney = require('./src/models/userJourney');

const LESSON_TYPE = require('./src/constants/lesson');

// TOEIC Journey Structure theo chuẩn quốc tế
const TOEIC_JOURNEY_STRUCTURE = {
     // Giai đoạn 1: Foundation Level (0-150 điểm) - Mất gốc
     stage1: {
          name: "Foundation - Mất gốc",
          minScore: 0,
          targetScore: 150,
          duration: 15, // 15 ngày
          description: "Xây dựng nền tảng từ vựng và ngữ pháp cơ bản",
          skillFocus: ["Từ vựng cơ bản", "Ngữ pháp căn bản", "Nghe hiểu đơn giản"],
          questionTypes: [
               LESSON_TYPE.IMAGE_DESCRIPTION,
               LESSON_TYPE.ASK_AND_ANSWER,
               LESSON_TYPE.FILL_IN_THE_BLANK_QUESTION
          ]
     },

     // Giai đoạn 2: Elementary Level (150-300 điểm) - Trung cấp
     stage2: {
          name: "Elementary - Trung cấp thấp",
          minScore: 150,
          targetScore: 300,
          duration: 20, // 20 ngày
          description: "Phát triển kỹ năng nghe và đọc cơ bản",
          skillFocus: ["Hội thoại đơn giản", "Đọc hiểu cơ bản", "Từ vựng workplace"],
          questionTypes: [
               LESSON_TYPE.CONVERSATION_PIECE,
               LESSON_TYPE.SHORT_TALK,
               LESSON_TYPE.FILL_IN_THE_PARAGRAPH,
               LESSON_TYPE.READ_AND_UNDERSTAND
          ]
     },

     // Giai đoạn 3: Pre-Intermediate Level (300-450 điểm) - Trung cấp
     stage3: {
          name: "Pre-Intermediate - Trung cấp",
          minScore: 300,
          targetScore: 450,
          duration: 25, // 25 ngày
          description: "Hoàn thiện kỹ năng trung cấp",
          skillFocus: ["Hội thoại phức tạp", "Đọc hiểu nâng cao", "Nghe talks dài"],
          questionTypes: [
               LESSON_TYPE.CONVERSATION_PIECE,
               LESSON_TYPE.SHORT_TALK,
               LESSON_TYPE.READ_AND_UNDERSTAND,
               LESSON_TYPE.FILL_IN_THE_PARAGRAPH
          ]
     },

     // Giai đoạn 4: Intermediate Level (450-600 điểm) - Khá
     stage4: {
          name: "Intermediate - Khá",
          minScore: 450,
          targetScore: 600,
          duration: 30, // 30 ngày
          description: "Thành thạo các kỹ năng trung cấp cao",
          skillFocus: ["Business conversations", "Reading comprehension", "Complex grammar"],
          questionTypes: [
               LESSON_TYPE.CONVERSATION_PIECE,
               LESSON_TYPE.SHORT_TALK,
               LESSON_TYPE.READ_AND_UNDERSTAND,
               LESSON_TYPE.FILL_IN_THE_PARAGRAPH,
               LESSON_TYPE.FILL_IN_THE_BLANK_QUESTION
          ]
     },

     // Giai đoạn 5: Upper-Intermediate Level (600-750 điểm) - Giỏi
     stage5: {
          name: "Upper-Intermediate - Giỏi",
          minScore: 600,
          targetScore: 750,
          duration: 35, // 35 ngày
          description: "Phát triển kỹ năng cao cấp",
          skillFocus: ["Advanced listening", "Complex reading", "Professional vocabulary"],
          questionTypes: [
               LESSON_TYPE.SHORT_TALK,
               LESSON_TYPE.READ_AND_UNDERSTAND,
               LESSON_TYPE.CONVERSATION_PIECE,
               LESSON_TYPE.FILL_IN_THE_PARAGRAPH
          ]
     },

     // Giai đoạn 6: Advanced Level (750-900 điểm) - Xuất sắc
     stage6: {
          name: "Advanced - Xuất sắc",
          minScore: 750,
          targetScore: 900,
          duration: 40, // 40 ngày
          description: "Hoàn thiện kỹ năng gần như native",
          skillFocus: ["Native-level listening", "Academic reading", "Professional communication"],
          questionTypes: [
               LESSON_TYPE.SHORT_TALK,
               LESSON_TYPE.READ_AND_UNDERSTAND,
               LESSON_TYPE.CONVERSATION_PIECE,
               LESSON_TYPE.FILL_IN_THE_PARAGRAPH,
               LESSON_TYPE.ASK_AND_ANSWER
          ]
     },

     // Giai đoạn 7: Mastery Level (900+ điểm) - Thành thạo
     stage7: {
          name: "Mastery - Thành thạo",
          minScore: 900,
          targetScore: 990,
          duration: 30, // 30 ngày
          description: "Đạt trình độ thành thạo tối đa",
          skillFocus: ["Perfect comprehension", "Native fluency", "All question types"],
          questionTypes: Object.values(LESSON_TYPE).filter(type => type !== LESSON_TYPE.STAGE_FINAL_TEST)
     }
};

async function connectToDatabase() {
     try {
          await mongoose.connect(process.env.MONGODB_URI);
          console.log('✅ Connected to MongoDB');
     } catch (error) {
          console.error('❌ MongoDB connection error:', error);
          process.exit(1);
     }
}

async function cleanupExistingData() {
     console.log('\n🧹 Cleaning up existing data...');

     try {
          // Xóa tất cả UserJourneys
          await UserJourney.deleteMany({});
          console.log('✅ Deleted all UserJourneys');

          // Xóa tất cả Stages
          await Stage.deleteMany({});
          console.log('✅ Deleted all Stages');

          console.log('✅ Cleanup completed successfully');
     } catch (error) {
          console.error('❌ Error during cleanup:', error);
          throw error;
     }
}

async function getQuestionsForStage(stageInfo) {
     console.log(`\n📋 Getting questions for stage: ${stageInfo.name}`);

     try {
          // Lấy câu hỏi theo loại phù hợp với stage
          const questions = await Question.find({
               type: { $in: stageInfo.questionTypes }
          }).select('_id type');

          console.log(`📊 Found ${questions.length} questions for ${stageInfo.name}`);
          console.log(`📝 Question types: ${stageInfo.questionTypes.join(', ')}`);

          if (questions.length === 0) {
               console.log('⚠️ No questions found for this stage, will create sample data');
               return [];
          }

          return questions;
     } catch (error) {
          console.error('❌ Error getting questions:', error);
          return [];
     }
}

function distributeQuestionsAcrossDays(questions, totalDays) {
     console.log(`📅 Distributing ${questions.length} questions across ${totalDays} days`);

     if (questions.length === 0) {
          // Tạo structure với ít nhất 1 câu hỏi mỗi ngày (sẽ cần tạo sample data)
          return Array.from({ length: totalDays }, (_, index) => ({
               dayNumber: index + 1,
               questions: [], // Empty for now, will be filled with sample data
               exam: null
          }));
     }

     const questionsPerDay = Math.max(1, Math.floor(questions.length / totalDays));
     const extraQuestions = questions.length % totalDays;

     const days = [];
     let questionIndex = 0;

     for (let day = 1; day <= totalDays; day++) {
          const questionsForThisDay = questionsPerDay + (day <= extraQuestions ? 1 : 0);
          const dayQuestions = questions.slice(questionIndex, questionIndex + questionsForThisDay);

          days.push({
               dayNumber: day,
               questions: dayQuestions.map(q => q._id),
               exam: null
          });

          questionIndex += questionsForThisDay;
     }

     console.log(`✅ Created ${days.length} days with questions distributed`);
     return days;
}

async function createNewStages() {
     console.log('\n🏗️ Creating new TOEIC stages...');

     const createdStages = [];

     for (const [key, stageInfo] of Object.entries(TOEIC_JOURNEY_STRUCTURE)) {
          console.log(`\n🎯 Creating ${stageInfo.name}...`);

          try {
               // Lấy questions phù hợp với stage này
               const questions = await getQuestionsForStage(stageInfo);

               // Phân chia questions theo ngày
               const days = distributeQuestionsAcrossDays(questions, stageInfo.duration);

               // Tạo stage mới
               const newStage = new Stage({
                    minScore: stageInfo.minScore,
                    targetScore: stageInfo.targetScore,
                    days: days
               });

               const savedStage = await newStage.save();
               createdStages.push({
                    stageId: savedStage._id,
                    info: stageInfo,
                    questionsCount: questions.length
               });

               console.log(`✅ Created stage: ${stageInfo.name}`);
               console.log(`   📊 Target: ${stageInfo.minScore}-${stageInfo.targetScore} points`);
               console.log(`   📅 Duration: ${stageInfo.duration} days`);
               console.log(`   📝 Questions: ${questions.length}`);

          } catch (error) {
               console.error(`❌ Error creating stage ${stageInfo.name}:`, error);
               throw error;
          }
     }

     return createdStages;
}

async function generateAnalysisReport(createdStages) {
     console.log('\n📊 Generating analysis report...');

     const totalQuestions = await Question.countDocuments();
     const questionsByType = await Question.aggregate([
          { $group: { _id: '$type', count: { $sum: 1 } } },
          { $sort: { count: -1 } }
     ]);

     console.log('\n📋 === TOEIC JOURNEY REBUILD REPORT ===');
     console.log(`📅 Date: ${new Date().toLocaleString('vi-VN')}`);
     console.log(`🎯 Total Stages Created: ${createdStages.length}`);
     console.log(`📝 Total Questions Available: ${totalQuestions}`);

     console.log('\n🏆 Stages Overview:');
     createdStages.forEach((stage, index) => {
          console.log(`${index + 1}. ${stage.info.name}`);
          console.log(`   📊 Score Range: ${stage.info.minScore}-${stage.info.targetScore}`);
          console.log(`   📅 Duration: ${stage.info.duration} days`);
          console.log(`   📝 Questions: ${stage.questionsCount}`);
          console.log(`   🎯 Focus: ${stage.info.skillFocus.join(', ')}`);
     });

     console.log('\n📊 Questions by Type:');
     questionsByType.forEach(item => {
          console.log(`   ${item._id}: ${item.count} questions`);
     });

     console.log('\n💡 Recommendations:');
     const lowQuestionStages = createdStages.filter(stage => stage.questionsCount < 10);
     if (lowQuestionStages.length > 0) {
          console.log('⚠️ Stages with low question count (need more content):');
          lowQuestionStages.forEach(stage => {
               console.log(`   - ${stage.info.name}: ${stage.questionsCount} questions`);
          });
     }

     const questionTypes = Object.values(LESSON_TYPE).filter(type => type !== LESSON_TYPE.STAGE_FINAL_TEST);
     const missingTypes = questionTypes.filter(type =>
          !questionsByType.find(item => item._id === type)
     );

     if (missingTypes.length > 0) {
          console.log('\n⚠️ Missing Question Types:');
          missingTypes.forEach(type => {
               console.log(`   - ${type}`);
          });
     }

     return {
          totalStages: createdStages.length,
          totalQuestions,
          questionsByType,
          lowQuestionStages,
          missingTypes
     };
}

async function validateStagesData() {
     console.log('\n🔍 Validating created stages...');

     try {
          const stages = await Stage.find({}).populate('days.questions', 'type');

          console.log(`✅ Found ${stages.length} stages in database`);

          for (let i = 0; i < stages.length; i++) {
               const stage = stages[i];
               console.log(`\n📋 Stage ${i + 1}:`);
               console.log(`   📊 Score Range: ${stage.minScore}-${stage.targetScore}`);
               console.log(`   📅 Days: ${stage.days.length}`);

               let totalQuestions = 0;
               stage.days.forEach(day => {
                    totalQuestions += day.questions.length;
               });

               console.log(`   📝 Total Questions: ${totalQuestions}`);

               if (totalQuestions === 0) {
                    console.log('   ⚠️ WARNING: Stage has no questions assigned');
               }
          }

          return stages;
     } catch (error) {
          console.error('❌ Error validating stages:', error);
          throw error;
     }
}

async function main() {
     console.log('🚀 Starting TOEIC Journey Rebuild Process...');
     console.log('📋 This script will:');
     console.log('   1. Clean up existing journey data');
     console.log('   2. Create new TOEIC stages based on international standards');
     console.log('   3. Distribute questions across stages and days');
     console.log('   4. Generate analysis report');

     try {
          // Kết nối database
          await connectToDatabase();

          // Xóa dữ liệu cũ
          await cleanupExistingData();

          // Tạo stages mới
          const createdStages = await createNewStages();

          // Validate dữ liệu
          await validateStagesData();

          // Tạo báo cáo
          const report = await generateAnalysisReport(createdStages);

          console.log('\n🎉 TOEIC Journey rebuild completed successfully!');
          console.log('\n📝 Next Steps:');
          console.log('   1. Review the generated stages');
          console.log('   2. Add more questions if needed');
          console.log('   3. Test the journey system');
          console.log('   4. Update frontend to use new stages');

     } catch (error) {
          console.error('\n❌ Error during rebuild process:', error);
     } finally {
          await mongoose.connection.close();
          console.log('\n🔚 Database connection closed');
     }
}

// Run the script
if (require.main === module) {
     main();
}

module.exports = {
     TOEIC_JOURNEY_STRUCTURE,
     connectToDatabase,
     cleanupExistingData,
     createNewStages,
     validateStagesData
}; 