const express = require("express");
const QuestionController = require("../controllers/question");
const { checkLogin, isAdmin } = require("../middlewares/auth");

const questionRouter = express.Router();

// 🔒 SECURITY FIX: Add authentication to protect sensitive question data
questionRouter.get("/", checkLogin, QuestionController.getAll);
questionRouter.get("/:id", checkLogin, QuestionController.getById);
questionRouter.post("/", checkLogin, isAdmin, QuestionController.create);
questionRouter.put("/:id", checkLogin, isAdmin, QuestionController.update);
questionRouter.delete("/:id", checkLogin, isAdmin, QuestionController.delete);

module.exports = questionRouter;
