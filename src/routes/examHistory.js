const express = require("express");
const { checkLogin, isAdmin } = require("../middlewares/auth");
const ExamHistoryController = require("../controllers/examHistory");

const examHistoryRouter = express.Router();

examHistoryRouter.get("/", checkLogin, ExamHistoryController.getExamHistories);
examHistoryRouter.get(
  "/admin/history",
  checkLogin,
  isAdmin,
  ExamHistoryController.getAdminExamHistories
);

module.exports = examHistoryRouter;
