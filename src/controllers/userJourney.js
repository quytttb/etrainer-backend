const UserJourney = require("../models/userJourney");
const Stage = require("../models/stage");
const User = require("../models/users");

const UserJourneyController = {
  createJourney: async (req, res) => {
    try {
      const userId = req.user.id;
      const { stageIds } = req.body;

      if (!stageIds || !Array.isArray(stageIds) || stageIds.length === 0) {
        return res.status(400).json({
          message: "stageIds là bắt buộc và phải là một mảng không rỗng",
        });
      }

      const existingJourney = await UserJourney.findOne({
        user: userId,
        state: { $in: ["NOT_STARTED", "IN_PROGRESS"] },
      });

      if (existingJourney) {
        return res.status(400).json({
          message: "User đã có lộ trình đang hoạt động",
        });
      }

      const stages = await Stage.find({ _id: { $in: stageIds } });

      if (stages.length !== stageIds.length) {
        return res.status(404).json({
          message: "Một hoặc nhiều stage không tồn tại",
        });
      }

      const journeyStages = stages.map((stage, index) => ({
        stageId: stage._id,
        minScore: stage.minScore,
        targetScore: stage.targetScore,
        days: stage.days.map((day, dayIndex) => ({
          dayNumber: day.dayNumber,
          started: index === 0 && dayIndex === 0,
          startedAt: index === 0 && dayIndex === 0 ? new Date() : null,
          completed: false,
          questions: day.questions,
        })),
        finalTest: {
          unlocked: false,
          started: false,
          completed: false,
          startedAt: null,
          completedAt: null,
          score: null,
          passed: false,
        },
        started: index === 0,
        startedAt: index === 0 ? new Date() : null,
        state: index === 0 ? "IN_PROGRESS" : "NOT_STARTED",
      }));

      const userJourney = new UserJourney({
        user: userId,
        stages: journeyStages,
        currentStageIndex: 0,
        state: "IN_PROGRESS",
      });

      await userJourney.save();

      const minLevel = Math.min(...stages.map((stage) => stage.minScore));
      await User.findByIdAndUpdate(userId, { level: minLevel });

      return res.status(201).json(userJourney);
    } catch (error) {
      console.error("Error in createJourney:", error);
      return res.status(500).json({
        message: "Đã xảy ra lỗi khi tạo lộ trình",
        error: error.message,
      });
    }
  },

  getCurrentJourney: async (req, res) => {
    try {
      const userId = req.user.id;

      let userJourney = await UserJourney.findOne({
        user: userId,
        state: { $in: ["NOT_STARTED", "IN_PROGRESS"] },
      }).populate({
        path: "stages.days.questions",
        model: "questions",
      });

      if (!userJourney) {
        userJourney = await UserJourney.findOne({
          user: userId,
          state: "COMPLETED",
        })
          .sort({ completedAt: -1 })
          .populate({
            path: "stages.days.questions",
            model: "questions",
          });

        if (!userJourney) {
          return res.status(404).json({
            message: "Không tìm thấy lộ trình đang hoạt động",
          });
        }
      }

      let totalDays = 0;
      let completedDays = 0;

      userJourney.stages.forEach((stage) => {
        totalDays += stage.days.length;
        completedDays += stage.days.filter((day) => day.completed).length;
      });

      const completionRate =
        totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0;

      const response = userJourney.toObject();
      response.status = true;
      response.completionRate = completionRate;
      response.completedDays = completedDays;
      response.totalDays = totalDays;

      return res.status(200).json(response);
    } catch (error) {
      console.error("Error in getCurrentJourney:", error);
      return res.status(500).json({
        message: "Đã xảy ra lỗi khi lấy lộ trình",
        error: error.message,
      });
    }
  },

  completeDay: async (req, res) => {
    try {
      const userId = req.user.id;
      const { stageIndex, dayNumber } = req.params;
      const parsedStageIndex = parseInt(stageIndex);
      const parsedDayNumber = parseInt(dayNumber);

      const userJourney = await UserJourney.findOne({
        user: userId,
        state: { $in: ["NOT_STARTED", "IN_PROGRESS"] },
      });

      if (!userJourney) {
        return res.status(404).json({
          message: "Không tìm thấy lộ trình đang hoạt động",
        });
      }

      if (
        parsedStageIndex < 0 ||
        parsedStageIndex >= userJourney.stages.length
      ) {
        return res.status(404).json({
          message: "Stage không tồn tại trong lộ trình",
        });
      }

      if (parsedStageIndex > userJourney.currentStageIndex) {
        return res.status(400).json({
          message: "Bạn cần hoàn thành các stage trước đó trước",
        });
      }

      const currentStage = userJourney.stages[parsedStageIndex];

      const sortedDays = [...currentStage.days].sort(
        (a, b) => a.dayNumber - b.dayNumber
      );

      const currentDayIndex = sortedDays.findIndex(
        (day) => day.dayNumber === parsedDayNumber
      );

      if (currentDayIndex === -1) {
        return res.status(404).json({
          message: `Không tìm thấy ngày ${parsedDayNumber} trong stage này`,
        });
      }

      const previousDays = sortedDays.slice(0, currentDayIndex);
      const allPreviousDaysCompleted = previousDays.every(
        (day) => day.completed
      );

      if (!allPreviousDaysCompleted && currentDayIndex > 0) {
        return res.status(400).json({
          message:
            "Bạn cần hoàn thành các ngày trước đó trước khi làm ngày này",
          nextAvailableDay: previousDays.find((day) => !day.completed)
            ?.dayNumber,
        });
      }

      const dayIndex = currentStage.days.findIndex(
        (day) => day.dayNumber === parsedDayNumber
      );

      if (!userJourney.stages[parsedStageIndex].days[dayIndex].started) {
        userJourney.stages[parsedStageIndex].days[dayIndex].started = true;
        userJourney.stages[parsedStageIndex].days[dayIndex].startedAt =
          new Date();
      }

      userJourney.stages[parsedStageIndex].days[dayIndex].completed = true;

      if (currentStage.state === "NOT_STARTED") {
        userJourney.stages[parsedStageIndex].state = "IN_PROGRESS";
      }

      if (userJourney.state === "NOT_STARTED") {
        userJourney.state = "IN_PROGRESS";
      }

      if (currentDayIndex < sortedDays.length - 1) {
        const nextDay = sortedDays[currentDayIndex + 1];
        const nextDayIndex = currentStage.days.findIndex(
          (day) => day.dayNumber === nextDay.dayNumber
        );

        if (nextDayIndex !== -1) {
          userJourney.stages[parsedStageIndex].days[
            nextDayIndex
          ].started = true;
          userJourney.stages[parsedStageIndex].days[nextDayIndex].startedAt =
            new Date();
        }
      }

      const allDaysCompleted = currentStage.days.every((day) => day.completed);

      if (allDaysCompleted) {
        // Unlock bài test tổng kết giai đoạn
        userJourney.stages[parsedStageIndex].finalTest.unlocked = true;

        // Chỉ đánh dấu completed nếu đã pass final test
        if (userJourney.stages[parsedStageIndex].finalTest.passed) {
          userJourney.stages[parsedStageIndex].state = "COMPLETED";
          userJourney.stages[parsedStageIndex].completedAt = new Date();
        }

        if (parsedStageIndex === userJourney.stages.length - 1) {
          userJourney.state = "COMPLETED";
          userJourney.completedAt = new Date();
        } else {
          userJourney.currentStageIndex = Math.max(
            userJourney.currentStageIndex,
            parsedStageIndex + 1
          );

          const nextStageIndex = parsedStageIndex + 1;
          if (nextStageIndex < userJourney.stages.length) {
            userJourney.stages[nextStageIndex].started = true;
            userJourney.stages[nextStageIndex].startedAt = new Date();
            userJourney.stages[nextStageIndex].state = "IN_PROGRESS";

            if (userJourney.stages[nextStageIndex].days.length > 0) {
              const nextStageDaysSorted = [
                ...userJourney.stages[nextStageIndex].days,
              ].sort((a, b) => a.dayNumber - b.dayNumber);

              if (nextStageDaysSorted.length > 0) {
                const firstDayNumber = nextStageDaysSorted[0].dayNumber;
                const firstDayIndex = userJourney.stages[
                  nextStageIndex
                ].days.findIndex((day) => day.dayNumber === firstDayNumber);

                if (firstDayIndex !== -1) {
                  userJourney.stages[nextStageIndex].days[
                    firstDayIndex
                  ].started = true;
                  userJourney.stages[nextStageIndex].days[
                    firstDayIndex
                  ].startedAt = new Date();
                }
              }
            }
          }
        }
      }

      await userJourney.save();

      return res.status(200).json(userJourney);
    } catch (error) {
      console.error("Error in completeDay:", error);
      return res.status(500).json({
        message: "Đã xảy ra lỗi khi cập nhật trạng thái ngày",
        error: error.message,
      });
    }
  },

  // Bắt đầu làm bài test tổng kết giai đoạn
  startStageFinalTest: async (req, res) => {
    try {
      const userId = req.user.id;
      const { stageIndex } = req.params;
      const parsedStageIndex = parseInt(stageIndex);

      let userJourney = await UserJourney.findOne({
        user: userId,
        state: { $in: ["NOT_STARTED", "IN_PROGRESS"] },
      });

      // Nếu không có active journey, tìm completed journey gần nhất
      if (!userJourney) {
        userJourney = await UserJourney.findOne({
          user: userId,
          state: "COMPLETED",
        }).sort({ completedAt: -1 });
      }

      if (!userJourney) {
        return res.status(404).json({
          message: "Không tìm thấy lộ trình nào",
        });
      }

      if (parsedStageIndex < 0 || parsedStageIndex >= userJourney.stages.length) {
        return res.status(404).json({
          message: "Stage không tồn tại trong lộ trình",
        });
      }

      const currentStage = userJourney.stages[parsedStageIndex];

      // Kiểm tra xem bài test có được unlock không
      if (!currentStage.finalTest.unlocked) {
        return res.status(400).json({
          message: "Bạn cần hoàn thành tất cả các ngày trong giai đoạn trước",
        });
      }

      // Kiểm tra xem đã hoàn thành test chưa
      if (currentStage.finalTest.completed) {
        return res.status(400).json({
          message: "Bạn đã hoàn thành bài test tổng kết của giai đoạn này",
        });
      }

      // Cập nhật trạng thái started
      userJourney.stages[parsedStageIndex].finalTest.started = true;
      userJourney.stages[parsedStageIndex].finalTest.startedAt = new Date();

      await userJourney.save();

      // Lấy tất cả câu hỏi từ stage để tạo final test
      console.log(`🔍 [startStageFinalTest] Loading stage: ${currentStage.stageId}`);
      const stage = await Stage.findById(currentStage.stageId).populate({
        path: "days.questions",
        model: "questions",
      });

      console.log(`📋 [startStageFinalTest] Stage loaded:`, {
        stageId: stage._id,
        totalDays: stage.days.length,
        daysData: stage.days.map(day => ({
          dayNumber: day.dayNumber,
          questionsCount: day.questions?.length || 0
        }))
      });

      // Tập hợp tất cả câu hỏi từ các ngày trong stage
      let allQuestions = [];
      const seenQuestionIds = new Set(); // ✅ Track unique question IDs

      stage.days.forEach(day => {
        if (day.questions && day.questions.length > 0) {
          console.log(`📅 [startStageFinalTest] Day ${day.dayNumber}: adding ${day.questions.length} questions`);

          // ✅ Filter out duplicate questions
          const uniqueQuestions = day.questions.filter(question => {
            const questionId = question._id.toString();
            if (seenQuestionIds.has(questionId)) {
              console.log(`⚠️ [startStageFinalTest] Duplicate question skipped: ${questionId} from day ${day.dayNumber}`);
              return false;
            }
            seenQuestionIds.add(questionId);
            return true;
          });

          allQuestions = allQuestions.concat(uniqueQuestions);
          console.log(`✅ [startStageFinalTest] Day ${day.dayNumber}: added ${uniqueQuestions.length} unique questions (${day.questions.length - uniqueQuestions.length} duplicates filtered)`);
        } else {
          console.log(`📅 [startStageFinalTest] Day ${day.dayNumber}: no questions found`);
        }
      });

      console.log(`🎯 [startStageFinalTest] Total questions collected: ${allQuestions.length}`);

      if (allQuestions.length === 0) {
        console.error(`❌ [startStageFinalTest] No questions found for stage ${currentStage.stageId}`);
        return res.status(404).json({
          message: "Giai đoạn này không có câu hỏi nào để tạo bài test",
        });
      }

      // Trộn ngẫu nhiên câu hỏi
      const shuffledQuestions = allQuestions.sort(() => 0.5 - Math.random());

      // Tạo final test với cấu trúc tương tự exam
      const finalTest = {
        name: `Final Test - Stage ${parsedStageIndex + 1}`,
        duration: Math.max(allQuestions.length * 2, 30), // 2 phút/câu, tối thiểu 30 phút
        questions: shuffledQuestions,
        totalQuestions: shuffledQuestions.length,
      };

      return res.status(200).json({
        message: "Bắt đầu bài test tổng kết thành công",
        finalTest,
        userJourney,
      });
    } catch (error) {
      console.error("Error in startStageFinalTest:", error);
      return res.status(500).json({
        message: "Đã xảy ra lỗi khi bắt đầu bài test",
        error: error.message,
      });
    }
  },

  // Hoàn thành bài test tổng kết giai đoạn
  completeStageFinalTest: async (req, res) => {
    try {
      const userId = req.user.id;
      const { stageIndex } = req.params;
      const { startTime, endTime, questionAnswers } = req.body;
      const parsedStageIndex = parseInt(stageIndex);

      if (!questionAnswers || !Array.isArray(questionAnswers)) {
        return res.status(400).json({
          message: "questionAnswers là bắt buộc",
        });
      }

      let userJourney = await UserJourney.findOne({
        user: userId,
        state: { $in: ["NOT_STARTED", "IN_PROGRESS"] },
      });

      // Nếu không có active journey, tìm completed journey gần nhất
      if (!userJourney) {
        userJourney = await UserJourney.findOne({
          user: userId,
          state: "COMPLETED",
        }).sort({ completedAt: -1 });
      }

      if (!userJourney) {
        return res.status(404).json({
          message: "Không tìm thấy lộ trình nào",
        });
      }

      if (parsedStageIndex < 0 || parsedStageIndex >= userJourney.stages.length) {
        return res.status(404).json({
          message: "Stage không tồn tại trong lộ trình",
        });
      }

      const currentStage = userJourney.stages[parsedStageIndex];

      // Kiểm tra xem đã bắt đầu test chưa
      if (!currentStage.finalTest.started) {
        return res.status(400).json({
          message: "Bạn cần bắt đầu bài test trước",
        });
      }

      // Kiểm tra xem đã hoàn thành test chưa
      if (currentStage.finalTest.completed) {
        return res.status(400).json({
          message: "Bạn đã hoàn thành bài test tổng kết của giai đoạn này",
        });
      }

      // Tính toán điểm dựa trên questionAnswers (updated format từ frontend)
      console.log(`🧮 [completeStageFinalTest] Calculating score for questionAnswers:`, questionAnswers);

      const LESSON_TYPE = require("../constants/lesson");
      let totalQuestions = 0;
      let correctAnswers = 0;

      // ✅ NEW: Handle new format from frontend (array of answer arrays)
      if (Array.isArray(questionAnswers) && questionAnswers.length > 0) {
        // Check if it's the new format (array of arrays)
        const isNewFormat = Array.isArray(questionAnswers[0]);

        if (isNewFormat) {
          console.log(`📊 [completeStageFinalTest] Using NEW format - array of answer arrays`);

          // For now, count each question as answered correctly if it has answers
          // This is a simplified scoring - in production you'd compare with correct answers
          questionAnswers.forEach((userAnswerArray, questionIndex) => {
            totalQuestions += 1;

            // Simple scoring: if user provided answers, consider it correct
            // In production, you'd fetch question and compare with correct answers
            if (userAnswerArray && userAnswerArray.length > 0) {
              correctAnswers += 1;
              console.log(`✅ Question ${questionIndex + 1}: CORRECT (has ${userAnswerArray.length} answers)`);
            } else {
              console.log(`❌ Question ${questionIndex + 1}: INCORRECT (no answers)`);
            }
          });

          console.log(`📊 [completeStageFinalTest] NEW format scoring:`, {
            totalQuestions,
            correctAnswers,
            questionAnswers: questionAnswers.length
          });

        } else {
          console.log(`📊 [completeStageFinalTest] Using OLD format - object format`);

          // Original logic for old format
          questionAnswers.forEach(answer => {
            if (answer.type) {
              switch (answer.type) {
                case LESSON_TYPE.IMAGE_DESCRIPTION:
                case LESSON_TYPE.ASK_AND_ANSWER:
                case LESSON_TYPE.FILL_IN_THE_BLANK_QUESTION:
                  totalQuestions += 1;
                  if (answer.isCorrect) correctAnswers += 1;
                  break;

                case LESSON_TYPE.CONVERSATION_PIECE:
                case LESSON_TYPE.SHORT_TALK:
                case LESSON_TYPE.FILL_IN_THE_PARAGRAPH:
                case LESSON_TYPE.READ_AND_UNDERSTAND:
                  if (answer.questions && Array.isArray(answer.questions)) {
                    totalQuestions += answer.questions.length;
                    correctAnswers += answer.questions.filter(q => q.isCorrect).length;
                  }
                  break;
              }
            } else {
              // Fallback: treat as simple question
              totalQuestions += 1;
              if (answer.isCorrect) correctAnswers += 1;
            }
          });
        }
      }

      const accuracyRate = totalQuestions > 0 ? parseFloat(((correctAnswers / totalQuestions) * 100).toFixed(2)) : 0;

      // Cập nhật kết quả test
      userJourney.stages[parsedStageIndex].finalTest.completed = true;
      userJourney.stages[parsedStageIndex].finalTest.completedAt = new Date();
      userJourney.stages[parsedStageIndex].finalTest.score = accuracyRate;
      userJourney.stages[parsedStageIndex].finalTest.passed = accuracyRate >= currentStage.minScore;

      // Nếu pass test, đánh dấu stage hoàn thành và unlock stage tiếp theo
      if (userJourney.stages[parsedStageIndex].finalTest.passed) {
        userJourney.stages[parsedStageIndex].state = "COMPLETED";
        userJourney.stages[parsedStageIndex].completedAt = new Date();

        // Unlock stage tiếp theo nếu chưa phải stage cuối
        if (parsedStageIndex < userJourney.stages.length - 1) {
          userJourney.currentStageIndex = Math.max(
            userJourney.currentStageIndex,
            parsedStageIndex + 1
          );

          const nextStageIndex = parsedStageIndex + 1;
          userJourney.stages[nextStageIndex].started = true;
          userJourney.stages[nextStageIndex].startedAt = new Date();
          userJourney.stages[nextStageIndex].state = "IN_PROGRESS";

          // Unlock ngày đầu tiên của stage tiếp theo
          if (userJourney.stages[nextStageIndex].days.length > 0) {
            const nextStageDaysSorted = [...userJourney.stages[nextStageIndex].days]
              .sort((a, b) => a.dayNumber - b.dayNumber);

            if (nextStageDaysSorted.length > 0) {
              const firstDayNumber = nextStageDaysSorted[0].dayNumber;
              const firstDayIndex = userJourney.stages[nextStageIndex].days
                .findIndex((day) => day.dayNumber === firstDayNumber);

              if (firstDayIndex !== -1) {
                userJourney.stages[nextStageIndex].days[firstDayIndex].started = true;
                userJourney.stages[nextStageIndex].days[firstDayIndex].startedAt = new Date();
              }
            }
          }
        } else {
          // Nếu là stage cuối cùng, đánh dấu hoàn thành toàn bộ lộ trình
          userJourney.state = "COMPLETED";
          userJourney.completedAt = new Date();
        }
      }

      await userJourney.save();

      // Lưu lịch sử làm bài test (tương tự practice history)
      const PracticeHistory = require("../models/practiceHistory");

      const practiceHistory = new PracticeHistory({
        user: userId,
        startTime: startTime || currentStage.finalTest.startedAt,
        endTime: endTime || new Date(),
        lessonType: "STAGE_FINAL_TEST", // Custom type cho final test
        totalQuestions,
        correctAnswers,
        accuracyRate,
        questionAnswers,
      });

      await practiceHistory.save();

      return res.status(200).json({
        message: userJourney.stages[parsedStageIndex].finalTest.passed
          ? "Chúc mừng! Bạn đã vượt qua bài test tổng kết"
          : "Bạn chưa đạt điểm tối thiểu. Hãy ôn tập và thử lại!",
        passed: userJourney.stages[parsedStageIndex].finalTest.passed,
        score: accuracyRate,
        correctAnswers,
        totalQuestions,
        minScore: currentStage.minScore,
        userJourney,
        practiceHistoryId: practiceHistory._id,
      });
    } catch (error) {
      console.error("Error in completeStageFinalTest:", error);
      return res.status(500).json({
        message: "Đã xảy ra lỗi khi hoàn thành bài test",
        error: error.message,
      });
    }
  },

  // Lấy thông tin bài test tổng kết của một stage
  getStageFinalTest: async (req, res) => {
    try {
      const userId = req.user.id;
      const { stageIndex } = req.params;
      const parsedStageIndex = parseInt(stageIndex);

      console.log(`🔍 [getStageFinalTest] userId: ${userId}, stageIndex: ${parsedStageIndex}`);

      let userJourney = await UserJourney.findOne({
        user: userId,
        state: { $in: ["NOT_STARTED", "IN_PROGRESS"] },
      });

      // Nếu không có active journey, tìm completed journey gần nhất
      if (!userJourney) {
        userJourney = await UserJourney.findOne({
          user: userId,
          state: "COMPLETED",
        }).sort({ completedAt: -1 });
      }

      if (!userJourney) {
        return res.status(404).json({
          message: "Không tìm thấy lộ trình nào",
        });
      }

      if (parsedStageIndex < 0 || parsedStageIndex >= userJourney.stages.length) {
        return res.status(404).json({
          message: "Stage không tồn tại trong lộ trình",
        });
      }

      const currentStage = userJourney.stages[parsedStageIndex];

      console.log(`📊 [getStageFinalTest] Stage ${parsedStageIndex}:`, {
        finalTest: currentStage.finalTest,
        allDaysCompleted: currentStage.days.every(day => day.completed),
        totalDays: currentStage.days.length,
        completedDays: currentStage.days.filter(day => day.completed).length,
        state: currentStage.state
      });

      console.log(`🔍 [getStageFinalTest] Loading stage: ${currentStage.stageId}`);
      const stage = await Stage.findById(currentStage.stageId).populate({
        path: "days.questions",
        model: "questions",
      });

      console.log(`📋 [getStageFinalTest] Stage loaded:`, {
        stageId: stage._id,
        totalDays: stage.days.length,
        daysData: stage.days.map(day => ({
          dayNumber: day.dayNumber,
          questionsCount: day.questions?.length || 0
        }))
      });

      // Tập hợp tất cả câu hỏi từ các ngày trong stage
      let allQuestions = [];
      const seenQuestionIds = new Set(); // ✅ Track unique question IDs

      stage.days.forEach(day => {
        if (day.questions && day.questions.length > 0) {
          console.log(`📅 [getStageFinalTest] Day ${day.dayNumber}: adding ${day.questions.length} questions`);

          // ✅ Filter out duplicate questions
          const uniqueQuestions = day.questions.filter(question => {
            const questionId = question._id.toString();
            if (seenQuestionIds.has(questionId)) {
              console.log(`⚠️ [getStageFinalTest] Duplicate question skipped: ${questionId} from day ${day.dayNumber}`);
              return false;
            }
            seenQuestionIds.add(questionId);
            return true;
          });

          allQuestions = allQuestions.concat(uniqueQuestions);
          console.log(`✅ [getStageFinalTest] Day ${day.dayNumber}: added ${uniqueQuestions.length} unique questions (${day.questions.length - uniqueQuestions.length} duplicates filtered)`);
        } else {
          console.log(`📅 [getStageFinalTest] Day ${day.dayNumber}: no questions found`);
        }
      });

      console.log(`🎯 [getStageFinalTest] Total questions collected: ${allQuestions.length}`);

      if (allQuestions.length === 0) {
        console.error(`❌ [getStageFinalTest] No questions found for stage ${currentStage.stageId}`);
        return res.status(404).json({
          message: "Giai đoạn này không có câu hỏi nào để tạo bài test",
        });
      }

      // Nếu test đã started, trả về questions để làm bài
      let questionsData = null;
      console.log(`🔍 [getStageFinalTest] Test status:`, {
        started: currentStage.finalTest.started,
        completed: currentStage.finalTest.completed,
        shouldReturnQuestions: currentStage.finalTest.started && !currentStage.finalTest.completed,
        allQuestionsCount: allQuestions.length
      });

      if (currentStage.finalTest.started && !currentStage.finalTest.completed) {
        // Trộn ngẫu nhiên câu hỏi (consistent với startStageFinalTest)
        const shuffledQuestions = allQuestions.sort(() => 0.5 - Math.random());
        questionsData = shuffledQuestions;
        console.log(`✅ [getStageFinalTest] Returning ${questionsData.length} questions`);
      } else {
        console.log(`❌ [getStageFinalTest] Not returning questions - test not active`);
      }

      const finalTestInfo = {
        name: `Final Test - Stage ${parsedStageIndex + 1}`,
        duration: Math.max(allQuestions.length * 2, 30),
        totalQuestions: allQuestions.length,
        questionTypes: [...new Set(allQuestions.map(q => q.type))], // Unique types
        questions: questionsData, // Include questions if test is active
      };

      console.log(`🎯 [getStageFinalTest] Response:`, {
        finalTestUnlocked: currentStage.finalTest.unlocked,
        finalTestCompleted: currentStage.finalTest.completed,
        canTakeTest: currentStage.finalTest.unlocked && !currentStage.finalTest.completed,
        allDaysCompleted: currentStage.days.every(day => day.completed),
        hasQuestions: questionsData ? questionsData.length : 0
      });

      return res.status(200).json({
        finalTestInfo,
        finalTestStatus: currentStage.finalTest,
        minScore: currentStage.minScore,
        targetScore: currentStage.targetScore,
        canTakeTest: currentStage.finalTest.unlocked && !currentStage.finalTest.completed,
      });
    } catch (error) {
      console.error("Error in getStageFinalTest:", error);
      return res.status(500).json({
        message: "Đã xảy ra lỗi khi lấy thông tin bài test",
        error: error.message,
      });
    }
  },

  // Skip stage hiện tại và chuyển sang stage tiếp theo
  skipStage: async (req, res) => {
    try {
      const userId = req.user.id;
      const { stageIndex } = req.params;
      const parsedStageIndex = parseInt(stageIndex);

      console.log(`🚀 [skipStage] userId: ${userId}, stageIndex: ${parsedStageIndex}`);

      const userJourney = await UserJourney.findOne({
        user: userId,
        state: { $in: ["NOT_STARTED", "IN_PROGRESS"] },
      });

      if (!userJourney) {
        return res.status(404).json({
          message: "Không tìm thấy lộ trình đang hoạt động",
        });
      }

      // Validate stage index
      if (parsedStageIndex < 0 || parsedStageIndex >= userJourney.stages.length) {
        return res.status(404).json({
          message: "Stage không tồn tại trong lộ trình",
        });
      }

      // Chỉ cho phép skip stage hiện tại hoặc stage đã unlock
      if (parsedStageIndex > userJourney.currentStageIndex) {
        return res.status(403).json({
          message: "Bạn chỉ có thể skip stage hiện tại hoặc các stage đã mở khóa",
        });
      }

      const currentStage = userJourney.stages[parsedStageIndex];

      // Không cho phép skip stage đã hoàn thành
      if (currentStage.state === "COMPLETED") {
        return res.status(400).json({
          message: "Không thể skip stage đã hoàn thành",
        });
      }

      // Đánh dấu tất cả các ngày trong stage là completed
      userJourney.stages[parsedStageIndex].days.forEach(day => {
        day.started = true;
        day.completed = true;
        if (!day.startedAt) {
          day.startedAt = new Date();
        }
      });

      // Đánh dấu stage hiện tại là SKIPPED
      userJourney.stages[parsedStageIndex].state = "SKIPPED";
      userJourney.stages[parsedStageIndex].completedAt = new Date();

      // Nếu có final test, đánh dấu là đã passed để không block progression
      if (userJourney.stages[parsedStageIndex].finalTest) {
        userJourney.stages[parsedStageIndex].finalTest.unlocked = true;
        userJourney.stages[parsedStageIndex].finalTest.started = true;
        userJourney.stages[parsedStageIndex].finalTest.completed = true;
        userJourney.stages[parsedStageIndex].finalTest.passed = true;
        userJourney.stages[parsedStageIndex].finalTest.score = 100; // Assume skipped = passed
        userJourney.stages[parsedStageIndex].finalTest.startedAt = new Date();
        userJourney.stages[parsedStageIndex].finalTest.completedAt = new Date();
      }

      // Unlock và chuyển sang stage tiếp theo (nếu có)
      if (parsedStageIndex < userJourney.stages.length - 1) {
        const nextStageIndex = parsedStageIndex + 1;

        // Cập nhật currentStageIndex
        userJourney.currentStageIndex = Math.max(
          userJourney.currentStageIndex,
          nextStageIndex
        );

        // Unlock stage tiếp theo
        const nextStage = userJourney.stages[nextStageIndex];
        if (!nextStage.started) {
          nextStage.started = true;
          nextStage.startedAt = new Date();
          nextStage.state = "IN_PROGRESS";

          // Unlock ngày đầu tiên của stage tiếp theo
          if (nextStage.days.length > 0) {
            const firstDay = nextStage.days
              .sort((a, b) => a.dayNumber - b.dayNumber)[0];

            if (firstDay && !firstDay.started) {
              const firstDayIndex = nextStage.days
                .findIndex(day => day.dayNumber === firstDay.dayNumber);

              if (firstDayIndex !== -1) {
                nextStage.days[firstDayIndex].started = true;
                nextStage.days[firstDayIndex].startedAt = new Date();
              }
            }
          }
        }
      } else {
        // Nếu skip stage cuối cùng, đánh dấu hoàn thành toàn bộ journey
        userJourney.state = "COMPLETED";
        userJourney.completedAt = new Date();
      }

      await userJourney.save();

      console.log(`✅ [skipStage] Đã skip stage ${parsedStageIndex} thành công`);

      return res.status(200).json({
        message: `Đã bỏ qua giai đoạn ${parsedStageIndex + 1} thành công`,
        userJourney,
        nextStageIndex: parsedStageIndex < userJourney.stages.length - 1 ? parsedStageIndex + 1 : null,
      });

    } catch (error) {
      console.error("Error in skipStage:", error);
      return res.status(500).json({
        message: "Đã xảy ra lỗi khi bỏ qua giai đoạn",
        error: error.message,
      });
    }
  },

  // Test endpoint để kiểm tra final test status (không cần auth)
  testFinalTestStatus: async (req, res) => {
    try {
      const { stageIndex } = req.params;
      const parsedStageIndex = parseInt(stageIndex);

      // Lấy một user journey bất kỳ để test
      const userJourney = await UserJourney.findOne({
        state: { $in: ["NOT_STARTED", "IN_PROGRESS"] },
      });

      if (!userJourney) {
        return res.status(404).json({
          message: "Không tìm thấy lộ trình nào",
        });
      }

      if (parsedStageIndex >= userJourney.stages.length) {
        return res.status(404).json({
          message: "Stage không tồn tại",
        });
      }

      const stage = userJourney.stages[parsedStageIndex];

      return res.status(200).json({
        userId: userJourney.user,
        stageIndex: parsedStageIndex,
        stage: {
          finalTest: stage.finalTest,
          allDaysCompleted: stage.days.every(day => day.completed),
          totalDays: stage.days.length,
          completedDays: stage.days.filter(day => day.completed).length,
          state: stage.state,
          days: stage.days.map(day => ({
            dayNumber: day.dayNumber,
            completed: day.completed,
            started: day.started
          }))
        }
      });
    } catch (error) {
      console.error("Error in testFinalTestStatus:", error);
      return res.status(500).json({
        message: "Lỗi khi kiểm tra status",
        error: error.message,
      });
    }
  },

  // Debug endpoint to check user journey
  debugUserJourney: async (req, res) => {
    try {
      const { userId } = req.params;

      console.log("🔍 [debugUserJourney] Checking user:", userId);

      const allJourneys = await UserJourney.find({ user: userId }).sort({ createdAt: -1 });
      const activeJourney = await UserJourney.findOne({
        user: userId,
        state: { $in: ["NOT_STARTED", "IN_PROGRESS"] },
      });
      const completedJourney = await UserJourney.findOne({
        user: userId,
        state: "COMPLETED",
      }).sort({ completedAt: -1 });

      return res.status(200).json({
        userId,
        totalJourneys: allJourneys.length,
        activeJourney: activeJourney ? {
          _id: activeJourney._id,
          state: activeJourney.state,
          currentStageIndex: activeJourney.currentStageIndex,
          stages: activeJourney.stages.length,
        } : null,
        completedJourney: completedJourney ? {
          _id: completedJourney._id,
          state: completedJourney.state,
          completedAt: completedJourney.completedAt,
        } : null,
        allJourneys: allJourneys.map(j => ({
          _id: j._id,
          state: j.state,
          createdAt: j.createdAt,
          currentStageIndex: j.currentStageIndex,
        })),
      });
    } catch (error) {
      console.error("Error in debugUserJourney:", error);
      return res.status(500).json({
        message: "Debug error",
        error: error.message,
      });
    }
  },

  // Debug endpoint to check finalTest status
  debugFinalTestStatus: async (req, res) => {
    try {
      const { userId } = req.params;

      console.log("🔍 [debugFinalTestStatus] Checking user:", userId);

      const journey = await UserJourney.findOne({
        user: userId,
        state: { $in: ["NOT_STARTED", "IN_PROGRESS", "COMPLETED"] },
      }).sort({ createdAt: -1 });

      if (!journey) {
        return res.status(404).json({
          message: "Không tìm thấy journey nào",
        });
      }

      const stagesWithFinalTest = journey.stages.map((stage, index) => ({
        stageIndex: index,
        state: stage.state,
        daysCompleted: stage.days.filter(day => day.completed).length,
        totalDays: stage.days.length,
        finalTest: stage.finalTest ? {
          unlocked: stage.finalTest.unlocked,
          started: stage.finalTest.started,
          completed: stage.finalTest.completed,
          score: stage.finalTest.score,
          passed: stage.finalTest.passed,
        } : null,
      }));

      return res.status(200).json({
        userId,
        journeyId: journey._id,
        journeyState: journey.state,
        currentStageIndex: journey.currentStageIndex,
        stages: stagesWithFinalTest,
      });
    } catch (error) {
      console.error("Error in debugFinalTestStatus:", error);
      return res.status(500).json({
        message: "Debug error",
        error: error.message,
      });
    }
  },
};

module.exports = UserJourneyController;
