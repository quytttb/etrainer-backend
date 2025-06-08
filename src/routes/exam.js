const express = require("express");
const ExamController = require("../controllers/exam");
const { checkLogin, isAdmin } = require("../middlewares/auth");
const ExamHistoryController = require("../controllers/examHistory");

const examRouter = express.Router();

examRouter.post("/submit", checkLogin, ExamHistoryController.createExamHistory);
examRouter.get("/result/:id", checkLogin, ExamHistoryController.getExamHistory);
examRouter.get("/", checkLogin, ExamController.getAll);
examRouter.get("/:id", checkLogin, ExamController.getById);
examRouter.post("/", checkLogin, isAdmin, ExamController.create);
examRouter.put("/:id", checkLogin, isAdmin, ExamController.update);
examRouter.delete("/:id", checkLogin, isAdmin, ExamController.delete);

module.exports = examRouter;
