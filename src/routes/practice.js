const express = require("express");
const { checkLogin, isAdmin } = require("../middlewares/auth");
const PracticeController = require("../controllers/practice");

const practiceRouter = express.Router();

practiceRouter.post("/submit", checkLogin, PracticeController.submitPractice);
practiceRouter.post("/start", checkLogin, PracticeController.startPractice);
practiceRouter.get(
  "/history",
  checkLogin,
  PracticeController.getPracticeHistory
);
practiceRouter.get(
  "/history/:id",
  checkLogin,
  PracticeController.getPracticeHistoryById
);
practiceRouter.get(
  "/admin/history",
  checkLogin,
  isAdmin,
  PracticeController.getAdminPracticeHistory
);

module.exports = practiceRouter;
