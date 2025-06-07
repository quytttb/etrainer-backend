const express = require("express");
const { checkLogin } = require("../middlewares/auth");
const ReminderController = require("../controllers/reminder");

const reminderRouter = express.Router();

reminderRouter.post("/", checkLogin, ReminderController.createReminder);

module.exports = reminderRouter;
