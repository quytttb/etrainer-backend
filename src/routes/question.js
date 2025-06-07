const express = require("express");
const QuestionController = require("../controllers/question");

const questionRouter = express.Router();

questionRouter.get("/", QuestionController.getAll);
questionRouter.get("/:id", QuestionController.getById);
questionRouter.post("/", QuestionController.create);
questionRouter.put("/:id", QuestionController.update);
questionRouter.delete("/:id", QuestionController.delete);

module.exports = questionRouter;
