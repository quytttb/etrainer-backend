const Exam = require("../models/exam");

const ExamController = {
  getAll: async (req, res) => {
    try {
      const exams = await Exam.find()
        .sort("-createdAt")
        .populate("sections.questions")
        .exec();
      res.status(200).json(exams);
    } catch (error) {
      res.status(500).json({ message: "Error fetching exams" });
    }
  },
  getById: async (req, res) => {
    try {
      const exam = await Exam.findById(req.params.id)
        .populate("sections.questions")
        .exec();
      if (!exam) {
        return res.status(404).json({ message: "Exam not found" });
      }
      res.status(200).json(exam);
    } catch (error) {
      res.status(500).json({ message: "Error fetching exam" });
    }
  },
  create: async (req, res) => {
    try {
      const newExam = new Exam(req.body);
      await newExam.save();
      res.status(201).json(newExam);
    } catch (error) {
      res.status(500).json({ message: "Error creating exam" });
    }
  },
  update: async (req, res) => {
    try {
      const exam = await Exam.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
      }).exec();
      if (!exam) {
        return res.status(404).json({ message: "Exam not found" });
      }
      res.status(200).json(exam);
    } catch (error) {
      res.status(500).json({ message: "Error updating exam" });
    }
  },
  delete: async (req, res) => {
    try {
      const exam = await Exam.findByIdAndDelete(req.params.id).exec();
      if (!exam) {
        return res.status(404).json({ message: "Exam not found" });
      }
      res.status(200).json({ message: "Exam deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Error deleting exam" });
    }
  },
};

module.exports = ExamController;
