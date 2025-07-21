const express = require("express");
const ExamController = require("../controllers/exam");
const { checkLogin, isAdmin } = require("../middlewares/auth");
const ExamHistoryController = require("../controllers/examHistory");
const { validate, schemas, sanitizeInput } = require("../middlewares/validation");

const examRouter = express.Router();

// Apply input sanitization to all exam routes
examRouter.use(sanitizeInput);

examRouter.post("/submit", checkLogin, validate(schemas.examSubmission), ExamHistoryController.createExamHistory);
examRouter.get("/result/:id", checkLogin, ExamHistoryController.getExamHistory);
examRouter.get("/", checkLogin, ExamController.getAll);
examRouter.get("/:id", checkLogin, ExamController.getById);
examRouter.post("/", checkLogin, isAdmin, ExamController.create);
examRouter.put("/:id", checkLogin, isAdmin, ExamController.update);
examRouter.delete("/:id", checkLogin, isAdmin, ExamController.delete);

module.exports = examRouter;
