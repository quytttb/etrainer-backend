const LESSON_TYPE = require("../constants/lesson");
const PracticeHistory = require("../models/practiceHistory");
const Question = require("../models/question");

const PracticeController = {
  submitPractice: async (req, res) => {
    try {
      const userId = req.user.id;

      const { startTime, endTime, lessonType, questionAnswers } = req.body;

      const practiceHistory = {
        user: userId,
        startTime,
        endTime,
        lessonType,
        questionAnswers,
      };

      switch (lessonType) {
        case LESSON_TYPE.IMAGE_DESCRIPTION:
        case LESSON_TYPE.ASK_AND_ANSWER:
        case LESSON_TYPE.FILL_IN_THE_BLANK_QUESTION: {
          practiceHistory.totalQuestions = questionAnswers.length;

          const correctAnswers = questionAnswers.filter(
            (answer) => answer.isCorrect
          ).length;
          practiceHistory.correctAnswers = correctAnswers;

          const accuracyRate = parseFloat(
            ((correctAnswers / questionAnswers.length) * 100).toFixed(2)
          );
          practiceHistory.accuracyRate = accuracyRate;

          break;
        }

        case LESSON_TYPE.CONVERSATION_PIECE:
        case LESSON_TYPE.SHORT_TALK:
        case LESSON_TYPE.FILL_IN_THE_PARAGRAPH:
        case LESSON_TYPE.READ_AND_UNDERSTAND: {
          const totalQuestions = questionAnswers.reduce(
            (acc, answer) => acc + answer.questions.length,
            0
          );
          practiceHistory.totalQuestions = totalQuestions;

          const correctAnswers = questionAnswers.reduce(
            (acc, answer) =>
              acc +
              answer.questions.filter((question) => question.isCorrect).length,
            0
          );

          practiceHistory.correctAnswers = correctAnswers;
          const accuracyRate = parseFloat(
            ((correctAnswers / totalQuestions) * 100).toFixed(2)
          );
          practiceHistory.accuracyRate = accuracyRate;
          break;
        }
      }

      console.log("3521 ~ submitPractice: ~ practiceHistory:", practiceHistory);

      const newPracticeHistory = new PracticeHistory(practiceHistory);
      await newPracticeHistory.save();

      return res.status(201).json({
        message: "Practice submitted successfully",
        data: newPracticeHistory,
      });
    } catch (error) {
      console.error("Error submitting practice:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  },

  startPractice: async (req, res) => {
    try {
      const { type, count } = req.body;
      if (!type || !count) {
        return res
          .status(400)
          .json({ message: "Missing type or count parameter" });
      }

      const questions = await Question.find({ type });
      let selectedQuestions = [];

      if (questions.length === 0) {
        return res
          .status(404)
          .json({ message: "No questions found for this type" });
      }

      const numToSelect = Math.min(parseInt(count, 10), questions.length);

      if (numToSelect >= questions.length) {
        selectedQuestions = questions;
      } else {
        const shuffled = questions.sort(() => 0.5 - Math.random());
        selectedQuestions = shuffled.slice(0, numToSelect);
      }

      return res.status(200).json(selectedQuestions);
    } catch (error) {
      console.error("Error starting practice:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  },

  getPracticeHistory: async (req, res) => {
    try {
      const userId = req.user.id;
      const { lessonType } = req.query;

      const searchCondition = { user: userId };

      if (lessonType) {
        searchCondition.lessonType = lessonType;
      }

      const practiceHistory = await PracticeHistory.find(searchCondition).sort({
        createdAt: -1,
      });

      return res.status(200).json(practiceHistory);
    } catch (error) {
      console.error("Error fetching practice history:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  },

  getAdminPracticeHistory: async (req, res) => {
    try {
      const { userId, lessonType } = req.query;

      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }

      const searchCondition = { user: userId };

      if (lessonType) {
        searchCondition.lessonType = lessonType;
      }

      const practiceHistory = await PracticeHistory.find(searchCondition).sort({
        createdAt: -1,
      });

      return res.status(200).json(practiceHistory);
    } catch (error) {
      console.error("Error fetching user practice history:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  },

  getPracticeHistoryById: async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const isAdmin = req.user.role === "ADMIN";

      const practiceHistory = await PracticeHistory.findById(id);

      if (!practiceHistory) {
        return res.status(404).json({ message: "Practice history not found" });
      }

      // Check if the user is authorized to view this practice history
      if (!isAdmin && practiceHistory.user.toString() !== userId) {
        return res.status(403).json({
          message: "You are not authorized to view this practice history",
        });
      }

      return res.status(200).json(practiceHistory);
    } catch (error) {
      console.error("Error fetching practice history by ID:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  },
};

module.exports = PracticeController;
