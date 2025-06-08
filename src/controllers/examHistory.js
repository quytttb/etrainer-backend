const LESSON_TYPE = require("../constants/lesson");
const Exam = require("../models/exam");
const ExamHistory = require("../models/examHistory");

const ExamHistoryController = {
  createExamHistory: async (req, res) => {
    try {
      const userId = req.user.id;
      const { startTime, endTime, sections, examId } = req.body;

      const exam = await Exam.findById(examId).exec();
      if (!exam) {
        return res.status(404).json({ message: "Exam not found" });
      }

      const totalQuestions = sections.reduce((acc, section) => {
        if (
          [
            LESSON_TYPE.IMAGE_DESCRIPTION,
            LESSON_TYPE.ASK_AND_ANSWER,
            LESSON_TYPE.FILL_IN_THE_BLANK_QUESTION,
          ].includes(section.type)
        ) {
          return acc + section.questions.length;
        }

        const total = section.questions.reduce((acc, question) => {
          return acc + question.questions.length;
        }, 0);

        return acc + total;
      }, 0);

      const correctAnswers = sections.reduce((acc, section) => {
        if (
          [
            LESSON_TYPE.IMAGE_DESCRIPTION,
            LESSON_TYPE.ASK_AND_ANSWER,
            LESSON_TYPE.FILL_IN_THE_BLANK_QUESTION,
          ].includes(section.type)
        ) {
          return acc + section.questions.filter((q) => q.isCorrect).length;
        }

        const total = section.questions.reduce((acc, question) => {
          return acc + question.questions.filter((q) => q.isCorrect).length;
        }, 0);

        return acc + total;
      }, 0);

      const accuracyRate = parseFloat(
        ((correctAnswers / totalQuestions) * 100).toFixed(2)
      );

      const newExamHistory = await ExamHistory({
        user: userId,
        startTime,
        endTime,
        sections,
        totalQuestions,
        correctAnswers,
        accuracyRate,
        exam: {
          name: exam.name,
          createdAt: exam.createdAt,
        },
      }).save();

      res.status(201).json(newExamHistory);
    } catch (error) {
      res.status(500).json({ message: "Error creating exam history", error });
    }
  },

  getExamHistory: async (req, res) => {
    try {
      const userId = req.user.id;
      const id = req.params.id;

      const examHistory = await ExamHistory.findOne({
        user: userId,
        _id: id,
      }).exec();

      res.status(200).json(examHistory);
    } catch (error) {
      res.status(500).json({ message: "Error fetching exam history", error });
    }
  },

  getExamHistories: async (req, res) => {
    try {
      const userId = req.user.id;

      const examHistories = await ExamHistory.find({ user: userId })
        .sort("-createdAt")
        .exec();

      res.status(200).json(examHistories);
    } catch (error) {
      res.status(500).json({ message: "Error fetching exam histories", error });
    }
  },

  getAdminExamHistories: async (req, res) => {
    try {
      const { userId } = req.query;

      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }

      const searchCondition = { user: userId };

      const examHistories = await ExamHistory.find(searchCondition).sort({
        createdAt: -1,
      });

      return res.status(200).json(examHistories);
    } catch (error) {
      console.error("Error fetching user practice history:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  },
};

module.exports = ExamHistoryController;
