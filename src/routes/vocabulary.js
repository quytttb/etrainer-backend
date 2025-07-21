const express = require("express");
const VocabularyTopicController = require("../controllers/vocabularyTopic");
const { cacheMiddleware, CACHE_KEYS } = require("../configs/cache");
const { sanitizeInput } = require("../middlewares/validation");

const vocabularyRouter = express.Router();

// Apply input sanitization
vocabularyRouter.use(sanitizeInput);

// Cache vocabulary topics for 1 hour (static content)
vocabularyRouter.get("/", cacheMiddleware(3600, () => CACHE_KEYS.VOCABULARY_TOPICS), VocabularyTopicController.getAll);
vocabularyRouter.get("/:id", cacheMiddleware(1800), VocabularyTopicController.getById); // 30 minutes
vocabularyRouter.post("/", VocabularyTopicController.create);
vocabularyRouter.put("/:id", VocabularyTopicController.update);
vocabularyRouter.delete("/:id", VocabularyTopicController.delete);

module.exports = vocabularyRouter;
