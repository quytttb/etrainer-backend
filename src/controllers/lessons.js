const Lesson = require("../models/lesson");

const LessonController = {
  getAll: async (req, res) => {
    try {
      const lessons = await Lesson.find().sort("-createdAt").exec();
      res.status(200).json(lessons);
    } catch (error) {
      res.status(500).json({ message: "Error fetching lessons" });
    }
  },
  getById: async (req, res) => {
    try {
      const lesson = await Lesson.findById(req.params.id).exec();
      if (!lesson) {
        return res.status(404).json({ message: "Lesson not found" });
      }
      res.status(200).json(lesson);
    } catch (error) {
      res.status(500).json({ message: "Error fetching lesson" });
    }
  },
  create: async (req, res) => {
    try {
      const newLesson = new Lesson(req.body);
      await newLesson.save();
      res.status(201).json(newLesson);
    } catch (error) {
      res.status(500).json({ message: "Error creating lesson" });
    }
  },
  update: async (req, res) => {
    try {
      const lesson = await Lesson.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
      }).exec();
      if (!lesson) {
        return res.status(404).json({ message: "Topic not found" });
      }
      res.status(200).json(lesson);
    } catch (error) {
      res.status(500).json({ message: "Error updating topic" });
    }
  },
  delete: async (req, res) => {
    try {
      const lesson = await Lesson.findByIdAndDelete(req.params.id).exec();
      if (!lesson) {
        return res.status(404).json({ message: "Lesson not found" });
      }
      res.status(200).json({ message: "Lesson deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Error deleting lesson" });
    }
  },
};

module.exports = LessonController;
