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

      // ✅ UPDATED: Allow creating new journey even when existing journey is active
      const existingJourney = await UserJourney.findOne({
        user: userId,
        state: { $in: ["NOT_STARTED", "IN_PROGRESS"] },
      });

      if (existingJourney) {
        console.log(`🔄 User ${userId} has existing journey, marking as REPLACED and creating new one`);

        // Mark existing journey as REPLACED instead of blocking new journey creation
        await UserJourney.findByIdAndUpdate(existingJourney._id, {
          state: "REPLACED",
          replacedAt: new Date(),
        });

        console.log(`✅ Existing journey ${existingJourney._id} marked as REPLACED`);
      }

      const stages = await Stage.find({ _id: { $in: stageIds } });

      if (stages.length !== stageIds.length) {
        return res.status(400).json({
          error: "Một hoặc nhiều stage không tồn tại",
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

      return res.status(201).json({
        message: "Journey created successfully",
        journey: userJourney
      });
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

      // ✅ UPDATED: Exclude REPLACED journeys from active search
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

      return res.status(200).json({
        message: "Current journey retrieved successfully",
        journey: response,
        // ✅ Add top-level properties for performance tests compatibility
        user: response.user,
        stages: response.stages
      });
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
      const { score, totalQuestions, correctAnswers } = req.body; // ✅ NEW: Accept score data
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
          error:
            "You must complete previous days before starting this day",
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

      // ✅ NEW: Validate score input
      if (score !== undefined && (typeof score !== 'number' && isNaN(Number(score)))) {
        return res.status(400).json({
          error: "Score must be a valid number",
        });
      }

      // ✅ NEW: Validate score and determine if should unlock next day
      const minPassScore = 60; // Minimum 60% to pass and unlock next day
      const currentStageMinScore = currentStage.minScore || 0;

      let dayPassed = true;
      let dayScore = 0;

      if (score !== undefined) {
        dayScore = Number(score);

        // If detailed score breakdown provided, use percentage calculation
        if (totalQuestions !== undefined && correctAnswers !== undefined) {
          const scorePercentage = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;
          dayPassed = scorePercentage >= minPassScore;

          console.log(`📊 [completeDay] Detailed score validation:`, {
            userId,
            stageIndex: parsedStageIndex,
            dayNumber: parsedDayNumber,
            score: dayScore,
            correctAnswers,
            totalQuestions,
            scorePercentage: scorePercentage.toFixed(1),
            minPassScore,
            dayPassed
          });
        } else {
          // If only score provided, treat as percentage
          dayPassed = dayScore >= minPassScore;

          console.log(`📊 [completeDay] Simple score validation:`, {
            userId,
            stageIndex: parsedStageIndex,
            dayNumber: parsedDayNumber,
            score: dayScore,
            minPassScore,
            dayPassed
          });
        }
      } else {
        console.log(`⚠️ [completeDay] No score data provided, marking as passed by default`);
      }

      // ✅ ALWAYS save progress regardless of score
      userJourney.stages[parsedStageIndex].days[dayIndex].completed = true;
      userJourney.stages[parsedStageIndex].days[dayIndex].score = dayScore;
      userJourney.stages[parsedStageIndex].days[dayIndex].completedAt = new Date();

      if (currentStage.state === "NOT_STARTED") {
        userJourney.stages[parsedStageIndex].state = "IN_PROGRESS";
      }

      if (userJourney.state === "NOT_STARTED") {
        userJourney.state = "IN_PROGRESS";
      }

      // ✅ ONLY unlock next day if score is sufficient
      if (dayPassed && currentDayIndex < sortedDays.length - 1) {
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

          console.log(`✅ [completeDay] Next day unlocked: Day ${nextDay.dayNumber}`);
        }
      } else if (!dayPassed) {
        console.log(`⚠️ [completeDay] Score too low (${dayScore}%), progress saved but next day not unlocked`);
      }

      const allDaysCompleted = currentStage.days.every((day) => day.completed);

      if (allDaysCompleted) {
        // Unlock bài test tổng kết giai đoạn
        userJourney.stages[parsedStageIndex].finalTest.unlocked = true;

        // ✅ FIXED: Only unlock next stage if final test is passed
        // Chỉ đánh dấu completed và unlock stage tiếp theo nếu đã pass final test
        if (userJourney.stages[parsedStageIndex].finalTest.passed) {
          userJourney.stages[parsedStageIndex].state = "COMPLETED";
          userJourney.stages[parsedStageIndex].completedAt = new Date();

          // ✅ FIXED: Only unlock next stage when final test is passed
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
        // ✅ FIXED: If final test not passed yet, just keep stage as IN_PROGRESS
        // Stage will only be completed when final test passes
      }

      await userJourney.save();

      // ✅ Return detailed response with unlock status
      const message = dayPassed
        ? `Day ${parsedDayNumber} completed successfully with score ${dayScore}%`
        : `Progress saved. Score ${dayScore}% not sufficient to unlock next day (need ≥${minPassScore}%)`;

      return res.status(200).json({
        message,
        journey: userJourney,
        dayCompleted: true,
        dayPassed: dayPassed,
        score: dayScore,
        nextDayUnlocked: dayPassed && (currentDayIndex < sortedDays.length - 1)
      });
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

      // ✅ UPDATED: Allow retaking test even if completed (remove blocking for passed tests)

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

      console.log(`🔍 [completeStageFinalTest] Starting for user: ${userId}, stage: ${parsedStageIndex}`);
      console.log(`📤 [completeStageFinalTest] Received questionAnswers:`, JSON.stringify(questionAnswers));

      if (!questionAnswers || !Array.isArray(questionAnswers)) {
        return res.status(400).json({
          message: "questionAnswers là bắt buộc",
        });
      }

      // ✅ ENHANCED: Validate questionAnswers is not empty
      if (questionAnswers.length === 0) {
        return res.status(400).json({
          message: "Cần ít nhất một câu trả lời để hoàn thành bài test",
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

      // ✅ UPDATED: Allow retaking test even if passed (remove blocking for passed tests)

      // ✅ Log retake scenario (both failed and passed tests)
      if (currentStage.finalTest.completed) {
        console.log(`🔄 [completeStageFinalTest] RETAKE scenario detected - test was completed (${currentStage.finalTest.passed ? 'passed' : 'failed'})`);
        console.log(`📊 Previous result: score=${currentStage.finalTest.score}, passed=${currentStage.finalTest.passed}`);

        // Reset test state for retake
        currentStage.finalTest.completed = false;
        currentStage.finalTest.completedAt = null;
        console.log(`🔄 [completeStageFinalTest] Test state reset for retake`);
      }

      // ✅ NEW LOGIC: Detect array format vs object format
      const isArrayFormat = Array.isArray(questionAnswers) &&
        questionAnswers.every(item => Array.isArray(item));

      console.log(`🔍 [completeStageFinalTest] Detected format: ${isArrayFormat ? 'ARRAY' : 'OBJECT'}`);

      let totalQuestions = 0;
      let correctAnswers = 0;
      let totalScore = 0; // ✅ FIXED: Declare totalScore outside conditional blocks

      if (isArrayFormat) {
        // ✅ Handle frontend array format: [["A"], ["C"], ["B"]]
        console.log(`🎯 [completeStageFinalTest] Processing array format - total entries: ${questionAnswers.length}`);

        // Get actual questions from stage to perform real scoring
        // ✅ FIX: Use manual populate to avoid strictPopulate issues
        const stage = await Stage.findById(currentStage.stageId);

        if (!stage) {
          return res.status(404).json({
            message: "Stage không tồn tại",
          });
        }

        // Manual populate questions to ensure they're loaded
        const Question = require('../models/question');

        console.log(`🔧 [completeStageFinalTest] Manual populating questions for stage ${currentStage.stageId}`);

        for (let dayIndex = 0; dayIndex < stage.days.length; dayIndex++) {
          const day = stage.days[dayIndex];
          if (day.questions && day.questions.length > 0) {
            const populatedQuestions = [];
            console.log(`📋 [completeStageFinalTest] Day ${day.dayNumber}: Loading ${day.questions.length} questions`);

            for (const questionId of day.questions) {
              try {
                const question = await Question.findById(questionId);
                if (question) {
                  populatedQuestions.push(question);
                  console.log(`✅ Loaded question: ${question._id} (${question.type})`);
                } else {
                  console.warn(`⚠️ Question not found: ${questionId}`);
                }
              } catch (qError) {
                console.warn(`⚠️ Failed to load question ${questionId}: ${qError.message}`);
              }
            }
            stage.days[dayIndex].questions = populatedQuestions;
            console.log(`📊 Day ${day.dayNumber}: Successfully loaded ${populatedQuestions.length} questions`);
          }
        }

        if (!stage) {
          return res.status(404).json({
            message: "Stage không tồn tại",
          });
        }

        // Collect all questions with duplicate filtering
        let allQuestions = [];
        const seenQuestionIds = new Set();

        stage.days.forEach(day => {
          console.log(`📋 [completeStageFinalTest] Day ${day.dayNumber}: ${day.questions?.length || 0} questions`);

          if (day.questions && day.questions.length > 0) {
            const uniqueQuestions = day.questions.filter(question => {
              // ✅ SAFETY: Handle both populated objects and ObjectIds
              const questionId = question._id ? question._id.toString() : question.toString();

              if (seenQuestionIds.has(questionId)) {
                console.log(`🔄 [completeStageFinalTest] Duplicate question skipped: ${questionId}`);
                return false;
              }
              seenQuestionIds.add(questionId);
              return true;
            });
            allQuestions = allQuestions.concat(uniqueQuestions);
          }
        });

        console.log(`📊 [completeStageFinalTest] Found ${allQuestions.length} unique questions in stage`);
        console.log(`🔍 [completeStageFinalTest] Questions sample:`, allQuestions.slice(0, 2).map(q => ({
          id: q._id,
          type: q.type,
          hasAnswers: !!q.answers,
          hasSubQuestions: !!q.questions,
          answersCount: q.answers?.length || 0,
          subQuestionsCount: q.questions?.length || 0
        })));

        // ✅ ENHANCED: Add safety check for edge cases
        if (allQuestions.length === 0) {
          console.warn(`⚠️ [completeStageFinalTest] No questions found in stage ${parsedStageIndex}`);
          return res.status(400).json({
            message: "Stage này chưa có câu hỏi nào. Vui lòng liên hệ hỗ trợ.",
          });
        }

        // ✅ PROPER SCORING: Compare user answers with actual correct answers
        totalQuestions = 0;
        correctAnswers = 0;

        // ✅ ENHANCED: Add safety check for edge cases
        if (allQuestions.length === 0) {
          console.warn(`⚠️ [completeStageFinalTest] No questions found in stage ${parsedStageIndex}`);
          return res.status(400).json({
            message: "Stage này chưa có câu hỏi nào. Vui lòng liên hệ hỗ trợ.",
          });
        }

        // ✅ SMART SCORING LOGIC: Adapt to actual number of answers received
        let answerIndex = 0; // Track position in flat answer array
        let totalAnsweredQuestions = 0; // Count actual questions answered

        console.log(`📊 [completeStageFinalTest] ADAPTIVE scoring system:`);
        console.log(`   Total available questions: ${allQuestions.length}`);
        console.log(`   Answers received: ${questionAnswers.length}`);

        // First pass: count how many questions can be answered
        for (let qIndex = 0; qIndex < allQuestions.length && answerIndex < questionAnswers.length; qIndex++) {
          const question = allQuestions[qIndex];

          if (question.questions && Array.isArray(question.questions)) {
            // Multi-part question: count sub-questions that have answers
            for (let subIndex = 0; subIndex < question.questions.length && answerIndex < questionAnswers.length; subIndex++) {
              totalAnsweredQuestions++;
              answerIndex++;
            }
          } else if (question.answers && Array.isArray(question.answers)) {
            // Single question
            if (answerIndex < questionAnswers.length) {
              totalAnsweredQuestions++;
              answerIndex++;
            }
          }
        }

        const pointsPerAnswer = totalAnsweredQuestions > 0 ? (100 / totalAnsweredQuestions) : 0;
        answerIndex = 0; // Reset for actual scoring

        console.log(`   Questions that can be scored: ${totalAnsweredQuestions}`);
        console.log(`   Points per answered question: ${pointsPerAnswer.toFixed(1)}%`);

        // Second pass: actual scoring
        for (let qIndex = 0; qIndex < allQuestions.length && answerIndex < questionAnswers.length; qIndex++) {
          const question = allQuestions[qIndex];

          console.log(`\n🔍 [completeStageFinalTest] Question ${qIndex + 1} (${question._id}):`);
          console.log(`📝 Type: ${question.type}`);

          let questionScore = 0; // Score for this specific question

          if (question.questions && Array.isArray(question.questions)) {
            // Multi-part question: process each sub-question separately
            console.log(`📤 Processing ${question.questions.length} sub-questions, ${pointsPerAnswer.toFixed(1)}% each`);

            for (let subIndex = 0; subIndex < question.questions.length && answerIndex < questionAnswers.length; subIndex++) {
              const subQuestion = question.questions[subIndex];

              const userAnswer = questionAnswers[answerIndex][0];

              console.log(`  Sub-Q ${subIndex + 1}: "${subQuestion.question}"`);
              console.log(`  User answer: "${userAnswer}" (answer index: ${answerIndex})`);

              if (userAnswer && subQuestion.answers) {
                // Find correct answer for this sub-question
                const correctAnswer = subQuestion.answers.find(ans => ans.isCorrect);
                const correctAnswerIndex = subQuestion.answers.findIndex(ans => ans.isCorrect);
                const correctAnswerLetter = correctAnswerIndex >= 0 ? String.fromCharCode(65 + correctAnswerIndex) : null;
                const correctAnswerId = correctAnswer ? String(correctAnswer._id) : null;

                console.log(`  Sub-Q ${subIndex + 1}: user="${userAnswer}", correct="${correctAnswerLetter}" (ID: ${correctAnswerId})`);

                // ✅ FIXED: Support both ID and letter format
                const isCorrectByLetter = correctAnswerLetter && userAnswer === correctAnswerLetter;
                const isCorrectById = correctAnswerId && userAnswer === correctAnswerId;
                const isCorrect = isCorrectByLetter || isCorrectById;

                if (isCorrect) {
                  questionScore += pointsPerAnswer;
                  console.log(`  ✅ CORRECT! +${pointsPerAnswer.toFixed(1)}% (match: ${isCorrectByLetter ? 'letter' : 'ID'})`);
                } else {
                  console.log(`  ❌ Wrong, +0%`);
                }
              } else {
                console.log(`  Sub-Q ${subIndex + 1}: No answer provided, +0%`);
              }

              answerIndex++; // Move to next answer
            }
          } else if (question.answers && Array.isArray(question.answers)) {
            // Single question: use one answer
            if (answerIndex < questionAnswers.length) {
              const userAnswer = questionAnswers[answerIndex][0];

              console.log(`📤 Single question, ${pointsPerAnswer.toFixed(1)}% total`);
              console.log(`  User answer: "${userAnswer}" (answer index: ${answerIndex})`);

              if (userAnswer && question.answers) {
                const correctAnswer = question.answers.find(ans => ans.isCorrect);
                const correctAnswerIndex = question.answers.findIndex(ans => ans.isCorrect);
                const correctAnswerLetter = correctAnswerIndex >= 0 ? String.fromCharCode(65 + correctAnswerIndex) : null;
                const correctAnswerId = correctAnswer ? String(correctAnswer._id) : null;

                console.log(`  Single Q: user="${userAnswer}", correct="${correctAnswerLetter}" (ID: ${correctAnswerId})`);

                // ✅ FIXED: Support both ID and letter format
                const isCorrectByLetter = correctAnswerLetter && userAnswer === correctAnswerLetter;
                const isCorrectById = correctAnswerId && userAnswer === correctAnswerId;
                const isCorrect = isCorrectByLetter || isCorrectById;

                if (isCorrect) {
                  questionScore = pointsPerAnswer;
                  console.log(`  ✅ CORRECT! +${pointsPerAnswer.toFixed(1)}% (match: ${isCorrectByLetter ? 'letter' : 'ID'})`);
                } else {
                  console.log(`  ❌ Wrong, +0%`);
                }
              } else {
                console.log(`  Single Q: No answer provided, +0%`);
              }

              answerIndex++; // Move to next answer
            }
          }

          totalScore += questionScore;
          console.log(`📊 Question ${qIndex + 1} score: ${questionScore.toFixed(1)}% (cumulative: ${totalScore.toFixed(1)}%)`);
        }

        // ✅ Set totalQuestions and correctAnswers for compatibility with existing code
        totalQuestions = totalAnsweredQuestions; // Use answered questions count for display
        correctAnswers = Math.round((totalScore / 100) * totalAnsweredQuestions); // Approximate correct count

        console.log(`🎯 [completeStageFinalTest] ADAPTIVE scoring result: ${totalScore.toFixed(1)}% (${correctAnswers}/${totalQuestions} approx)`)

        // ✅ ENHANCED: Check for incomplete submissions based on adaptive scoring
        const maxPossibleQuestions = allQuestions.reduce((count, question) => {
          if (question.questions && Array.isArray(question.questions)) {
            return count + question.questions.length; // Count sub-questions
          } else if (question.answers && Array.isArray(question.answers)) {
            return count + 1; // Single question
          }
          return count;
        }, 0);

        console.log(`📊 [completeStageFinalTest] Answer coverage:`, {
          receivedAnswers: questionAnswers.length,
          maxPossibleAnswers: maxPossibleQuestions,
          answeredQuestions: totalAnsweredQuestions,
          coveragePercent: maxPossibleQuestions > 0 ? ((questionAnswers.length / maxPossibleQuestions) * 100).toFixed(1) : 0,
          isPartialTest: questionAnswers.length < maxPossibleQuestions
        });

        // ✅ WARNING: Log if submission is significantly incomplete
        if (maxPossibleQuestions > 0 && questionAnswers.length < maxPossibleQuestions * 0.5) {
          console.warn(`⚠️ [completeStageFinalTest] Incomplete submission detected: ${questionAnswers.length}/${maxPossibleQuestions} answers (${((questionAnswers.length / maxPossibleQuestions) * 100).toFixed(1)}%)`);
        }
      } else {
        // ✅ Handle old object format (backward compatibility)
        console.log(`🎯 [completeStageFinalTest] Processing object format`);
        const LESSON_TYPE = require("../constants/lesson");

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

      // ✅ Use totalScore from new scoring logic for array format, fallback to old logic for object format
      const accuracyRate = isArrayFormat ?
        parseFloat(totalScore.toFixed(1)) : // New scoring system
        (totalQuestions > 0 ? parseFloat(((correctAnswers / totalQuestions) * 100).toFixed(2)) : 0); // Old system

      // ✅ UPDATED: Use 50% as minimum score for final test (percentage system)
      const finalTestMinScore = 50; // Fixed 50% threshold, ignore stage.minScore which is TOEIC score

      console.log(`📊 [completeStageFinalTest] Scoring results:`, {
        totalQuestions,
        correctAnswers,
        accuracyRate: `${accuracyRate}%`,
        stageMinScore: currentStage.minScore, // This is TOEIC target score, not percentage
        finalTestMinScore: `${finalTestMinScore}%`, // This is percentage threshold
        passed: accuracyRate >= finalTestMinScore,
        scoringMethod: isArrayFormat ? 'NEW (sub-question based)' : 'OLD (sub-question count)'
      });

      // Cập nhật kết quả test
      userJourney.stages[parsedStageIndex].finalTest.completed = true;
      userJourney.stages[parsedStageIndex].finalTest.completedAt = new Date();
      userJourney.stages[parsedStageIndex].finalTest.score = accuracyRate;
      userJourney.stages[parsedStageIndex].finalTest.passed = accuracyRate >= finalTestMinScore;

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

      console.log(`✅ [completeStageFinalTest] Test completed successfully:`, {
        passed: userJourney.stages[parsedStageIndex].finalTest.passed,
        score: accuracyRate,
        correctAnswers,
        totalQuestions
      });

      return res.status(200).json({
        message: userJourney.stages[parsedStageIndex].finalTest.passed
          ? `Chúc mừng! Bạn đã vượt qua bài test tổng kết với ${accuracyRate}%`
          : `Bạn chưa đạt điểm tối thiểu ${finalTestMinScore}%. Điểm của bạn: ${accuracyRate}%. Hãy ôn tập và thử lại!`,
        passed: userJourney.stages[parsedStageIndex].finalTest.passed,
        score: accuracyRate, // This is percentage (0-100)
        correctAnswers,
        totalQuestions,
        minScore: finalTestMinScore, // This is percentage threshold (70)
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

      // ✅ Return questions when test can be taken (including retakes and passed tests)
      let questionsData = null;
      const shouldReturnQuestions = currentStage.finalTest.unlocked;

      console.log(`🔍 [getStageFinalTest] Test status:`, {
        unlocked: currentStage.finalTest.unlocked,
        started: currentStage.finalTest.started,
        completed: currentStage.finalTest.completed,
        passed: currentStage.finalTest.passed,
        shouldReturnQuestions: shouldReturnQuestions,
        allQuestionsCount: allQuestions.length
      });

      if (shouldReturnQuestions) {
        // ✅ Return questions when unlocked (allows retaking both failed and passed tests)
        const shuffledQuestions = allQuestions.sort(() => 0.5 - Math.random());
        questionsData = shuffledQuestions;
        console.log(`✅ [getStageFinalTest] Returning ${questionsData.length} questions (test can be taken)`);
      } else {
        console.log(`❌ [getStageFinalTest] Not returning questions - test not available for taking`);
      }

      const finalTestInfo = {
        name: `Final Test - Stage ${parsedStageIndex + 1}`,
        duration: Math.max(allQuestions.length * 2, 30),
        totalQuestions: allQuestions.length,
        questionTypes: [...new Set(allQuestions.map(q => q.type))], // Unique types
        questions: questionsData, // Include questions if test is active
      };

      // ✅ UPDATED: Allow taking test if unlocked, regardless of completion/pass status
      const canTakeTest = currentStage.finalTest.unlocked;
      const allowRetry = currentStage.finalTest.completed;

      console.log(`🎯 [getStageFinalTest] Response:`, {
        finalTestUnlocked: currentStage.finalTest.unlocked,
        finalTestCompleted: currentStage.finalTest.completed,
        finalTestPassed: currentStage.finalTest.passed,
        canTakeTest: canTakeTest,
        allowRetry: allowRetry,
        allDaysCompleted: currentStage.days.every(day => day.completed),
        hasQuestions: questionsData ? questionsData.length : 0
      });

      // ✅ UPDATED: Always return 50% as minimum score for final test (percentage system)
      const finalTestMinScore = 50; // Fixed 50% threshold for final test

      return res.status(200).json({
        questions: questionsData, // ✅ Top level questions property for tests
        finalTestInfo,
        finalTestStatus: currentStage.finalTest,
        minScore: finalTestMinScore, // ✅ Always 70% for final test pass threshold
        targetScore: currentStage.targetScore, // This is TOEIC target score (300-990)
        canTakeTest: canTakeTest,
        allowRetry: allowRetry,
      });
    } catch (error) {
      console.error("Error in getStageFinalTest:", error);
      return res.status(500).json({
        message: "Đã xảy ra lỗi khi lấy thông tin bài test",
        error: error.message,
      });
    }
  },

  // Skip một stage (chuyển sang stage tiếp theo)
  skipStage: async (req, res) => {
    try {
      const userId = req.user.id;
      const { stageIndex } = req.params;
      const parsedStageIndex = parseInt(stageIndex);

      console.log(`🔄 [skipStage] userId: ${userId}, stageIndex: ${parsedStageIndex}`);

      const userJourney = await UserJourney.findOne({
        user: userId,
        state: { $in: ["NOT_STARTED", "IN_PROGRESS"] },
      });

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

      // Check if stage is already completed
      if (currentStage.state === "COMPLETED") {
        return res.status(400).json({
          error: "Cannot skip already completed stage",
        });
      }

      // Cập nhật state của stage hiện tại thành SKIPPED
      currentStage.state = "SKIPPED";

      // Unlock stage tiếp theo nếu có
      if (parsedStageIndex + 1 < userJourney.stages.length) {
        userJourney.stages[parsedStageIndex + 1].state = "IN_PROGRESS";
        userJourney.stages[parsedStageIndex + 1].started = true;
        userJourney.stages[parsedStageIndex + 1].startedAt = new Date();
        userJourney.currentStageIndex = parsedStageIndex + 1;
        console.log(`✅ [skipStage] Stage ${parsedStageIndex + 1} unlocked`);
      }

      await userJourney.save();

      console.log(`✅ [skipStage] Stage ${parsedStageIndex} skipped successfully`);

      return res.status(200).json({
        message: `Stage ${parsedStageIndex + 1} skipped successfully`,
        journey: userJourney,
      });
    } catch (error) {
      console.error("Error in skipStage:", error);
      return res.status(500).json({
        message: "Đã xảy ra lỗi khi bỏ qua giai đoạn",
        error: error.message,
      });
    }
  },

  // Debug function to check user journey status
  debugUserJourney: async (req, res) => {
    try {
      const { userId } = req.params;

      const userJourney = await UserJourney.findOne({
        user: userId,
        state: { $in: ["NOT_STARTED", "IN_PROGRESS", "COMPLETED"] },
      }).sort({ createdAt: -1 });

      if (!userJourney) {
        return res.status(404).json({
          message: "Không tìm thấy lộ trình nào cho user này",
        });
      }

      return res.status(200).json({
        userJourney,
      });
    } catch (error) {
      console.error("Error in debugUserJourney:", error);
      return res.status(500).json({
        message: "Đã xảy ra lỗi khi debug user journey",
        error: error.message,
      });
    }
  },

  // Debug function to check final test status
  debugFinalTestStatus: async (req, res) => {
    try {
      const { userId } = req.params;

      const userJourney = await UserJourney.findOne({
        user: userId,
        state: { $in: ["NOT_STARTED", "IN_PROGRESS", "COMPLETED"] },
      }).sort({ createdAt: -1 });

      if (!userJourney) {
        return res.status(404).json({
          message: "Không tìm thấy lộ trình nào cho user này",
        });
      }

      const finalTestStatus = userJourney.stages.map((stage, index) => ({
        stageIndex: index,
        stageId: stage.stageId,
        finalTest: stage.finalTest,
        state: stage.state,
        allDaysCompleted: stage.days.every(day => day.completed),
        totalDays: stage.days.length,
        completedDays: stage.days.filter(day => day.completed).length,
      }));

      return res.status(200).json({
        finalTestStatus,
      });
    } catch (error) {
      console.error("Error in debugFinalTestStatus:", error);
      return res.status(500).json({
        message: "Đã xảy ra lỗi khi debug final test status",
        error: error.message,
      });
    }
  },

  // Test function to check final test status without auth
  testFinalTestStatus: async (req, res) => {
    try {
      const { stageIndex } = req.params;
      const parsedStageIndex = parseInt(stageIndex);

      // Hardcoded user ID for testing - thay đổi theo nhu cầu
      const testUserId = "675c9b8b6c4b6f4af8e43210"; // Thay đổi ID này

      const userJourney = await UserJourney.findOne({
        user: testUserId,
        state: { $in: ["NOT_STARTED", "IN_PROGRESS", "COMPLETED"] },
      }).sort({ createdAt: -1 });

      if (!userJourney) {
        return res.status(404).json({
          message: "Không tìm thấy lộ trình test",
        });
      }

      if (parsedStageIndex < 0 || parsedStageIndex >= userJourney.stages.length) {
        return res.status(404).json({
          message: "Stage không tồn tại",
        });
      }

      const currentStage = userJourney.stages[parsedStageIndex];

      return res.status(200).json({
        stageIndex: parsedStageIndex,
        finalTest: currentStage.finalTest,
        state: currentStage.state,
        allDaysCompleted: currentStage.days.every(day => day.completed),
        message: "Test final test status endpoint working",
      });
    } catch (error) {
      console.error("Error in testFinalTestStatus:", error);
      return res.status(500).json({
        message: "Đã xảy ra lỗi khi test final test status",
        error: error.message,
      });
    }
  },

  // ✅ NEW: Get replaced journeys history
  getReplacedJourneys: async (req, res) => {
    try {
      const userId = req.user.id;

      const replacedJourneys = await UserJourney.find({
        user: userId,
        state: "REPLACED",
      }).sort({ replacedAt: -1 });

      return res.status(200).json({
        message: `Tìm thấy ${replacedJourneys.length} lộ trình đã bị thay thế`,
        replacedJourneys,
      });
    } catch (error) {
      console.error("Error in getReplacedJourneys:", error);
      return res.status(500).json({
        message: "Đã xảy ra lỗi khi lấy lịch sử lộ trình",
        error: error.message,
      });
    }
  },

  // ✅ NEW: Get all journeys (active + replaced + completed)
  getAllJourneys: async (req, res) => {
    try {
      const userId = req.user.id;

      const allJourneys = await UserJourney.find({
        user: userId,
      }).sort({ createdAt: -1 });

      const categorized = {
        active: allJourneys.filter(j => ["NOT_STARTED", "IN_PROGRESS"].includes(j.state)),
        completed: allJourneys.filter(j => j.state === "COMPLETED"),
        replaced: allJourneys.filter(j => j.state === "REPLACED"),
      };

      return res.status(200).json({
        message: `Tìm thấy ${allJourneys.length} lộ trình`,
        total: allJourneys.length,
        categorized,
        allJourneys,
      });
    } catch (error) {
      console.error("Error in getAllJourneys:", error);
      return res.status(500).json({
        message: "Đã xảy ra lỗi khi lấy tất cả lộ trình",
        error: error.message,
      });
    }
  },

  // Start next day endpoint  
  startNextDay: async (req, res) => {
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
          error: "No active journey found",
        });
      }

      if (parsedStageIndex < 0 || parsedStageIndex >= userJourney.stages.length) {
        return res.status(400).json({
          error: "Stage does not exist in journey",
        });
      }

      const currentStage = userJourney.stages[parsedStageIndex];
      const dayIndex = currentStage.days.findIndex(day => day.dayNumber === parsedDayNumber);

      if (dayIndex === -1) {
        return res.status(400).json({
          error: `Day ${parsedDayNumber} not found in this stage`,
        });
      }

      // Check if previous day is completed (except for day 1)
      if (parsedDayNumber > 1) {
        const previousDay = currentStage.days.find(day => day.dayNumber === parsedDayNumber - 1);
        if (!previousDay || !previousDay.completed) {
          return res.status(400).json({
            error: "You must complete the previous day before starting this day",
          });
        }
      }

      // Start the day
      userJourney.stages[parsedStageIndex].days[dayIndex].started = true;
      userJourney.stages[parsedStageIndex].days[dayIndex].startedAt = new Date();

      await userJourney.save();

      return res.status(200).json({
        message: `Day ${parsedDayNumber} started successfully`,
        journey: userJourney
      });
    } catch (error) {
      console.error("Error in startNextDay:", error);
      return res.status(500).json({
        message: "Đã xảy ra lỗi khi bắt đầu ngày",
        error: error.message,
      });
    }
  },

  // Get progress for a user
  getProgress: async (req, res) => {
    try {
      const { userId } = req.params;

      const userJourney = await UserJourney.findOne({
        user: userId,
        state: { $in: ["NOT_STARTED", "IN_PROGRESS", "COMPLETED"] },
      }).sort({ createdAt: -1 });

      if (!userJourney) {
        return res.status(404).json({
          message: "Không tìm thấy lộ trình cho user này",
        });
      }

      let totalDays = 0;
      let completedDays = 0;
      const stageProgress = [];

      userJourney.stages.forEach((stage, index) => {
        const stageTotalDays = stage.days.length;
        const stageCompletedDays = stage.days.filter(day => day.completed).length;

        totalDays += stageTotalDays;
        completedDays += stageCompletedDays;

        stageProgress.push({
          stageIndex: index,
          stageId: stage.stageId,
          totalDays: stageTotalDays,
          completedDays: stageCompletedDays,
          completionPercentage: stageTotalDays > 0 ? Math.round((stageCompletedDays / stageTotalDays) * 100) : 0,
          state: stage.state,
          finalTestUnlocked: stage.finalTest.unlocked,
          finalTestCompleted: stage.finalTest.completed
        });
      });

      const overallCompletionRate = totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0;

      return res.status(200).json({
        message: "Progress retrieved successfully",
        progress: {
          totalStages: userJourney.stages.length,
          completedStages: userJourney.stages.filter(stage => stage.state === "COMPLETED").length,
          currentStage: userJourney.currentStageIndex,
          totalDays,
          completedDays,
          overallCompletionRate,
          currentStageIndex: userJourney.currentStageIndex,
          journeyState: userJourney.state,
          stageProgress
        }
      });
    } catch (error) {
      console.error("Error in getProgress:", error);
      return res.status(500).json({
        message: "Đã xảy ra lỗi khi lấy tiến độ",
        error: error.message,
      });
    }
  },

  // ✅ NEW: Submit final test method
  submitFinalTest: async (req, res) => {
    try {
      const userId = req.user.id;
      const { stageIndex } = req.params;
      const { answers, score, correctAnswers, totalQuestions } = req.body;
      const parsedStageIndex = parseInt(stageIndex);

      const userJourney = await UserJourney.findOne({
        user: userId,
        state: { $in: ["NOT_STARTED", "IN_PROGRESS"] },
      });

      if (!userJourney) {
        return res.status(404).json({
          message: "No active journey found",
        });
      }

      if (parsedStageIndex < 0 || parsedStageIndex >= userJourney.stages.length) {
        return res.status(400).json({
          error: "Stage does not exist in journey",
        });
      }

      const currentStage = userJourney.stages[parsedStageIndex];

      // Check if final test is unlocked
      if (!currentStage.finalTest.unlocked) {
        return res.status(400).json({
          error: "Final test is not unlocked yet",
        });
      }

      // Check if final test is already completed
      if (currentStage.finalTest.completed) {
        return res.status(400).json({
          error: "Final test already completed",
        });
      }

      // Calculate score if not provided
      let finalScore = score;
      if (!finalScore && correctAnswers !== undefined && totalQuestions !== undefined) {
        finalScore = Math.round((correctAnswers / totalQuestions) * 100);
      }

      // Update final test status
      userJourney.stages[parsedStageIndex].finalTest.completed = true;
      userJourney.stages[parsedStageIndex].finalTest.completedAt = new Date();
      userJourney.stages[parsedStageIndex].finalTest.score = finalScore || 0;
      userJourney.stages[parsedStageIndex].finalTest.passed = (finalScore || 0) >= currentStage.minScore;

      // Mark stage as completed if final test passed
      if (userJourney.stages[parsedStageIndex].finalTest.passed) {
        userJourney.stages[parsedStageIndex].state = "COMPLETED";
        userJourney.stages[parsedStageIndex].completedAt = new Date();

        // Unlock next stage if exists
        if (parsedStageIndex + 1 < userJourney.stages.length) {
          userJourney.stages[parsedStageIndex + 1].state = "IN_PROGRESS";
          userJourney.stages[parsedStageIndex + 1].started = true;
          userJourney.stages[parsedStageIndex + 1].startedAt = new Date();
          userJourney.currentStageIndex = parsedStageIndex + 1;
        } else {
          // All stages completed
          userJourney.state = "COMPLETED";
          userJourney.completedAt = new Date();
        }
      }

      await userJourney.save();

      return res.status(200).json({
        message: "Final test submitted successfully",
        journey: userJourney,
        finalTestResult: {
          score: finalScore,
          passed: userJourney.stages[parsedStageIndex].finalTest.passed,
          completedAt: userJourney.stages[parsedStageIndex].finalTest.completedAt
        }
      });
    } catch (error) {
      console.error("Error in submitFinalTest:", error);
      return res.status(500).json({
        message: "An error occurred while submitting final test",
        error: error.message,
      });
    }
  },
};

module.exports = UserJourneyController;