const express = require("express");
const VocabularyTopicController = require("../controllers/vocabularyTopic");

const vocabularyRouter = express.Router();

vocabularyRouter.get("/", VocabularyTopicController.getAll);
vocabularyRouter.get("/:id", VocabularyTopicController.getById);
vocabularyRouter.post("/", VocabularyTopicController.create);
vocabularyRouter.put("/:id", VocabularyTopicController.update);
vocabularyRouter.delete("/:id", VocabularyTopicController.delete);

module.exports = vocabularyRouter;
