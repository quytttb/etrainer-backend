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
          return res.status(200).json({
            status: false,
            message: "Không tìm thấy lộ trình nào",
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
        userJourney.stages[parsedStageIndex].state = "COMPLETED";
        userJourney.stages[parsedStageIndex].completedAt = new Date();

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
};

module.exports = UserJourneyController;
