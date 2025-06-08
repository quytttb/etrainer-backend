const mongoose = require('mongoose');
const UserJourney = require('../models/userJourney');

/**
 * Migration script để thêm trường finalTest vào các user journey hiện có
 */
async function migrateFinalTest() {
     try {
          console.log('Bắt đầu migration finalTest...');

          // Tìm tất cả user journey chưa có trường finalTest
          const userJourneys = await UserJourney.find({
               'stages.finalTest': { $exists: false }
          });

          console.log(`Tìm thấy ${userJourneys.length} user journey cần migration`);

          for (let journey of userJourneys) {
               // Thêm finalTest vào mỗi stage
               journey.stages = journey.stages.map(stage => {
                    if (!stage.finalTest) {
                         stage.finalTest = {
                              unlocked: false,
                              started: false,
                              completed: false,
                              startedAt: null,
                              completedAt: null,
                              score: null,
                              passed: false,
                         };

                         // Nếu stage đã completed, mark finalTest as passed để không block progression
                         if (stage.state === 'COMPLETED') {
                              stage.finalTest.unlocked = true;
                              stage.finalTest.completed = true;
                              stage.finalTest.passed = true;
                              stage.finalTest.score = 100; // Assume passed with good score
                         }
                         // Nếu tất cả ngày đã hoàn thành nhưng stage chưa completed, unlock finalTest
                         else if (stage.days.every(day => day.completed)) {
                              stage.finalTest.unlocked = true;
                         }
                    }
                    return stage;
               });

               await journey.save();
               console.log(`✓ Đã migration user journey ${journey._id}`);
          }

          console.log('Hoàn thành migration finalTest!');
     } catch (error) {
          console.error('Lỗi khi migration:', error);
     }
}

// Chạy migration nếu file được gọi trực tiếp
if (require.main === module) {
     // Cần connect database trước
     migrateFinalTest().then(() => {
          console.log('Migration hoàn tất');
          process.exit(0);
     }).catch(error => {
          console.error('Migration thất bại:', error);
          process.exit(1);
     });
}

module.exports = migrateFinalTest; 