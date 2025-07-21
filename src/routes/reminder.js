const express = require("express");
const { checkLogin } = require("../middlewares/auth");
const ReminderController = require("../controllers/reminder");
const { validate, schemas, sanitizeInput } = require("../middlewares/validation");

const reminderRouter = express.Router();

// Apply input sanitization to all reminder routes
reminderRouter.use(sanitizeInput);

reminderRouter.post("/", checkLogin, validate(schemas.reminder), ReminderController.createReminder);

module.exports = reminderRouter;
