const UserJourney = require("../models/userJourney");

const MigrationController = {
     // API endpoint để chạy migration finalTest
     migrateFinalTest: async (req, res) => {
          try {
               console.log('Bắt đầu migration finalTest...');

               // Sử dụng MongoDB aggregation để update tất cả stages
               const result = await UserJourney.updateMany(
                    {}, // Tất cả documents
                    [
                         {
                              $set: {
                                   stages: {
                                        $map: {
                                             input: "$stages",
                                             as: "stage",
                                             in: {
                                                  $mergeObjects: [
                                                       "$$stage",
                                                       {
                                                            finalTest: {
                                                                 $cond: {
                                                                      if: { $ifNull: ["$$stage.finalTest", false] },
                                                                      then: "$$stage.finalTest",
                                                                      else: {
                                                                           unlocked: {
                                                                                $cond: {
                                                                                     if: { $eq: ["$$stage.state", "COMPLETED"] },
                                                                                     then: true,
                                                                                     else: {
                                                                                          $allElementsTrue: {
                                                                                               $map: {
                                                                                                    input: "$$stage.days",
                                                                                                    as: "day",
                                                                                                    in: "$$day.completed"
                                                                                               }
                                                                                          }
                                                                                     }
                                                                                }
                                                                           },
                                                                           started: false,
                                                                           completed: {
                                                                                $cond: {
                                                                                     if: { $eq: ["$$stage.state", "COMPLETED"] },
                                                                                     then: true,
                                                                                     else: false
                                                                                }
                                                                           },
                                                                           startedAt: null,
                                                                           completedAt: null,
                                                                           score: {
                                                                                $cond: {
                                                                                     if: { $eq: ["$$stage.state", "COMPLETED"] },
                                                                                     then: 100,
                                                                                     else: null
                                                                                }
                                                                           },
                                                                           passed: {
                                                                                $cond: {
                                                                                     if: { $eq: ["$$stage.state", "COMPLETED"] },
                                                                                     then: true,
                                                                                     else: false
                                                                                }
                                                                           }
                                                                      }
                                                                 }
                                                            }
                                                       }
                                                  ]
                                             }
                                        }
                                   }
                              }
                         }
                    ]
               );

               console.log('Hoàn thành migration finalTest!');
               console.log('Modified documents:', result.modifiedCount);

               return res.status(200).json({
                    success: true,
                    message: 'Migration finalTest hoàn thành thành công',
                    modified: result.modifiedCount,
                    matched: result.matchedCount,
               });
          } catch (error) {
               console.error('Lỗi khi migration:', error);
               return res.status(500).json({
                    success: false,
                    message: 'Lỗi khi migration',
                    error: error.message,
               });
          }
     },

     // Kiểm tra trạng thái migration
     checkMigrationStatus: async (req, res) => {
          try {
               const total = await UserJourney.countDocuments({});

               // Kiểm tra số lượng stages có finalTest
               const journeysWithoutFinalTest = await UserJourney.countDocuments({
                    'stages': {
                         $elemMatch: {
                              'finalTest': { $exists: false }
                         }
                    }
               });

               const migrationComplete = journeysWithoutFinalTest === 0;

               return res.status(200).json({
                    totalJourneys: total,
                    journeysWithoutFinalTest,
                    migrationComplete,
                    migrationNeeded: !migrationComplete,
                    message: migrationComplete ?
                         'Migration đã hoàn thành - tất cả stages đều có finalTest' :
                         `Còn ${journeysWithoutFinalTest} journeys cần migration`
               });
          } catch (error) {
               console.error('Lỗi khi kiểm tra migration status:', error);
               return res.status(500).json({
                    success: false,
                    message: 'Lỗi khi kiểm tra migration status',
                    error: error.message,
               });
          }
     },
};

module.exports = MigrationController; 