const Grammar = require("../models/grammar");

const GrammarController = {
  getAll: async (req, res) => {
    try {
      const { sortBy = "-createdAt" } = req.query;
      const grammars = await Grammar.find().sort(sortBy).exec();
      res.status(200).json(grammars);
    } catch (error) {
      res.status(500).json({ message: "Error fetching grammars" });
    }
  },
  getById: async (req, res) => {
    try {
      const grammar = await Grammar.findById(req.params.id).exec();
      if (!grammar) {
        return res.status(404).json({ message: "Grammar not found" });
      }
      res.status(200).json(grammar);
    } catch (error) {
      res.status(500).json({ message: "Error fetching Grammar" });
    }
  },
  create: async (req, res) => {
    try {
      const newGrammar = new Grammar(req.body);
      await newGrammar.save();
      res.status(201).json(newGrammar);
    } catch (error) {
      res.status(500).json({ message: "Error creating Grammar" });
    }
  },
  update: async (req, res) => {
    try {
      const grammar = await Grammar.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
      }).exec();
      if (!grammar) {
        return res.status(404).json({ message: "Grammar not found" });
      }
      res.status(200).json(grammar);
    } catch (error) {
      res.status(500).json({ message: "Error updating grammar" });
    }
  },
  delete: async (req, res) => {
    try {
      const grammar = await Grammar.findByIdAndDelete(req.params.id).exec();
      if (!grammar) {
        return res.status(404).json({ message: "Grammar not found" });
      }
      res.status(200).json({ message: "Grammar deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Error deleting grammar" });
    }
  },
};

module.exports = GrammarController;
