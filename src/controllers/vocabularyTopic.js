const VocabularyTopic = require("../models/vocabularyTopics");

const VocabularyTopicController = {
  getAll: async (req, res) => {
    try {
      const { sortBy = "-createdAt" } = req.query;
      const topics = await VocabularyTopic.find().sort(sortBy).exec();
      res.status(200).json(topics);
    } catch (error) {
      res.status(500).json({ message: "Error fetching topics" });
    }
  },
  getById: async (req, res) => {
    try {
      const topic = await VocabularyTopic.findById(req.params.id).exec();
      if (!topic) {
        return res.status(404).json({ message: "Topic not found" });
      }
      res.status(200).json(topic);
    } catch (error) {
      res.status(500).json({ message: "Error fetching topic" });
    }
  },
  create: async (req, res) => {
    try {
      const newTopic = new VocabularyTopic(req.body);
      await newTopic.save();
      res.status(201).json(newTopic);
    } catch (error) {
      res.status(500).json({ message: "Error creating topic" });
    }
  },
  update: async (req, res) => {
    try {
      const topic = await VocabularyTopic.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true }
      ).exec();
      if (!topic) {
        return res.status(404).json({ message: "Topic not found" });
      }
      res.status(200).json(topic);
    } catch (error) {
      res.status(500).json({ message: "Error updating topic" });
    }
  },
  delete: async (req, res) => {
    try {
      const topic = await VocabularyTopic.findByIdAndDelete(
        req.params.id
      ).exec();
      if (!topic) {
        return res.status(404).json({ message: "Topic not found" });
      }
      res.status(200).json({ message: "Topic deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Error deleting topic" });
    }
  },
};

module.exports = VocabularyTopicController;
