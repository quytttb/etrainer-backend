const express = require("express");
const QuestionController = require("../controllers/question");
const { checkLogin, isAdmin } = require("../middlewares/auth");
const { validate, schemas, sanitizeInput } = require("../middlewares/validation");
const { cacheMiddleware, CACHE_KEYS } = require("../configs/cache");
const { paginate, optimizeQuery } = require("../middlewares/performance");

const questionRouter = express.Router();

// Apply input sanitization to all question routes
questionRouter.use(sanitizeInput);

// 🔒 SECURITY FIX: Add authentication to protect sensitive question data
questionRouter.get("/", checkLogin, paginate, optimizeQuery, cacheMiddleware(600), QuestionController.getAll); // 10 min cache
questionRouter.get("/:id", checkLogin, cacheMiddleware(1800), QuestionController.getById); // 30 min cache
questionRouter.post("/", checkLogin, isAdmin, validate(schemas.question), QuestionController.create);
questionRouter.put("/:id", checkLogin, isAdmin, validate(schemas.question), QuestionController.update);
questionRouter.delete("/:id", checkLogin, isAdmin, QuestionController.delete);

module.exports = questionRouter;
