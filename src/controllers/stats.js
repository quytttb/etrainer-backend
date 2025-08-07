const User = require("../models/users");
const UserJourney = require("../models/userJourney");
const PracticeHistory = require("../models/practiceHistory");
const dayjs = require("dayjs");

exports.getUserStats = async (req, res) => {
  try {
    const now = dayjs();
    const sixMonthsAgo = now.subtract(5, "month").startOf("month");

    // Aggregate số user theo năm, tháng
    const usersByMonth = await User.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo.toDate() } } },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    // Hoàn thiện dữ liệu 6 tháng đầy đủ, không bị thiếu tháng nào
    const usersByMonthComplete = [];
    for (let i = 0; i < 6; i++) {
      const date = sixMonthsAgo.add(i, "month");
      const year = date.year();
      const month = date.month() + 1;
      const data = usersByMonth.find(
        (item) => item._id.year === year && item._id.month === month
      );
      usersByMonthComplete.push({
        year,
        month,
        count: data ? data.count : 0,
      });
    }

    // Thống kê giới tính
    const genderAggregation = await User.aggregate([
      { $group: { _id: "$gender", count: { $sum: 1 } } },
    ]);

    let male = 0,
      female = 0;
    genderAggregation.forEach((item) => {
      if (item._id === "MALE") male = item.count;
      else if (item._id === "FEMALE") female = item.count;
    });

    const total = male + female;

    res.json({
      usersByMonth: usersByMonthComplete,
      genderStats: { male, female, total },
    });
  } catch (error) {
    console.error("Failed to get user stats", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.getProgress = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user journey progress
    const userJourney = await UserJourney.findOne({ userId }).exec();

    if (!userJourney) {
      return res.json({
        message: "No progress found",
        progress: {
          currentStage: 0,
          currentDay: 0,
          totalStagesCompleted: 0,
          totalDaysCompleted: 0,
          completionPercentage: 0,
          streakDays: 0,
          lastActivityDate: null
        }
      });
    }

    // Calculate total completed days across all stages
    let totalDaysCompleted = 0;
    let completedStages = 0;

    userJourney.stages.forEach(stage => {
      const completedDaysInStage = stage.days.filter(day => day.completed).length;
      totalDaysCompleted += completedDaysInStage;

      if (stage.completed) {
        completedStages++;
      }
    });

    // Estimate total days (assuming 30 days per stage, 10 stages)
    const estimatedTotalDays = 300;
    const completionPercentage = Math.round((totalDaysCompleted / estimatedTotalDays) * 100);

    // Calculate streak (simplified)
    let streakDays = 0;
    const today = dayjs();

    // Find most recent activity
    let lastActivityDate = null;
    userJourney.stages.forEach(stage => {
      stage.days.forEach(day => {
        if (day.completed && day.completedAt) {
          if (!lastActivityDate || dayjs(day.completedAt).isAfter(lastActivityDate)) {
            lastActivityDate = day.completedAt;
          }
        }
      });
    });

    res.json({
      message: "Progress retrieved successfully",
      progress: {
        currentStage: userJourney.currentStageIndex || 0,
        currentDay: userJourney.currentDayNumber || 0,
        totalStagesCompleted: completedStages,
        totalDaysCompleted,
        completionPercentage,
        streakDays,
        lastActivityDate,
        stages: userJourney.stages.map(stage => ({
          stageIndex: stage.stageIndex,
          completed: stage.completed,
          completedDays: stage.days.filter(day => day.completed).length,
          totalDays: stage.days.length
        }))
      }
    });

  } catch (error) {
    console.error("Failed to get progress:", error);
    res.status(500).json({
      error: "Failed to get progress",
      message: error.message
    });
  }
};

exports.getAchievements = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user data
    const user = await User.findById(userId).exec();
    const userJourney = await UserJourney.findOne({ userId }).exec();
    const practiceHistory = await PracticeHistory.find({ userId }).exec();

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Calculate achievements based on progress
    const achievements = [];

    // Journey achievements
    if (userJourney) {
      const completedStages = userJourney.stages.filter(stage => stage.completed).length;
      const totalDaysCompleted = userJourney.stages.reduce((total, stage) => {
        return total + stage.days.filter(day => day.completed).length;
      }, 0);

      // First day completed
      if (totalDaysCompleted >= 1) {
        achievements.push({
          id: "first_day",
          title: "First Steps",
          description: "Complete your first day of learning",
          icon: "🎯",
          unlockedAt: userJourney.createdAt,
          category: "journey"
        });
      }

      // First week completed
      if (totalDaysCompleted >= 7) {
        achievements.push({
          id: "first_week",
          title: "Week Warrior",
          description: "Complete 7 days of learning",
          icon: "🗓️",
          unlockedAt: userJourney.updatedAt,
          category: "journey"
        });
      }

      // First stage completed
      if (completedStages >= 1) {
        achievements.push({
          id: "first_stage",
          title: "Stage Master",
          description: "Complete your first stage",
          icon: "🏆",
          unlockedAt: userJourney.updatedAt,
          category: "journey"
        });
      }

      // Multiple stages
      if (completedStages >= 3) {
        achievements.push({
          id: "three_stages",
          title: "Progress Champion",
          description: "Complete 3 stages",
          icon: "🥉",
          unlockedAt: userJourney.updatedAt,
          category: "journey"
        });
      }

      if (completedStages >= 5) {
        achievements.push({
          id: "five_stages",
          title: "Learning Expert",
          description: "Complete 5 stages",
          icon: "🥈",
          unlockedAt: userJourney.updatedAt,
          category: "journey"
        });
      }
    }

    // Practice achievements
    if (practiceHistory && practiceHistory.length > 0) {
      if (practiceHistory.length >= 1) {
        achievements.push({
          id: "first_practice",
          title: "Practice Starter",
          description: "Complete your first practice session",
          icon: "💪",
          unlockedAt: practiceHistory[0].createdAt,
          category: "practice"
        });
      }

      if (practiceHistory.length >= 10) {
        achievements.push({
          id: "practice_regular",
          title: "Practice Regular",
          description: "Complete 10 practice sessions",
          icon: "🔥",
          unlockedAt: practiceHistory[9]?.createdAt,
          category: "practice"
        });
      }

      // High score achievements
      const highScores = practiceHistory.filter(p => p.score >= 80);
      if (highScores.length >= 5) {
        achievements.push({
          id: "high_scorer",
          title: "High Scorer",
          description: "Score 80% or higher in 5 practice sessions",
          icon: "⭐",
          unlockedAt: highScores[4]?.createdAt,
          category: "practice"
        });
      }
    }

    // Account achievements
    const accountAge = dayjs().diff(dayjs(user.createdAt), 'days');
    if (accountAge >= 7) {
      achievements.push({
        id: "one_week_member",
        title: "Committed Learner",
        description: "Member for one week",
        icon: "📅",
        unlockedAt: dayjs(user.createdAt).add(7, 'days').toDate(),
        category: "account"
      });
    }

    if (accountAge >= 30) {
      achievements.push({
        id: "one_month_member",
        title: "Dedicated Student",
        description: "Member for one month",
        icon: "🗓️",
        unlockedAt: dayjs(user.createdAt).add(30, 'days').toDate(),
        category: "account"
      });
    }

    // Sort achievements by unlock date (newest first)
    achievements.sort((a, b) => dayjs(b.unlockedAt).diff(dayjs(a.unlockedAt)));

    res.json({
      message: "Achievements retrieved successfully",
      achievements,
      totalAchievements: achievements.length,
      categories: {
        journey: achievements.filter(a => a.category === 'journey').length,
        practice: achievements.filter(a => a.category === 'practice').length,
        account: achievements.filter(a => a.category === 'account').length
      }
    });

  } catch (error) {
    console.error("Failed to get achievements:", error);
    res.status(500).json({
      error: "Failed to get achievements",
      message: error.message
    });
  }
};
