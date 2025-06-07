const Question = require("../models/question");

const QuestionController = {
  getAll: async (req, res) => {
    try {
      const { type } = req.query;

      const filter = {};
      if (type) {
        filter.type = type;
      }

      const questions = await Question.find(filter).sort("-createdAt").exec();
      res.status(200).json(questions);
    } catch (error) {
      res.status(500).json({ message: "Error fetching questions" });
    }
  },
  getById: async (req, res) => {
    try {
      const question = await Question.findById(req.params.id).exec();
      if (!question) {
        return res.status(404).json({ message: "Question not found" });
      }
      res.status(200).json(question);
    } catch (error) {
      res.status(500).json({ message: "Error fetching question" });
    }
  },
  create: async (req, res) => {
    try {
      const newQuestion = new Question(req.body);
      await newQuestion.save();
      res.status(201).json(newQuestion);
    } catch (error) {
      res.status(500).json({ message: "Error creating question" });
    }
  },
  update: async (req, res) => {
    try {
      const question = await Question.findByIdAndUpdate(
        req.params.id,
        req.body,
        {
          new: true,
        }
      ).exec();
      if (!question) {
        return res.status(404).json({ message: "Question not found" });
      }
      res.status(200).json(question);
    } catch (error) {
      res.status(500).json({ message: "Error updating question" });
    }
  },
  delete: async (req, res) => {
    try {
      const question = await Question.findByIdAndDelete(req.params.id).exec();
      if (!question) {
        return res.status(404).json({ message: "Question not found" });
      }
      res.status(200).json({ message: "Question deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Error deleting question" });
    }
  },
};

module.exports = QuestionController;
