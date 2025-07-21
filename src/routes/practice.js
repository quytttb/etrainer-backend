const express = require("express");
const { checkLogin, isAdmin } = require("../middlewares/auth");
const PracticeController = require("../controllers/practice");
const { validate, schemas, sanitizeInput } = require("../middlewares/validation");

const practiceRouter = express.Router();

// Apply input sanitization to all practice routes
practiceRouter.use(sanitizeInput);

practiceRouter.post("/submit", checkLogin, validate(schemas.practiceSubmission), PracticeController.submitPractice);
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
