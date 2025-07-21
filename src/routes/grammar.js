const express = require("express");
const GrammarController = require("../controllers/grammars");
const { cacheMiddleware, CACHE_KEYS } = require("../configs/cache");
const { sanitizeInput } = require("../middlewares/validation");

const grammarRouter = express.Router();

// Apply input sanitization
grammarRouter.use(sanitizeInput);

// Cache grammar rules for 1 hour (static content)
grammarRouter.get("/", cacheMiddleware(3600, () => CACHE_KEYS.GRAMMAR_RULES), GrammarController.getAll);
grammarRouter.get("/:id", cacheMiddleware(1800), GrammarController.getById); // 30 minutes
grammarRouter.post("/", GrammarController.create);
grammarRouter.put("/:id", GrammarController.update);
grammarRouter.delete("/:id", GrammarController.delete);

module.exports = grammarRouter;
